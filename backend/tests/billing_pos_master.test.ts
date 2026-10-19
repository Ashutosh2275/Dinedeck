import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/config/db.js';
import { billingService } from '../src/modules/billing/billing.service.js';
import { BillingEngine } from '../src/modules/billing/billing.engine.js';
import { iamService } from '../src/modules/iam/iam.service.js';

describe('DINEDECK Billing & POS Workstation Master Suite', () => {
  let restaurantId: string;
  let tableId: string;
  let cashierId: string;
  let sessionId: string;
  let order1Id: string;
  let order2Id: string;
  let order3RejectedId: string;
  let butterChickenId: string;
  let naanId: string;
  let dessertId: string;

  beforeAll(async () => {
    // 1. Ensure IAM Definitions Seeded
    await iamService.seedIamDefinitions();

    // 2. Fetch seeded test restaurant
    let restaurant = await prisma.restaurant.findUnique({
      where: { id: 'rest_punjab_heritage' },
      include: { branches: { include: { tables: true } }, items: true }
    });

    if (!restaurant) {
      restaurant = await prisma.restaurant.findFirst({
        include: { branches: { include: { tables: true } }, items: true }
      });
    }

    if (!restaurant) {
      throw new Error('No test restaurant found in database');
    }

    restaurantId = restaurant.id;
    
    // Ensure table 12 exists
    let table = await prisma.table.findFirst({
      where: { branchId: restaurant.branches[0].id, tableNumber: '12' }
    });
    if (!table) {
      table = await prisma.table.create({
        data: {
          branchId: restaurant.branches[0].id,
          tableNumber: '12',
          capacity: 4,
          qrCodeToken: `qr_t12_${Date.now()}`
        }
      });
    }
    tableId = table.id;
    await prisma.diningSession.updateMany({ where: { tableId, status: 'ACTIVE' }, data: { status: 'COMPLETED' } });

    // Fetch Menu Items
    const items = await prisma.menuItem.findMany({ where: { restaurantId } });
    butterChickenId = items[0]?.id;
    naanId = items[1]?.id || items[0]?.id;
    dessertId = items[2]?.id || items[0]?.id;

    // Fetch Cashier User
    let cashier = await prisma.user.findFirst({ where: { email: 'cashier.priya@punjabheritage.com' } });
    if (!cashier) {
      cashier = await prisma.user.create({
        data: {
          email: 'cashier.priya@punjabheritage.com',
          name: 'Priya Cashier',
          passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
          role: 'RESTAURANT_STAFF'
        }
      });
    }
    cashierId = cashier.id;
  });

  it('1. Authoritative Calculation Engine with exact Decimal arithmetic', () => {
    // 2 x Butter Chicken (₹450) = 900 + 4 x Naan (₹80) = 320 -> Gross Subtotal = 1220
    const calc = BillingEngine.calculateBill({
      itemPrices: [
        { unitPrice: 450, quantity: 2 },
        { unitPrice: 80, quantity: 4 }
      ],
      discountType: 'PERCENTAGE',
      discountValue: 10, // 10% discount = 122.00
      cgstRatePercent: 2.5,
      sgstRatePercent: 2.5,
      serviceChargePercent: 5.0
    });

    expect(calc.subtotal).toBe(1220.00);
    expect(calc.discountAmount).toBe(122.00);
    expect(calc.taxableAmount).toBe(1098.00);
    expect(calc.cgstAmount).toBe(27.45);
    expect(calc.sgstAmount).toBe(27.45);
    expect(calc.serviceChargeAmount).toBe(54.90);
    // Exact: 1098 + 27.45 + 27.45 + 54.90 = 1207.80
    expect(calc.exactTotal).toBe(1207.80);
    expect(calc.grandTotal).toBe(1208); // Rounded
    expect(calc.roundOffAmount).toBe(0.20);
    expect(calc.remainingBalance).toBe(1208);
    expect(calc.isSettled).toBe(false);
  });

  it('2. Aggregates multiple customer orders on Table 12 into ONE Dining Session', async () => {
    // Start Dining Session on Table 12
    const session = await prisma.diningSession.create({
      data: {
        restaurantId,
        tableId,
        sessionToken: `ses_pos_test_${Date.now()}`,
        status: 'ACTIVE'
      }
    });
    sessionId = session.id;

    await prisma.table.update({
      where: { id: tableId },
      data: { isOccupied: true }
    });

    // Place Order 1: 2 Butter Chicken + 4 Naan (Served)
    const order1 = await prisma.order.create({
      data: {
        restaurantId,
        sessionId: session.id,
        tableNumber: '12',
        orderNumber: `ORD-POS-001-${Date.now().toString().slice(-4)}`,
        status: 'SERVED',
        subtotal: 1220,
        cgstAmount: 27.45,
        sgstAmount: 27.45,
        serviceCharge: 54.90,
        totalAmount: 1208,
        items: {
          create: [
            { menuItemId: butterChickenId, name: 'Butter Chicken Special', quantity: 2, unitPrice: 450, totalPrice: 900, status: 'SERVED', stationCode: 'CURRY' },
            { menuItemId: naanId, name: 'Garlic Butter Naan', quantity: 4, unitPrice: 80, totalPrice: 320, status: 'SERVED', stationCode: 'TANDOOR' }
          ]
        }
      }
    });
    order1Id = order1.id;

    // Place Order 2: 2 Gulab Jamun (Served)
    const order2 = await prisma.order.create({
      data: {
        restaurantId,
        sessionId: session.id,
        tableNumber: '12',
        orderNumber: `ORD-POS-002-${Date.now().toString().slice(-4)}`,
        status: 'SERVED',
        subtotal: 240,
        cgstAmount: 5.4,
        sgstAmount: 5.4,
        serviceCharge: 10.8,
        totalAmount: 262,
        items: {
          create: [
            { menuItemId: dessertId, name: 'Gulab Jamun Handi', quantity: 2, unitPrice: 120, totalPrice: 240, status: 'SERVED', stationCode: 'DESSERT' }
          ]
        }
      }
    });
    order2Id = order2.id;

    // Place Order 3: REJECTED order (Must be EXCLUDED from payable bill)
    const order3 = await prisma.order.create({
      data: {
        restaurantId,
        sessionId: session.id,
        tableNumber: '12',
        orderNumber: `ORD-POS-003-${Date.now().toString().slice(-4)}`,
        status: 'REJECTED',
        rejectionReason: 'Kitchen Out of Ingredients',
        subtotal: 500,
        cgstAmount: 12.5,
        sgstAmount: 12.5,
        serviceCharge: 25.0,
        totalAmount: 550,
        items: {
          create: [
            { menuItemId: butterChickenId, name: 'Butter Chicken Special', quantity: 1, unitPrice: 450, totalPrice: 450, status: 'REJECTED', stationCode: 'CURRY' }
          ]
        }
      }
    });
    order3RejectedId = order3.id;

    // Retrieve Active Sessions via BillingService
    const { sessions } = await billingService.getActiveTableSessions({ restaurantId });
    const table12Session = sessions.find(s => s.sessionId === session.id);

    expect(table12Session).toBeDefined();
    expect(table12Session!.tableNumber).toBe('12');
    expect(table12Session!.totalOrdersCount).toBe(3);
    expect(table12Session!.activeOrdersCount).toBe(2); // Excludes rejected order
    expect(table12Session!.servedItemsCount).toBe(3); // 2 Butter Chicken + 4 Naan + 2 Gulab Jamun

    // Total Gross Subtotal = 1220 (Order 1) + 240 (Order 2) = 1460 (Order 3 excluded!)
    expect(table12Session!.runningSubtotal).toBe(1460);
  });

  it('3. Applies Authorized Discount and verifies recalculated totals', async () => {
    const { session, calculation, bill } = await billingService.getTableSessionBill(sessionId, restaurantId);

    expect(bill).toBeDefined();
    expect(calculation.subtotal).toBe(1460);

    // Apply 10% Discount
    const { calculation: discountedCalc } = await billingService.applyDiscount({
      billId: bill.id,
      discountType: 'PERCENTAGE',
      discountValue: 10,
      reason: 'Loyalty Club Member 10%',
      actor: { id: cashierId, name: 'Priya Cashier', role: 'CASHIER' }
    });

    expect(discountedCalc.subtotal).toBe(1460);
    expect(discountedCalc.discountAmount).toBe(146); // 10% of 1460
    expect(discountedCalc.taxableAmount).toBe(1314);
    expect(discountedCalc.cgstAmount).toBe(32.85); // 2.5% of 1314
    expect(discountedCalc.sgstAmount).toBe(32.85); // 2.5% of 1314
    expect(discountedCalc.serviceChargeAmount).toBe(65.70); // 5.0% of 1314
    expect(discountedCalc.grandTotal).toBe(1445); // 1314 + 32.85 + 32.85 + 65.70 = 1445.40 -> 1445
  });

  it('4. Settles Bill, records payments, frees Table 12, and produces Thermal Slip', async () => {
    const { bill, calculation } = await billingService.getTableSessionBill(sessionId, restaurantId);

    // Settle with UPI Payment
    const settlementResult = await billingService.settleBill({
      billId: bill.id,
      method: 'UPI',
      amountPaid: calculation.grandTotal,
      referenceNumber: 'UPI/P2P/1234567890/BKC',
      note: 'Settled via QR Scanner',
      actor: { id: cashierId, name: 'Priya Cashier', role: 'CASHIER' }
    });

    expect(settlementResult.bill.paymentStatus).toBe('PAID');
    expect(settlementResult.bill.paymentMethod).toBe('UPI');
    expect(settlementResult.payment.status).toBe('PAID');
    expect(settlementResult.payment.amount).toBe(1445);
    expect(settlementResult.receiptText).toContain('PUNJAB HERITAGE');
    expect(settlementResult.receiptText).toContain('TAX INVOICE');
    expect(settlementResult.receiptText).toContain('PAID IN FULL');

    // Verify Dining Session is COMPLETED
    const closedSession = await prisma.diningSession.findUnique({ where: { id: sessionId } });
    expect(closedSession!.status).toBe('COMPLETED');
    expect(closedSession!.endedAt).not.toBeNull();

    // Verify Table 12 occupancy is RESET to VACANT
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    expect(table!.isOccupied).toBe(false);
  });

  it('5. Reprints receipt and tracks duplicate reprint counter', async () => {
    const bill = await prisma.bill.findFirst({ where: { sessionId } });

    const reprint = await billingService.reprintReceipt({
      billId: bill!.id,
      reason: 'Customer tax invoice copy request',
      actor: { id: cashierId, name: 'Priya Cashier' }
    });

    expect(reprint.bill.reprintCount).toBe(1);
    expect(reprint.thermalSlip).toContain('(DUPLICATE REPRINT #1)');
  });

  it('6. Cashier Shift Management: Open, Cash In/Out, and Close with Variance', async () => {
    // 1. Open Shift with ₹2,000 opening cash
    const shift = await billingService.openShift({
      restaurantId,
      userId: cashierId,
      userName: 'Priya Cashier',
      openingCash: 2000
    });

    expect(shift.status).toBe('OPEN');
    expect(shift.openingCash).toBe(2000);
    expect(shift.expectedCash).toBe(2000);

    // 2. Add Cash Movement: Petty Cash Out ₹300 for Dairy Delivery
    const afterCashOut = await billingService.recordCashMovement({
      shiftId: shift.id,
      type: 'CASH_OUT',
      amount: 300,
      notes: 'Amul Milk & Butter Petty Cash',
      actor: { id: cashierId, name: 'Priya Cashier' }
    });

    expect(afterCashOut.cashOut).toBe(300);
    expect(afterCashOut.expectedCash).toBe(1700); // 2000 - 300

    // 3. Close Shift with ₹1,700 actual cash (0 variance)
    const closedShift = await billingService.closeShift({
      shiftId: shift.id,
      actualCash: 1700,
      notes: 'Shift completed cleanly',
      actor: { id: cashierId, name: 'Priya Cashier' }
    });

    expect(closedShift.status).toBe('CLOSED');
    expect(closedShift.actualCash).toBe(1700);
    expect(closedShift.cashVariance).toBe(0);
  });

  it('7. Query Bill History with filters and search', async () => {
    const history = await billingService.getBillingHistory({
      restaurantId,
      period: 'TODAY'
    });

    expect(history.length).toBeGreaterThan(0);
    const settledBill = history.find(h => h.sessionId === sessionId);
    expect(settledBill).toBeDefined();
    expect(settledBill!.paymentStatus).toBe('PAID');
    expect(settledBill!.tableNumber).toBe('12');
    expect(settledBill!.itemsCount).toBeGreaterThanOrEqual(3);
  });
});
