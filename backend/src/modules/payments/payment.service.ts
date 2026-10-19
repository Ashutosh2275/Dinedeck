import { prisma } from '../../config/db.js';
import { Decimal } from 'decimal.js';
import { 
  PaymentProvider, 
  PaymentMethodType, 
  PaymentLifecycleStatus 
} from './payment-provider.interface.js';
import { SandboxPaymentProvider } from './sandbox-payment.provider.js';
import { realtimeHub } from '../../realtime/websocket.js';

export class PaymentService {
  private provider: PaymentProvider;

  constructor(provider?: PaymentProvider) {
    this.provider = provider || new SandboxPaymentProvider();
  }

  /**
   * Set custom payment provider (e.g. Razorpay in production)
   */
  public setProvider(provider: PaymentProvider) {
    this.provider = provider;
  }

  /**
   * Initialize Payment Intent with Atomic DB transaction & Idempotency
   */
  public async createPaymentIntent(params: {
    billId: string;
    method: PaymentMethodType;
    amount?: number;
    userId?: string;
    idempotencyKey?: string;
  }) {
    const { billId, method, userId, idempotencyKey } = params;

    // Check Bill and existing status
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        order: {
          include: { items: true }
        },
        restaurant: true,
        payments: true
      }
    });

    if (!bill) {
      throw { statusCode: 404, message: 'Bill not found' };
    }

    if (bill.paymentStatus === 'PAID') {
      throw { statusCode: 400, message: 'Bill is already marked PAID IN FULL' };
    }

    // Calculate remaining unbilled/unpaid balance
    const paidAmount = bill.payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = new Decimal(bill.grandTotal).minus(paidAmount);

    if (remainingBalance.lessThanOrEqualTo(0)) {
      throw { statusCode: 400, message: 'Bill has already been completely settled' };
    }

    // Server-authoritative amount validation (Anti-Tampering)
    let amountInr: number;
    if (params.amount !== undefined && params.amount !== null) {
      const requestedAmount = new Decimal(params.amount).toDecimalPlaces(2);
      if (requestedAmount.lessThanOrEqualTo(0)) {
        throw { statusCode: 400, message: 'Invalid payment amount specified' };
      }
      if (requestedAmount.greaterThan(remainingBalance)) {
        throw { statusCode: 400, message: `Payment amount ₹${requestedAmount} exceeds remaining bill balance ₹${remainingBalance}` };
      }
      amountInr = requestedAmount.toNumber();
    } else {
      amountInr = remainingBalance.toDecimalPlaces(2).toNumber();
    }
    const amountPaise = Math.round(amountInr * 100);

    // Call Payment Provider
    const intentResult = await this.provider.createPaymentIntent({
      billId: bill.id,
      orderId: bill.orderId,
      restaurantId: bill.restaurantId,
      userId,
      amountInr,
      amountPaise,
      method,
      idempotencyKey
    });

    // Atomic DB Record Creation
    const payment = await prisma.$transaction(async (tx) => {
      // Create Payment Record
      const createdPayment = await tx.payment.create({
        data: {
          billId: bill.id,
          transactionRef: intentResult.transactionRef,
          method,
          status: 'INITIATED',
          amount: amountInr,
          gatewayPayload: JSON.stringify(intentResult.gatewayPayload)
        }
      });

      // Update Bill Status to PROCESSING if currently PENDING
      await tx.bill.update({
        where: { id: bill.id },
        data: {
          paymentStatus: 'PROCESSING',
          paymentMethod: method
        }
      });

      return createdPayment;
    });

    // Canonical WebSocket Event: PAYMENT_INITIATED
    realtimeHub.emit({
      eventType: 'PAYMENT_INITIATED',
      entityId: payment.id,
      restaurantId: bill.restaurantId,
      orderId: bill.orderId,
      billId: bill.id,
      paymentId: payment.id,
      payload: {
        paymentId: payment.id,
        billId: bill.id,
        orderId: bill.orderId,
        amount: amountInr,
        method,
        status: 'INITIATED',
        transactionRef: payment.transactionRef,
        userId: bill.order.userId
      }
    });

    return {
      paymentId: payment.id,
      billId: bill.id,
      orderId: bill.orderId,
      transactionRef: payment.transactionRef,
      amount: amountInr,
      currency: 'INR',
      method,
      status: payment.status,
      gatewayOrderId: intentResult.gatewayOrderId,
      gatewayKey: intentResult.gatewayKey,
      isSandbox: intentResult.isSandbox
    };
  }

  /**
   * Authoritative Payment Verification with Atomic Settlement
   */
  public async verifyPayment(params: {
    paymentId: string;
    transactionRef: string;
    gatewaySignature?: string;
    gatewayPaymentId?: string;
  }) {
    const { paymentId, transactionRef, gatewaySignature, gatewayPaymentId } = params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        bill: {
          include: {
            order: {
              include: { items: true }
            },
            restaurant: true
          }
        }
      }
    });

    if (!payment) {
      throw { statusCode: 404, message: 'Payment record not found' };
    }

    // Verify transaction reference matches the initialized intent (Anti-Tampering)
    if (payment.transactionRef !== transactionRef) {
      throw { statusCode: 400, message: 'Transaction reference mismatch: Forged or invalid transactionRef' };
    }

    if (payment.status === 'PAID' && payment.bill.paymentStatus === 'PAID') {
      return {
        isVerified: true,
        status: 'PAID',
        paymentId: payment.id,
        billId: payment.billId,
        orderId: payment.bill.orderId,
        transactionRef: payment.transactionRef,
        amount: payment.amount,
        method: payment.method,
        paidAt: payment.bill.paidAt || new Date(),
        message: 'Payment already settled and verified'
      };
    }

    // Call Provider to verify authenticity
    const verification = await this.provider.verifyPayment({
      paymentId,
      transactionRef,
      gatewaySignature,
      gatewayPaymentId
    });

    if (!verification.isVerified || verification.status !== 'PAID') {
      // Atomic Update: Mark Payment as FAILED
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'FAILED' }
        });
        await tx.bill.update({
          where: { id: payment.billId },
          data: { paymentStatus: 'FAILED' }
        });
      });

      // WebSocket Event: PAYMENT_FAILED
      realtimeHub.emit({
        eventType: 'PAYMENT_FAILED',
        entityId: payment.id,
        restaurantId: payment.bill.restaurantId,
        orderId: payment.bill.orderId,
        billId: payment.billId,
        paymentId: payment.id,
        payload: {
          paymentId: payment.id,
          billId: payment.billId,
          orderId: payment.bill.orderId,
          status: 'FAILED',
          failureReason: verification.failureReason || 'Verification failed',
          userId: payment.bill.order.userId
        }
      });

      throw { statusCode: 400, message: verification.failureReason || 'Payment verification failed' };
    }

    // Atomic Database Settlement
    const settlementTime = verification.paidAt || new Date();
    await prisma.$transaction(async (tx) => {
      // 1. Atomic Check-and-Set Payment to PAID
      const updatedPaymentCount = await tx.payment.updateMany({
        where: {
          id: paymentId,
          status: { not: 'PAID' }
        },
        data: {
          status: 'PAID'
        }
      });

      if (updatedPaymentCount.count === 0 && payment.status !== 'PAID') {
        throw new Error('Concurrent settlement race condition prevented');
      }

      // 2. Mark Bill as PAID
      await tx.bill.update({
        where: { id: payment.billId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: payment.method,
          paidAt: settlementTime
        }
      });

      // 3. Mark Order as COMPLETED
      await tx.order.update({
        where: { id: payment.bill.orderId },
        data: { status: 'COMPLETED' }
      });

      // 4. Record Order Status History
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.bill.orderId,
          status: 'COMPLETED',
          changedBy: 'SYSTEM',
          remarks: `Paid ₹${payment.amount} via ${payment.method} (Ref: ${transactionRef})`
        }
      });
    });

    // Canonical WebSocket Event: PAYMENT_SUCCESS
    realtimeHub.emit({
      eventType: 'PAYMENT_SUCCESS',
      entityId: payment.id,
      restaurantId: payment.bill.restaurantId,
      orderId: payment.bill.orderId,
      billId: payment.billId,
      paymentId: payment.id,
      payload: {
        paymentId: payment.id,
        billId: payment.billId,
        orderId: payment.bill.orderId,
        amount: payment.amount,
        method: payment.method,
        status: 'PAID',
        transactionRef,
        paidAt: settlementTime.toISOString(),
        userId: payment.bill.order.userId
      }
    });

    return {
      isVerified: true,
      status: 'PAID',
      paymentId: payment.id,
      billId: payment.billId,
      orderId: payment.bill.orderId,
      transactionRef,
      amount: payment.amount,
      method: payment.method,
      paidAt: settlementTime
    };
  }

  /**
   * Process Gateway Webhooks with Signature Verification
   */
  public async handleWebhook(rawBody: string, signature: string, payload: any) {
    const isValid = this.provider.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw { statusCode: 401, message: 'Invalid webhook signature' };
    }

    const eventResult = await this.provider.processWebhookEvent(payload);
    if (eventResult.status === 'PAID' && eventResult.paymentId) {
      return this.verifyPayment({
        paymentId: eventResult.paymentId,
        transactionRef: eventResult.transactionRef
      });
    }

    return { received: true, status: eventResult.status };
  }

  /**
   * Retrieve authoritative live bill and payment details
   */
  public async getBillDetails(billId: string) {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        restaurant: true,
        order: {
          include: {
            items: true,
            statusHistory: { orderBy: { timestamp: 'asc' } }
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!bill) {
      throw { statusCode: 404, message: 'Bill not found' };
    }

    const latestPayment = bill.payments[0] || null;

    return {
      id: bill.id,
      restaurantId: bill.restaurantId,
      restaurantName: bill.restaurant.name,
      orderId: bill.orderId,
      orderNumber: bill.order.orderNumber,
      tableNumber: bill.order.tableNumber,
      billNumber: bill.billNumber,
      subtotal: bill.subtotal,
      discountAmount: bill.discountAmount,
      cgstAmount: bill.cgstAmount,
      sgstAmount: bill.sgstAmount,
      serviceCharge: bill.serviceCharge,
      roundOffAmount: bill.roundOffAmount,
      grandTotal: bill.grandTotal,
      paymentStatus: bill.paymentStatus,
      paymentMethod: bill.paymentMethod || latestPayment?.method || null,
      paidAt: bill.paidAt || (latestPayment?.status === 'PAID' ? latestPayment.updatedAt : null),
      items: bill.order.items.map((i) => ({
        id: i.id,
        menuItemId: i.menuItemId,
        name: i.name,
        variantName: i.variantName,
        addonsSummary: i.addonsSummary,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice
      })),
      latestPayment: latestPayment ? {
        id: latestPayment.id,
        transactionRef: latestPayment.transactionRef,
        method: latestPayment.method,
        status: latestPayment.status,
        amount: latestPayment.amount,
        createdAt: latestPayment.createdAt,
        updatedAt: latestPayment.updatedAt
      } : null
    };
  }
}

export const paymentService = new PaymentService();
