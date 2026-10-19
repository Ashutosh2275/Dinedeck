import { prisma } from '../../config/db.js';
import { realtimeHub } from '../../realtime/websocket.js';
import { iamService } from '../iam/iam.service.js';
import {
  TIMEOUT_REJECTION_CODE,
  TIMEOUT_REJECTION_REASON,
  ORDER_ACCEPTANCE_TIMEOUT_MS
} from '../../constants/orderRejection.js';

export class OrderTimeoutService {
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();
  private sweeperInterval: NodeJS.Timeout | null = null;
  private isSweeping = false;

  /**
   * Start the background timeout monitor and recover pending timers
   */
  start(intervalMs: number = 3000): void {
    if (this.sweeperInterval) return;

    // Run recovery sweep immediately on boot
    this.sweepExpiredOrders().catch((err) => {
      console.error('[OrderTimeoutService] Initial startup sweep error:', err);
    });

    this.sweeperInterval = setInterval(() => {
      this.sweepExpiredOrders().catch((err) => {
        console.error('[OrderTimeoutService] Periodic sweep error:', err);
      });
    }, intervalMs);

    console.log(`[OrderTimeoutService] Initialized with ${intervalMs}ms sweep cadence`);
  }

  /**
   * Stop all active timers and background sweeper (useful for tests and graceful shutdown)
   */
  stop(): void {
    if (this.sweeperInterval) {
      clearInterval(this.sweeperInterval);
      this.sweeperInterval = null;
    }
    for (const timer of this.activeTimers.values()) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();
  }

  /**
   * Schedule exact 90-second timeout for an order
   */
  scheduleOrderTimeout(orderId: string, deadline: Date): void {
    this.cancelOrderTimeout(orderId);

    const delay = deadline.getTime() - Date.now();
    if (delay <= 0) {
      // Already expired
      this.handleOrderTimeout(orderId).catch((err) => {
        console.error(`[OrderTimeoutService] Failed executing immediate timeout for ${orderId}:`, err);
      });
      return;
    }

    const timer = setTimeout(() => {
      this.activeTimers.delete(orderId);
      this.handleOrderTimeout(orderId).catch((err) => {
        console.error(`[OrderTimeoutService] Failed executing timeout for ${orderId}:`, err);
      });
    }, delay);

    this.activeTimers.set(orderId, timer);
  }

  /**
   * Cancel timeout timer when order is manually accepted or rejected
   */
  cancelOrderTimeout(orderId: string): void {
    const timer = this.activeTimers.get(orderId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(orderId);
    }
  }

  /**
   * Atomically handle 90-second acceptance timeout
   */
  async handleOrderTimeout(orderId: string): Promise<boolean> {
    this.cancelOrderTimeout(orderId);

    const now = new Date();

    // 1. Atomic compare-and-swap: update only if status is still 'PLACED'
    const updateResult = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: 'PLACED'
      },
      data: {
        status: 'REJECTED',
        rejectionReasonCode: TIMEOUT_REJECTION_CODE,
        rejectionReason: TIMEOUT_REJECTION_REASON,
        rejectedAt: now,
        rejectedBy: 'SYSTEM'
      }
    });

    if (updateResult.count === 0) {
      // Order was already accepted, rejected, or cancelled concurrently
      return false;
    }

    // 2. Fetch full order details for cascading actions and realtime events
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, restaurant: true, bills: true }
    });

    if (!order) return false;

    // 3. Mark items as REJECTED
    await prisma.orderItem.updateMany({
      where: { orderId: order.id },
      data: {
        status: 'REJECTED',
        kitchenNotes: TIMEOUT_REJECTION_REASON
      }
    });

    // 4. Void pending bills
    await prisma.bill.updateMany({
      where: {
        orderId: order.id,
        paymentStatus: 'PENDING'
      },
      data: {
        paymentStatus: 'VOID'
      }
    });

    // 5. Void any KOTs if accidentally created
    await prisma.kotTicket.updateMany({
      where: { orderId: order.id },
      data: { status: 'CANCELLED' }
    });

    // 6. Record Status History
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'REJECTED',
        changedBy: 'SYSTEM',
        remarks: TIMEOUT_REJECTION_REASON
      }
    });

    // 7. Audit Log
    try {
      await iamService.logAuditEvent({
        actorId: 'SYSTEM',
        actorRole: 'SYSTEM',
        action: 'orders.auto_reject_timeout',
        resource: 'order',
        resourceId: order.id,
        scope: `REST:${order.restaurantId}|TABLE:${order.tableNumber}`,
        after: {
          status: 'REJECTED',
          reasonCode: TIMEOUT_REJECTION_CODE,
          reason: TIMEOUT_REJECTION_REASON
        }
      });
    } catch (auditErr) {
      console.warn('[OrderTimeoutService] Audit log non-fatal error:', auditErr);
    }

    // 8. Real-time WebSocket broadcasts
    realtimeHub.notifyRestaurantStaff(order.restaurantId, 'KDS_ORDER_REJECTED', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      reasonCode: TIMEOUT_REJECTION_CODE,
      reason: TIMEOUT_REJECTION_REASON,
      rejectedBy: 'SYSTEM',
      rejectedAt: now.toISOString()
    });

    realtimeHub.notifyRestaurantStaff(order.restaurantId, 'ORDER_TIMEOUT', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      timeoutSeconds: 90
    });

    if (order.userId) {
      realtimeHub.notifyUser(order.userId, 'ORDER_STATUS_CHANGED', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: 'REJECTED',
        reasonCode: TIMEOUT_REJECTION_CODE,
        remarks: TIMEOUT_REJECTION_REASON,
        timestamp: now.toISOString()
      });
    }

    // Emit global event hub notifications for Customer Web, Partner, and Super Admin
    realtimeHub.emit({
      eventType: 'ORDER_STATUS_CHANGED',
      entityId: order.id,
      restaurantId: order.restaurantId,
      orderId: order.id,
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: 'REJECTED',
        reasonCode: TIMEOUT_REJECTION_CODE,
        reason: TIMEOUT_REJECTION_REASON,
        remarks: TIMEOUT_REJECTION_REASON,
        rejectedBy: 'SYSTEM',
        rejectedAt: now.toISOString(),
        timestamp: now.toISOString(),
        userId: order.userId
      }
    });

    realtimeHub.emit({
      eventType: 'ORDER_TIMEOUT',
      entityId: order.id,
      restaurantId: order.restaurantId,
      orderId: order.id,
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        reasonCode: TIMEOUT_REJECTION_CODE,
        reason: TIMEOUT_REJECTION_REASON,
        timestamp: now.toISOString()
      }
    });

    return true;
  }

  /**
   * Sweeps database for any orders whose acceptance deadline has passed
   */
  async sweepExpiredOrders(): Promise<number> {
    if (this.isSweeping) return 0;
    this.isSweeping = true;

    try {
      const now = new Date();

      // 1. Process expired orders
      const expiredOrders = await prisma.order.findMany({
        where: {
          status: 'PLACED',
          acceptanceDeadline: {
            lte: now
          }
        },
        select: { id: true }
      });

      let handledCount = 0;
      for (const ord of expiredOrders) {
        const handled = await this.handleOrderTimeout(ord.id);
        if (handled) handledCount++;
      }

      // 2. Schedule upcoming timers for any pending orders that haven't been scheduled
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: 'PLACED',
          acceptanceDeadline: {
            gt: now
          }
        },
        select: { id: true, acceptanceDeadline: true }
      });

      for (const ord of pendingOrders) {
        if (ord.acceptanceDeadline && !this.activeTimers.has(ord.id)) {
          this.scheduleOrderTimeout(ord.id, ord.acceptanceDeadline);
        }
      }

      return handledCount;
    } finally {
      this.isSweeping = false;
    }
  }
}

export const orderTimeoutService = new OrderTimeoutService();
