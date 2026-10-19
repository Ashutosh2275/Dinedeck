import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { IndiaBillingEngine } from '../../common/money.js';
import { realtimeHub } from '../../realtime/websocket.js';
import { kdsService } from '../kds/kds.service.js';
import { orderTimeoutService } from './order-timeout.service.js';
import { ORDER_ACCEPTANCE_TIMEOUT_MS } from '../../constants/orderRejection.js';

const orderItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  variantName: z.string().optional(),
  addonsSummary: z.string().optional(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0)
});

const placeOrderSchema = z.object({
  restaurantId: z.string(),
  sessionId: z.string().optional(),
  tableNumber: z.string(),
  items: z.array(orderItemSchema).min(1),
  couponCode: z.string().optional(),
  specialNotes: z.string().optional(),
  idempotencyKey: z.string().optional()
});

export async function orderRoutes(fastify: FastifyInstance) {
  // Place Order
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = placeOrderSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ success: false, error: parse.error.errors });
    }
    const { restaurantId, sessionId, tableNumber, items, couponCode, specialNotes, idempotencyKey } = parse.data;
    const userAuth = (req as any).user;

    // Idempotency check
    if (idempotencyKey) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { items: true, statusHistory: true }
      });
      if (existing) {
        return reply.send({ success: true, message: 'Order already processed', data: existing });
      }
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });
    if (!restaurant) {
      return reply.status(404).send({ success: false, message: 'Restaurant not found' });
    }

    // Authoritative Item Price Verification (Anti-Tampering)
    const menuItemIds = items.map((i) => i.menuItemId).filter(Boolean) as string[];
    const dbMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId
      }
    });
    const dbItemMap = new Map(dbMenuItems.map((i) => [i.id, i]));

    // Calculate Subtotal with Server-Authoritative Pricing
    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const dbItem = item.menuItemId ? dbItemMap.get(item.menuItemId) : null;
      let unitPrice = item.unitPrice;
      if (dbItem) {
        // Enforce valid menu pricing: client price must match regular price or discounted price
        const isValidMenuPrice = (item.unitPrice === dbItem.price) ||
                                (dbItem.discountedPrice != null && item.unitPrice === dbItem.discountedPrice);
        if (!isValidMenuPrice && userAuth.role === 'CUSTOMER') {
          unitPrice = dbItem.discountedPrice ?? dbItem.price;
        }
      }
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      return {
        menuItemId: item.menuItemId,
        name: dbItem?.name || item.name,
        variantName: item.variantName || null,
        addonsSummary: item.addonsSummary || null,
        quantity: item.quantity,
        unitPrice,
        totalPrice: lineTotal
      };
    });

    // Calculate Coupon Discount
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode }
      });
      if (coupon && coupon.isActive && subtotal >= coupon.minOrderAmount) {
        const rawDiscount = (subtotal * coupon.discountPercent) / 100;
        discountAmount = Math.min(rawDiscount, coupon.maxDiscount);
      }
    }

    // Calculate authoritative India GST & Service Charge bill
    const billBreakdown = IndiaBillingEngine.calculateBill({
      subtotal,
      discountAmount,
      cgstRatePercent: restaurant.cgstRatePercent,
      sgstRatePercent: restaurant.sgstRatePercent,
      serviceChargePercent: restaurant.serviceChargePercent,
      packagingCharge: restaurant.packagingCharge
    });

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const isStaffPos = userAuth.role && userAuth.role !== 'CUSTOMER';
    const initialStatus = isStaffPos ? 'CONFIRMED' : 'PLACED';
    const acceptanceDeadline = !isStaffPos ? new Date(Date.now() + ORDER_ACCEPTANCE_TIMEOUT_MS) : null;

    // Resolve or Auto-Create DiningSession and mark table occupied so Cashier & Billing workstation tracks it immediately
    let resolvedSessionId = sessionId || null;
    try {
      const dbTable = await prisma.table.findFirst({
        where: {
          tableNumber,
          branch: { restaurantId }
        }
      });

      if (dbTable) {
        if (!resolvedSessionId) {
          let activeSession = await prisma.diningSession.findFirst({
            where: {
              tableId: dbTable.id,
              restaurantId,
              status: 'ACTIVE'
            }
          });

          if (!activeSession) {
            activeSession = await prisma.diningSession.create({
              data: {
                restaurantId,
                tableId: dbTable.id,
                userId: userAuth.id,
                sessionToken: `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                status: 'ACTIVE'
              }
            });
          }
          resolvedSessionId = activeSession.id;
        }

        if (!dbTable.isOccupied) {
          await prisma.table.update({
            where: { id: dbTable.id },
            data: { isOccupied: true }
          });
        }
      }
    } catch (sessionErr) {
      console.warn('[Orders] Session linkage non-fatal fallback:', sessionErr);
    }

    const order = await prisma.order.create({
      data: {
        restaurantId,
        sessionId: resolvedSessionId,
        userId: userAuth.id,
        tableNumber,
        orderNumber,
        status: initialStatus,
        acceptanceDeadline,
        subtotal: billBreakdown.subtotal,
        discountAmount: billBreakdown.discountAmount,
        cgstAmount: billBreakdown.cgstAmount,
        sgstAmount: billBreakdown.sgstAmount,
        serviceCharge: billBreakdown.serviceChargeAmount,
        roundOffAmount: billBreakdown.roundOffAmount,
        totalAmount: billBreakdown.grandTotal,
        specialNotes: specialNotes || null,
        idempotencyKey: idempotencyKey || null,
        items: {
          create: orderItemsData
        },
        statusHistory: {
          create: {
            status: initialStatus,
            changedBy: userAuth.id,
            remarks: isStaffPos ? 'Order created directly via Staff POS with Auto-KOT' : 'Order placed by customer from dining table'
          }
        }
      },
      include: {
        items: true,
        restaurant: true
      }
    });

    // Schedule 90-second acceptance timeout sweeper/timer for customer orders
    if (!isStaffPos && acceptanceDeadline) {
      orderTimeoutService.scheduleOrderTimeout(order.id, acceptanceDeadline);
    }

    // Create Initial Bill record
    const billNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const bill = await prisma.bill.create({
      data: {
        restaurantId,
        orderId: order.id,
        sessionId: resolvedSessionId,
        billNumber,
        subtotal: billBreakdown.subtotal,
        discountAmount: billBreakdown.discountAmount,
        cgstAmount: billBreakdown.cgstAmount,
        sgstAmount: billBreakdown.sgstAmount,
        serviceCharge: billBreakdown.serviceChargeAmount,
        roundOffAmount: billBreakdown.roundOffAmount,
        grandTotal: billBreakdown.grandTotal,
        paymentStatus: 'PENDING'
      }
    });

    // If placed by staff POS, auto-generate KOTs directly
    if (isStaffPos) {
      try {
        await kdsService.acceptOrder(order.id, { id: userAuth.id, name: userAuth.name, role: userAuth.role });
      } catch (kotErr) {
        console.error('[POS] Direct KOT Generation notice:', kotErr);
      }
    }

    // Realtime notification to restaurant kitchen staff & partners
    const orderPayload = {
      id: order.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      status: order.status,
      acceptanceDeadline: order.acceptanceDeadline,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      specialNotes: order.specialNotes,
      items: order.items,
      billId: bill.id,
      billNumber: bill.billNumber,
      paymentStatus: bill.paymentStatus,
      createdAt: order.createdAt,
      userId: userAuth.id
    };

    // Only emit incoming order pop-up chime for customer QR orders
    if (!isStaffPos) {
      realtimeHub.emit({
        eventType: 'ORDER_CREATED',
        entityId: order.id,
        restaurantId: order.restaurantId,
        orderId: order.id,
        billId: bill.id,
        payload: orderPayload
      });

      realtimeHub.emit({
        eventType: 'ORDER_PLACED',
        entityId: order.id,
        restaurantId: order.restaurantId,
        orderId: order.id,
        billId: bill.id,
        payload: orderPayload
      });
    } else {
      realtimeHub.emit({
        eventType: 'ORDER_STATUS_CHANGED',
        entityId: order.id,
        restaurantId: order.restaurantId,
        orderId: order.id,
        billId: bill.id,
        payload: { ...orderPayload, status: 'CONFIRMED' }
      });
    }

    realtimeHub.emit({
      eventType: 'BILL_CREATED',
      entityId: bill.id,
      restaurantId: order.restaurantId,
      orderId: order.id,
      billId: bill.id,
      payload: {
        billId: bill.id,
        orderId: order.id,
        billNumber: bill.billNumber,
        grandTotal: bill.grandTotal,
        paymentStatus: bill.paymentStatus,
        userId: userAuth.id
      }
    });

    return reply.status(201).send({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: order.status,
        acceptanceDeadline: order.acceptanceDeadline,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        cgstAmount: order.cgstAmount,
        sgstAmount: order.sgstAmount,
        serviceCharge: order.serviceCharge,
        roundOffAmount: order.roundOffAmount,
        totalAmount: order.totalAmount,
        billId: bill.id,
        paymentStatus: bill.paymentStatus,
        items: order.items,
        restaurant: {
          id: order.restaurant.id,
          name: order.restaurant.name,
          phone: order.restaurant.phone
        },
        createdAt: order.createdAt
      }
    });
  });

  // Get Orders History with Live Bills & Payments (Multi-tenant & Role aware)
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (req as any).user;
    const { restaurantId, status } = req.query as { restaurantId?: string; status?: string };

    const whereClause: any = {};

    if (userAuth.role === 'CUSTOMER') {
      // Customers may only view their own orders
      whereClause.userId = userAuth.id;
      if (restaurantId) {
        whereClause.restaurantId = restaurantId;
      }
    } else if (userAuth.role === 'DINEDECK_SUPER_ADMIN') {
      if (restaurantId) {
        whereClause.restaurantId = restaurantId;
      }
    } else {
      // Staff / Restaurant Owner / Manager
      const tenantRestId = userAuth.restaurantId || restaurantId;
      if (!tenantRestId) {
        return reply.status(400).send({ success: false, message: 'Restaurant context is required' });
      }
      whereClause.restaurantId = tenantRestId;
    }

    if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: true,
        items: true,
        statusHistory: {
          orderBy: { timestamp: 'asc' }
        },
        bills: {
          include: {
            payments: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    return reply.send({
      success: true,
      count: orders.length,
      data: orders
    });
  });

  // Get Order Details with Live Status & Authoritative Bill Details
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const userAuth = (req as any).user;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: true,
        items: true,
        statusHistory: { orderBy: { timestamp: 'asc' } },
        bills: {
          include: {
            payments: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!order) {
      return reply.status(404).send({ success: false, message: 'Order not found' });
    }

    // Tenant and customer ownership validation
    if (userAuth.role === 'CUSTOMER') {
      if (order.userId && order.userId !== userAuth.id) {
        return reply.status(403).send({ success: false, message: 'Forbidden: Access restricted to the customer who placed this order' });
      }
    } else if (userAuth.role !== 'DINEDECK_SUPER_ADMIN') {
      if (userAuth.restaurantId && order.restaurantId !== userAuth.restaurantId) {
        return reply.status(403).send({ success: false, message: 'Forbidden: Tenant isolation restricts accessing orders from other restaurants' });
      }
    }

    return reply.send({
      success: true,
      data: order
    });
  });
}
