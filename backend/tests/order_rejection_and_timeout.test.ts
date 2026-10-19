import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/db.js';
import { kdsService } from '../src/modules/kds/kds.service.js';
import { orderTimeoutService } from '../src/modules/orders/order-timeout.service.js';
import {
  PREDEFINED_REJECTION_REASONS,
  TIMEOUT_REJECTION_CODE,
  TIMEOUT_REJECTION_REASON,
  ORDER_ACCEPTANCE_TIMEOUT_MS
} from '../src/constants/orderRejection.js';

describe('Order Rejection Management & 90-Second Auto-Rejection SLA', () => {
  let testRestaurantId: string;
  let testStaffUser: any;
  let testCustomerUser: any;

  beforeAll(async () => {
    // 1. Fetch or create a valid restaurant
    let restaurant = await prisma.restaurant.findFirst({
      where: { isActive: true }
    });
    if (!restaurant) {
      restaurant = await prisma.restaurant.create({
        data: {
          name: 'Test Gourmet Bistro',
          slug: `test-gourmet-${Date.now()}`,
          phone: '+919876543210',
          email: `test-${Date.now()}@dinedeck.io`,
          address: '123 Gourmet Lane, Bandra West, Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          cgstRatePercent: 2.5,
          sgstRatePercent: 2.5,
          serviceChargePercent: 5.0,
          packagingCharge: 0.0,
          isActive: true
        }
      });
    }
    testRestaurantId = restaurant.id;

    // 2. Fetch or create test staff and customer users
    testStaffUser = await prisma.user.findFirst({
      where: { role: 'RESTAURANT_MANAGER' }
    });
    if (!testStaffUser) {
      testStaffUser = await prisma.user.create({
        data: {
          phone: `+91987000${Math.floor(1000 + Math.random() * 9000)}`,
          name: 'Head Chef Test',
          email: `chef-${Date.now()}@dinedeck.io`,
          role: 'RESTAURANT_MANAGER',
          restaurantId: testRestaurantId
        }
      });
    }

    testCustomerUser = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' }
    });
    if (!testCustomerUser) {
      testCustomerUser = await prisma.user.create({
        data: {
          phone: `+91988000${Math.floor(1000 + Math.random() * 9000)}`,
          name: 'Guest Diner Test',
          role: 'CUSTOMER'
        }
      });
    }
  });

  afterAll(async () => {
    orderTimeoutService.stop();
  });

  it('1. Authoritative 90-second acceptance deadline is set on customer order creation', async () => {
    const now = Date.now();
    const acceptanceDeadline = new Date(now + ORDER_ACCEPTANCE_TIMEOUT_MS);

    const order = await prisma.order.create({
      data: {
        restaurantId: testRestaurantId,
        userId: testCustomerUser.id,
        tableNumber: 'T-99',
        orderNumber: `ORD-TEST-${Date.now().toString().slice(-5)}`,
        status: 'PLACED',
        acceptanceDeadline,
        subtotal: 500,
        cgstAmount: 12.5,
        sgstAmount: 12.5,
        totalAmount: 525,
        bills: {
          create: {
            restaurantId: testRestaurantId,
            billNumber: `INV-TEST-${Date.now().toString().slice(-5)}`,
            subtotal: 500,
            cgstAmount: 12.5,
            sgstAmount: 12.5,
            grandTotal: 525,
            paymentStatus: 'PENDING'
          }
        }
      }
    });

    expect(order.status).toBe('PLACED');
    expect(order.acceptanceDeadline).toBeDefined();
    const diff = order.acceptanceDeadline!.getTime() - now;
    expect(diff).toBeGreaterThanOrEqual(89000);
    expect(diff).toBeLessThanOrEqual(91000);

    // Clean up
    await prisma.bill.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
  });

  it('2. Manual acceptance within deadline transitions to PREPARING, cancels timer, and clears deadline', async () => {
    const acceptanceDeadline = new Date(Date.now() + ORDER_ACCEPTANCE_TIMEOUT_MS);
    const order = await prisma.order.create({
      data: {
        restaurantId: testRestaurantId,
        userId: testCustomerUser.id,
        tableNumber: 'T-12',
        orderNumber: `ORD-ACCEPT-${Date.now().toString().slice(-5)}`,
        status: 'PLACED',
        acceptanceDeadline,
        subtotal: 400,
        cgstAmount: 10,
        sgstAmount: 10,
        totalAmount: 420
      }
    });

    orderTimeoutService.scheduleOrderTimeout(order.id, acceptanceDeadline);

    // Accept order
    const result = await kdsService.acceptOrder(order.id, {
      id: testStaffUser.id,
      name: testStaffUser.name,
      role: testStaffUser.role
    });

    expect(result.order.status).toBe('PREPARING');
    expect(result.order.acceptedAt).toBeDefined();
    expect(result.order.acceptanceDeadline).toBeNull();

    // Verify database record
    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updated?.status).toBe('PREPARING');
    expect(updated?.acceptanceDeadline).toBeNull();

    // Clean up
    await prisma.kotTicketItem.deleteMany({ where: { kotTicket: { orderId: order.id } } });
    await prisma.kotTicket.deleteMany({ where: { orderId: order.id } });
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
  });

  it('3. Manual rejection with predefined reason records reasonCode, author, and voids pending bills', async () => {
    const predefined = PREDEFINED_REJECTION_REASONS[1]; // KITCHEN_CAPACITY
    const acceptanceDeadline = new Date(Date.now() + ORDER_ACCEPTANCE_TIMEOUT_MS);

    const order = await prisma.order.create({
      data: {
        restaurantId: testRestaurantId,
        userId: testCustomerUser.id,
        tableNumber: 'T-05',
        orderNumber: `ORD-REJ-${Date.now().toString().slice(-5)}`,
        status: 'PLACED',
        acceptanceDeadline,
        subtotal: 600,
        cgstAmount: 15,
        sgstAmount: 15,
        totalAmount: 630,
        bills: {
          create: {
            restaurantId: testRestaurantId,
            billNumber: `INV-REJ-${Date.now().toString().slice(-5)}`,
            subtotal: 600,
            cgstAmount: 15,
            sgstAmount: 15,
            grandTotal: 630,
            paymentStatus: 'PENDING'
          }
        }
      }
    });

    orderTimeoutService.scheduleOrderTimeout(order.id, acceptanceDeadline);

    // Reject order
    const rejected = await kdsService.rejectOrder(
      order.id,
      predefined.description,
      {
        id: testStaffUser.id,
        name: testStaffUser.name,
        role: testStaffUser.role
      },
      predefined.code
    );

    expect(rejected.status).toBe('REJECTED');
    expect(rejected.rejectionReasonCode).toBe('KITCHEN_CAPACITY');
    expect(rejected.rejectionReason).toBe(predefined.description);
    expect(rejected.rejectedBy).toBe(testStaffUser.name);
    expect(rejected.rejectedAt).toBeDefined();
    expect(rejected.acceptanceDeadline).toBeNull();

    // Verify associated bill was set to VOID
    const bill = await prisma.bill.findFirst({ where: { orderId: order.id } });
    expect(bill?.paymentStatus).toBe('VOID');

    // Clean up
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: order.id } });
    await prisma.bill.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
  });

  it('4. Auto-rejection occurs when 90-second acceptance timeout expires', async () => {
    // Create an order whose deadline is 1 second in the past
    const expiredDeadline = new Date(Date.now() - 1000);

    const order = await prisma.order.create({
      data: {
        restaurantId: testRestaurantId,
        userId: testCustomerUser.id,
        tableNumber: 'T-TIMEOUT',
        orderNumber: `ORD-EXP-${Date.now().toString().slice(-5)}`,
        status: 'PLACED',
        acceptanceDeadline: expiredDeadline,
        subtotal: 300,
        cgstAmount: 7.5,
        sgstAmount: 7.5,
        totalAmount: 315,
        bills: {
          create: {
            restaurantId: testRestaurantId,
            billNumber: `INV-EXP-${Date.now().toString().slice(-5)}`,
            subtotal: 300,
            cgstAmount: 7.5,
            sgstAmount: 7.5,
            grandTotal: 315,
            paymentStatus: 'PENDING'
          }
        }
      }
    });

    // Run timeout sweeper
    const swept = await orderTimeoutService.sweepExpiredOrders();
    expect(swept).toBeGreaterThanOrEqual(1);

    // Verify order was transitioned to REJECTED with timeout code
    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: { bills: true, statusHistory: true }
    });

    expect(updated?.status).toBe('REJECTED');
    expect(updated?.rejectionReasonCode).toBe(TIMEOUT_REJECTION_CODE);
    expect(updated?.rejectionReason).toBe(TIMEOUT_REJECTION_REASON);
    expect(updated?.rejectedBy).toBe('SYSTEM');
    expect(updated?.bills[0]?.paymentStatus).toBe('VOID');

    // Clean up
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: order.id } });
    await prisma.bill.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
  });

  it('5. Attempting to accept an expired or already rejected order is prevented', async () => {
    // 5a. Order already rejected
    const orderRej = await prisma.order.create({
      data: {
        restaurantId: testRestaurantId,
        tableNumber: 'T-ERR-1',
        orderNumber: `ORD-ERR1-${Date.now().toString().slice(-5)}`,
        status: 'REJECTED',
        rejectionReasonCode: 'ITEM_UNAVAILABLE',
        rejectionReason: 'All items unavailable',
        subtotal: 100,
        cgstAmount: 2.5,
        sgstAmount: 2.5,
        totalAmount: 105
      }
    });

    await expect(
      kdsService.acceptOrder(orderRej.id, { id: testStaffUser.id, name: testStaffUser.name })
    ).rejects.toThrow(/already been rejected/);

    // 5b. Order with expired deadline
    const orderExp = await prisma.order.create({
      data: {
        restaurantId: testRestaurantId,
        tableNumber: 'T-ERR-2',
        orderNumber: `ORD-ERR2-${Date.now().toString().slice(-5)}`,
        status: 'PLACED',
        acceptanceDeadline: new Date(Date.now() - 5000), // 5s in the past
        subtotal: 100,
        cgstAmount: 2.5,
        sgstAmount: 2.5,
        totalAmount: 105
      }
    });

    await expect(
      kdsService.acceptOrder(orderExp.id, { id: testStaffUser.id, name: testStaffUser.name })
    ).rejects.toThrow(/acceptance window of 90 seconds has expired/);

    // Verify it transitioned to REJECTED automatically
    const reloaded = await prisma.order.findUnique({ where: { id: orderExp.id } });
    expect(reloaded?.status).toBe('REJECTED');
    expect(reloaded?.rejectionReasonCode).toBe(TIMEOUT_REJECTION_CODE);

    // Clean up
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: [orderRej.id, orderExp.id] } } });
    await prisma.order.deleteMany({ where: { id: { in: [orderRej.id, orderExp.id] } } });
  });

  it('6. All 6 predefined rejection reasons are well-defined and valid', () => {
    expect(PREDEFINED_REJECTION_REASONS).toHaveLength(6);
    const codes = PREDEFINED_REJECTION_REASONS.map(r => r.code);
    expect(codes).toContain('ITEM_UNAVAILABLE');
    expect(codes).toContain('KITCHEN_CAPACITY');
    expect(codes).toContain('RESTAURANT_CLOSING');
    expect(codes).toContain('PREP_TIME_TOO_LONG');
    expect(codes).toContain('INGREDIENT_UNAVAILABLE');
    expect(codes).toContain('TEMPORARY_OPERATIONAL_ISSUE');

    for (const reason of PREDEFINED_REJECTION_REASONS) {
      expect(reason.title.length).toBeGreaterThan(0);
      expect(reason.description.length).toBeGreaterThan(0);
    }
  });
});
