import { prisma } from '../../config/db.js';
import { BillingEngine } from './billing.engine.js';
import { 
  TableDiningSessionSummary, 
  BillCalculationBreakdown, 
  BillingDashboardKpis, 
  HistoricalBillSummary,
  CashierShiftSummary,
  DiscountType,
  PaymentMethod
} from './billing.types.js';
import { iamService } from '../iam/iam.service.js';
import { realtimeHub } from '../../realtime/websocket.js';

export class BillingService {
  /**
   * 1. Get All Active Table Sessions & Running Bills
   */
  async getActiveTableSessions(params: {
    restaurantId: string;
    branchId?: string;
  }): Promise<{
    sessions: TableDiningSessionSummary[];
    kpis: BillingDashboardKpis;
  }> {
    const { restaurantId, branchId } = params;

    // Fetch Restaurant & Branch Info
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { branches: true }
    });

    if (!restaurant) throw new Error('Restaurant not found');

    // Fetch Tables with active sessions
    const tables = await prisma.table.findMany({
      where: {
        branch: {
          restaurantId,
          id: branchId && branchId !== 'ALL' ? branchId : undefined
        }
      },
      include: {
        branch: true,
        sessions: {
          where: { status: 'ACTIVE' },
          orderBy: { startedAt: 'desc' },
          include: {
            user: true,
            orders: {
              include: {
                items: true,
                kotTickets: true
              },
              orderBy: { createdAt: 'asc' }
            },
            bills: {
              include: { payments: true },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      },
      orderBy: { tableNumber: 'asc' }
    });

    const sessionsList: TableDiningSessionSummary[] = [];

    for (const table of tables) {
      const activeSession = table.sessions[0];
      if (!activeSession) continue;

      // Extract and classify orders
      const nonRejectedOrders = activeSession.orders.filter(o => o.status !== 'REJECTED' && o.status !== 'CANCELLED');
      const allItems = nonRejectedOrders.flatMap(o => o.items);
      const servedItems = allItems.filter(i => i.status === 'SERVED');
      const cookingItems = allItems.filter(i => ['QUEUED', 'PREPARING', 'READY'].includes(i.status));

      // Calculate bill breakdown across all non-rejected orders
      const billablePrices = allItems.map(i => ({ unitPrice: i.unitPrice, quantity: i.quantity }));

      const existingBill = activeSession.bills[0];
      const discountType: DiscountType = (existingBill?.discountType as DiscountType) || 'NONE';
      const discountValue = existingBill ? (discountType === 'PERCENTAGE' ? existingBill.discountPercent : existingBill.discountAmount) : 0;
      const paidAmount = existingBill?.payments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      const calc = BillingEngine.calculateBill({
        itemPrices: billablePrices,
        discountType,
        discountValue,
        discountReason: existingBill?.discountReason,
        complimentaryReason: existingBill?.complimentaryReason,
        cgstRatePercent: restaurant.cgstRatePercent,
        sgstRatePercent: restaurant.sgstRatePercent,
        serviceChargePercent: restaurant.serviceChargePercent,
        paidAmount
      });

      // Format chronological orders
      const chronologicalOrders = activeSession.orders.map(o => ({
        orderId: o.id,
        orderNumber: o.orderNumber,
        kotNumbers: o.kotTickets.map(k => k.kotNumber),
        status: o.status,
        priority: o.priority,
        createdAt: o.createdAt.toISOString(),
        servedAt: o.servedAt?.toISOString() || null,
        rejectionReason: o.rejectionReason || null,
        specialNotes: o.specialNotes || null,
        itemsCount: o.items.length,
        subtotal: o.items.reduce((s, i) => s + i.totalPrice, 0),
        items: o.items.map(i => ({
          id: i.id,
          orderId: o.id,
          orderNumber: o.orderNumber,
          menuItemId: i.menuItemId,
          name: i.name,
          variantName: i.variantName,
          addonsSummary: i.addonsSummary,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          status: i.status,
          stationCode: i.stationCode,
          course: i.course,
          isServed: i.status === 'SERVED',
          isCancelledOrRejected: o.status === 'CANCELLED' || o.status === 'REJECTED'
        }))
      }));

      const durationMinutes = Math.max(1, Math.floor((Date.now() - activeSession.startedAt.getTime()) / 60000));
      const hasServedItems = servedItems.length > 0;
      const isReadyForSettlement = hasServedItems && cookingItems.length === 0;

      sessionsList.push({
        sessionId: activeSession.id,
        sessionToken: activeSession.sessionToken,
        tableId: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        branchId: table.branchId,
        branchName: table.branch.name,
        restaurantId,
        guestName: activeSession.user?.name || null,
        guestPhone: activeSession.user?.phone || null,
        startedAt: activeSession.startedAt.toISOString(),
        durationMinutes,
        status: calc.isSettled ? 'COMPLETED' : existingBill ? 'SETTLING' : 'ACTIVE',

        totalOrdersCount: activeSession.orders.length,
        activeOrdersCount: nonRejectedOrders.length,
        servedItemsCount: servedItems.length,
        totalItemsCount: allItems.length,
        cookingItemsCount: cookingItems.length,
        hasServedItems,
        isReadyForSettlement,

        orders: chronologicalOrders,

        runningSubtotal: calc.subtotal,
        runningDiscount: calc.discountAmount,
        runningTaxableAmount: calc.taxableAmount,
        runningCgst: calc.cgstAmount,
        runningSgst: calc.sgstAmount,
        runningServiceCharge: calc.serviceChargeAmount,
        runningRoundOff: calc.roundOffAmount,
        runningGrandTotal: calc.grandTotal,

        billId: existingBill?.id || null,
        billNumber: existingBill?.billNumber || null,
        paymentStatus: (existingBill?.paymentStatus as any) || 'PENDING',
        paymentMethod: existingBill?.paymentMethod || null,
        paidAmount,
        remainingAmount: calc.remainingBalance,
        isPaid: calc.isSettled
      });
    }

    // Compute Dashboard KPIs
    const kpis = await this.getCashierKpis(restaurantId);

    return { sessions: sessionsList, kpis };
  }

  /**
   * 2. Get Single Table Session Bill with Authoritative Calculation
   */
  async getTableSessionBill(sessionId: string, restaurantId: string): Promise<{
    session: TableDiningSessionSummary;
    calculation: BillCalculationBreakdown;
    bill: any;
  }> {
    const session = await prisma.diningSession.findUnique({
      where: { id: sessionId },
      include: {
        restaurant: true,
        table: { include: { branch: true } },
        user: true,
        orders: {
          include: { items: true, kotTickets: true },
          orderBy: { createdAt: 'asc' }
        },
        bills: {
          include: { payments: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!session) throw new Error('Dining session not found');

    const nonRejectedOrders = session.orders.filter(o => o.status !== 'REJECTED' && o.status !== 'CANCELLED');
    const allItems = nonRejectedOrders.flatMap(o => o.items);
    const billablePrices = allItems.map(i => ({ unitPrice: i.unitPrice, quantity: i.quantity }));

    let bill = session.bills[0];

    // Ensure authoritative Bill record exists
    if (!bill && allItems.length > 0) {
      const billNumber = `INV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${session.table.tableNumber.padStart(2, '0')}-${session.orders[0]?.orderNumber.slice(-4) || '0001'}`;
      const firstOrder = nonRejectedOrders[0] || session.orders[0];

      const initialCalc = BillingEngine.calculateBill({
        itemPrices: billablePrices,
        cgstRatePercent: session.restaurant.cgstRatePercent,
        sgstRatePercent: session.restaurant.sgstRatePercent,
        serviceChargePercent: session.restaurant.serviceChargePercent
      });

      bill = await prisma.bill.create({
        data: {
          restaurantId,
          orderId: firstOrder.id,
          sessionId: session.id,
          tableNumber: session.table.tableNumber,
          billNumber,
          subtotal: initialCalc.subtotal,
          discountAmount: initialCalc.discountAmount,
          discountPercent: initialCalc.discountPercent,
          cgstAmount: initialCalc.cgstAmount,
          sgstAmount: initialCalc.sgstAmount,
          serviceCharge: initialCalc.serviceChargeAmount,
          roundOffAmount: initialCalc.roundOffAmount,
          grandTotal: initialCalc.grandTotal,
          paymentStatus: 'PENDING'
        },
        include: { payments: true }
      });
    }

    const discountType: DiscountType = (bill?.discountType as DiscountType) || 'NONE';
    const discountValue = bill ? (discountType === 'PERCENTAGE' ? bill.discountPercent : bill.discountAmount) : 0;
    const paidAmount = bill?.payments
      .filter((p: any) => p.status === 'PAID')
      .reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

    const calculation = BillingEngine.calculateBill({
      itemPrices: billablePrices,
      discountType,
      discountValue,
      discountReason: bill?.discountReason,
      complimentaryReason: bill?.complimentaryReason,
      cgstRatePercent: session.restaurant.cgstRatePercent,
      sgstRatePercent: session.restaurant.sgstRatePercent,
      serviceChargePercent: session.restaurant.serviceChargePercent,
      paidAmount
    });

    // Sync calculated amounts into Bill model
    if (bill && (bill.grandTotal !== calculation.grandTotal || bill.subtotal !== calculation.subtotal)) {
      bill = await prisma.bill.update({
        where: { id: bill.id },
        data: {
          subtotal: calculation.subtotal,
          discountAmount: calculation.discountAmount,
          discountPercent: calculation.discountPercent,
          cgstAmount: calculation.cgstAmount,
          sgstAmount: calculation.sgstAmount,
          serviceCharge: calculation.serviceChargeAmount,
          roundOffAmount: calculation.roundOffAmount,
          grandTotal: calculation.grandTotal
        },
        include: { payments: true }
      });
    }

    const { sessions } = await this.getActiveTableSessions({ restaurantId, branchId: session.table.branchId });
    const sessionSummary = sessions.find(s => s.sessionId === sessionId)!;

    return { session: sessionSummary, calculation, bill };
  }

  /**
   * 3. Apply Discount to Bill
   */
  async applyDiscount(params: {
    billId: string;
    discountType: DiscountType;
    discountValue: number;
    reason?: string;
    complimentaryReason?: string;
    actor: { id: string; name?: string; role?: string };
  }): Promise<{ bill: any; calculation: BillCalculationBreakdown }> {
    const { billId, discountType, discountValue, reason, complimentaryReason, actor } = params;

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        restaurant: true,
        session: {
          include: {
            orders: {
              where: { status: { notIn: ['REJECTED', 'CANCELLED'] } },
              include: { items: true }
            }
          }
        },
        payments: true
      }
    });

    if (!bill) throw new Error('Bill not found');
    if (bill.paymentStatus === 'PAID') throw new Error('Cannot apply discount to a settled bill');

    const allItems = bill.session?.orders.flatMap(o => o.items) || [];
    const billablePrices = allItems.map(i => ({ unitPrice: i.unitPrice, quantity: i.quantity }));
    const paidAmount = bill.payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);

    const calculation = BillingEngine.calculateBill({
      itemPrices: billablePrices,
      discountType,
      discountValue,
      discountReason: reason,
      complimentaryReason,
      cgstRatePercent: bill.restaurant.cgstRatePercent,
      sgstRatePercent: bill.restaurant.sgstRatePercent,
      serviceChargePercent: bill.restaurant.serviceChargePercent,
      paidAmount
    });

    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: {
        discountType,
        discountPercent: calculation.discountPercent,
        discountAmount: calculation.discountAmount,
        discountReason: reason || null,
        complimentaryReason: complimentaryReason || null,
        cgstAmount: calculation.cgstAmount,
        sgstAmount: calculation.sgstAmount,
        serviceCharge: calculation.serviceChargeAmount,
        roundOffAmount: calculation.roundOffAmount,
        grandTotal: calculation.grandTotal
      },
      include: { payments: true }
    });

    // Audit Logging
    await iamService.logAuditEvent({
      actorId: actor.id,
      actorRole: actor.role || 'CASHIER',
      action: 'billing.discount_apply',
      resource: 'bill',
      resourceId: billId,
      scope: `REST:${bill.restaurantId}`,
      after: {
        discountType,
        discountPercent: calculation.discountPercent,
        discountAmount: calculation.discountAmount,
        grandTotal: calculation.grandTotal,
        reason
      }
    });

    realtimeHub.notifyRestaurantStaff(bill.restaurantId, 'BILL_DISCOUNT_APPLIED', {
      billId,
      discountAmount: calculation.discountAmount,
      grandTotal: calculation.grandTotal
    });

    return { bill: updatedBill, calculation };
  }

  /**
   * 4. Settle Bill & Free Table
   */
  async settleBill(params: {
    billId: string;
    method: PaymentMethod;
    amountPaid: number;
    referenceNumber?: string;
    note?: string;
    splitItems?: Array<{ label: string; amount: number; method: PaymentMethod }>;
    actor: { id: string; name?: string; role?: string };
  }): Promise<{
    bill: any;
    payment: any;
    receiptText: string;
    calculation: BillCalculationBreakdown;
  }> {
    const { billId, method, amountPaid, referenceNumber, note, splitItems, actor } = params;

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        restaurant: true,
        session: {
          include: {
            table: { include: { branch: true } },
            orders: {
              where: { status: { notIn: ['REJECTED', 'CANCELLED'] } },
              include: { items: true }
            }
          }
        },
        payments: true
      }
    });

    if (!bill) throw new Error('Bill not found');
    if (bill.paymentStatus === 'PAID') throw new Error('Bill has already been settled');

    const allItems = bill.session?.orders.flatMap(o => o.items) || [];
    const billablePrices = allItems.map(i => ({ unitPrice: i.unitPrice, quantity: i.quantity }));
    const alreadyPaid = bill.payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
    const totalEffectivePaid = alreadyPaid + amountPaid;

    const discountType: DiscountType = (bill.discountType as DiscountType) || 'NONE';
    const discountValue = discountType === 'PERCENTAGE' ? bill.discountPercent : bill.discountAmount;

    const calculation = BillingEngine.calculateBill({
      itemPrices: billablePrices,
      discountType,
      discountValue,
      discountReason: bill.discountReason,
      complimentaryReason: bill.complimentaryReason,
      cgstRatePercent: bill.restaurant.cgstRatePercent,
      sgstRatePercent: bill.restaurant.sgstRatePercent,
      serviceChargePercent: bill.restaurant.serviceChargePercent,
      paidAmount: totalEffectivePaid
    });

    // Validate that full amount is covered
    if (calculation.remainingBalance > 0 && method !== 'SPLIT') {
      throw new Error(`Insufficient payment amount. Remaining balance: ₹${calculation.remainingBalance.toFixed(2)}`);
    }

    const transactionRef = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Atomic DB Settlement
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment Record
      const createdPayment = await tx.payment.create({
        data: {
          billId: bill.id,
          transactionRef,
          method,
          status: 'PAID',
          amount: amountPaid,
          operatorId: actor.id,
          operatorName: actor.name || 'Cashier',
          referenceNumber: referenceNumber || null,
          note: note || null
        }
      });

      // 2. Generate Thermal Receipt ESC/POS Representation
      const receiptText = BillingEngine.formatThermalReceipt({
        restaurant: {
          name: bill.restaurant.name,
          fullAddress: bill.restaurant.fullAddress,
          phone: bill.restaurant.phone,
          gstin: bill.restaurant.gstin,
          fssaiNumber: bill.restaurant.fssaiNumber,
          legalBusinessName: bill.restaurant.legalBusinessName
        },
        branchName: bill.session?.table?.branch?.name,
        billNumber: bill.billNumber,
        tableNumber: bill.tableNumber || bill.session?.table?.tableNumber || '12',
        sessionToken: bill.session?.sessionToken || 'SES-DIRECT',
        date: new Date(),
        items: allItems.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          variantName: i.variantName
        })),
        calculation,
        paymentMethod: method,
        transactionRef,
        cashierName: actor.name || 'Cashier'
      });

      // 3. Update Bill to PAID
      const updatedBill = await tx.bill.update({
        where: { id: bill.id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: method,
          paidAt: new Date(),
          settledBy: actor.name || 'Cashier',
          settledAt: new Date(),
          splitType: splitItems && splitItems.length > 0 ? 'SPLIT' : 'SINGLE',
          splitDetailsJson: splitItems ? JSON.stringify(splitItems) : null,
          thermalSlip: receiptText
        },
        include: { payments: true }
      });

      // 4. Mark all session orders COMPLETED and SERVED
      if (bill.session) {
        await tx.order.updateMany({
          where: { sessionId: bill.sessionId },
          data: { status: 'COMPLETED' }
        });

        // 5. Close Dining Session
        await tx.diningSession.update({
          where: { id: bill.sessionId! },
          data: {
            status: 'COMPLETED',
            endedAt: new Date()
          }
        });

        // 6. Reset Table Occupancy to VACANT for next guests
        if (bill.session.tableId) {
          await tx.table.update({
            where: { id: bill.session.tableId },
            data: { isOccupied: false }
          });
        }
      }

      // 7. Update Active Cashier Shift if open
      const currentShift = await tx.cashierShift.findFirst({
        where: {
          restaurantId: bill.restaurantId,
          status: 'OPEN'
        },
        orderBy: { openedAt: 'desc' }
      });

      if (currentShift) {
        const cashAdd = method === 'CASH' ? amountPaid : 0;
        const upiAdd = method === 'UPI' ? amountPaid : 0;
        const cardAdd = method === 'CARD' ? amountPaid : 0;

        await tx.cashierShift.update({
          where: { id: currentShift.id },
          data: {
            cashPaymentsCollected: currentShift.cashPaymentsCollected + cashAdd,
            upiPaymentsCollected: currentShift.upiPaymentsCollected + upiAdd,
            cardPaymentsCollected: currentShift.cardPaymentsCollected + cardAdd,
            expectedCash: currentShift.expectedCash + cashAdd
          }
        });
      }

      return { updatedBill, createdPayment, receiptText };
    });

    // Audit Log
    await iamService.logAuditEvent({
      actorId: actor.id,
      actorRole: actor.role || 'CASHIER',
      action: 'billing.bill_settle',
      resource: 'bill',
      resourceId: billId,
      scope: `REST:${bill.restaurantId}`,
      after: {
        billNumber: bill.billNumber,
        grandTotal: calculation.grandTotal,
        amountPaid,
        method,
        transactionRef
      }
    });

    // Canonical WebSocket Broadcasts
    realtimeHub.notifyRestaurantStaff(bill.restaurantId, 'BILL_SETTLED', {
      billId: bill.id,
      billNumber: bill.billNumber,
      tableNumber: bill.tableNumber,
      sessionId: bill.sessionId,
      grandTotal: calculation.grandTotal,
      paymentMethod: method,
      transactionRef
    });

    if (bill.session?.tableId) {
      realtimeHub.notifyRestaurantStaff(bill.restaurantId, 'TABLE_VACATED', {
        tableId: bill.session.tableId,
        tableNumber: bill.session.table.tableNumber
      });
    }

    return {
      bill: result.updatedBill,
      payment: result.createdPayment,
      receiptText: result.receiptText,
      calculation
    };
  }

  /**
   * 5. Void Bill with Reason & Reversal
   */
  async voidBill(params: {
    billId: string;
    reason: string;
    actor: { id: string; name?: string; role?: string };
  }): Promise<any> {
    const { billId, reason, actor } = params;

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { session: true }
    });

    if (!bill) throw new Error('Bill not found');

    const updated = await prisma.$transaction(async (tx) => {
      const vBill = await tx.bill.update({
        where: { id: billId },
        data: {
          isVoid: true,
          voidReason: reason,
          voidedBy: actor.name || 'Authorized Manager',
          voidedAt: new Date(),
          paymentStatus: 'VOID'
        }
      });

      if (bill.session?.tableId) {
        await tx.table.update({
          where: { id: bill.session.tableId },
          data: { isOccupied: false }
        });
      }

      return vBill;
    });

    await iamService.logAuditEvent({
      actorId: actor.id,
      actorRole: actor.role || 'MANAGER',
      action: 'billing.bill_void',
      resource: 'bill',
      resourceId: billId,
      scope: `REST:${bill.restaurantId}`,
      after: { reason, voidedBy: actor.name }
    });

    return updated;
  }

  /**
   * 6. Reprint Receipt with Counter Tracking
   */
  async reprintReceipt(params: {
    billId: string;
    reason: string;
    actor: { id: string; name?: string; role?: string };
  }): Promise<{ bill: any; thermalSlip: string }> {
    const { billId, reason, actor } = params;

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        restaurant: true,
        session: {
          include: {
            table: { include: { branch: true } },
            orders: {
              where: { status: { notIn: ['REJECTED', 'CANCELLED'] } },
              include: { items: true }
            }
          }
        },
        payments: true
      }
    });

    if (!bill) throw new Error('Bill not found');

    const allItems = bill.session?.orders.flatMap(o => o.items) || [];
    const billablePrices = allItems.map(i => ({ unitPrice: i.unitPrice, quantity: i.quantity }));
    const paidAmount = bill.payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);

    const discountType: DiscountType = (bill.discountType as DiscountType) || 'NONE';
    const discountValue = discountType === 'PERCENTAGE' ? bill.discountPercent : bill.discountAmount;

    const calculation = BillingEngine.calculateBill({
      itemPrices: billablePrices,
      discountType,
      discountValue,
      discountReason: bill.discountReason,
      cgstRatePercent: bill.restaurant.cgstRatePercent,
      sgstRatePercent: bill.restaurant.sgstRatePercent,
      serviceChargePercent: bill.restaurant.serviceChargePercent,
      paidAmount
    });

    const newReprintCount = bill.reprintCount + 1;

    const receiptText = BillingEngine.formatThermalReceipt({
      restaurant: {
        name: bill.restaurant.name,
        fullAddress: bill.restaurant.fullAddress,
        phone: bill.restaurant.phone,
        gstin: bill.restaurant.gstin,
        fssaiNumber: bill.restaurant.fssaiNumber,
        legalBusinessName: bill.restaurant.legalBusinessName
      },
      branchName: bill.session?.table?.branch?.name,
      billNumber: bill.billNumber,
      tableNumber: bill.tableNumber || '12',
      sessionToken: bill.session?.sessionToken || 'SES-PRINT',
      date: bill.paidAt || bill.createdAt,
      items: allItems.map(i => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        variantName: i.variantName
      })),
      calculation,
      paymentMethod: bill.paymentMethod || 'PAID',
      reprintCount: newReprintCount,
      cashierName: actor.name || 'Cashier'
    });

    const updated = await prisma.bill.update({
      where: { id: billId },
      data: {
        reprintCount: newReprintCount,
        lastPrintedAt: new Date(),
        thermalSlip: receiptText
      }
    });

    await iamService.logAuditEvent({
      actorId: actor.id,
      actorRole: actor.role || 'CASHIER',
      action: 'billing.receipt_reprint',
      resource: 'bill',
      resourceId: billId,
      scope: `REST:${bill.restaurantId}`,
      after: { reprintCount: newReprintCount, reason }
    });

    return { bill: updated, thermalSlip: receiptText };
  }

  /**
   * 7. Query Bill History with Rich Filtering
   */
  async getBillingHistory(params: {
    restaurantId: string;
    period?: 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL';
    search?: string;
    paymentMethod?: string;
    paymentStatus?: string;
  }): Promise<HistoricalBillSummary[]> {
    const { restaurantId, period = 'TODAY', search, paymentMethod, paymentStatus } = params;

    let dateGte: Date | undefined;
    const now = new Date();

    if (period === 'TODAY') {
      dateGte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'YESTERDAY') {
      dateGte = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    } else if (period === 'WEEK') {
      dateGte = new Date(now.getTime() - 7 * 86400000);
    } else if (period === 'MONTH') {
      dateGte = new Date(now.getTime() - 30 * 86400000);
    }

    const bills = await prisma.bill.findMany({
      where: {
        restaurantId,
        createdAt: dateGte ? { gte: dateGte } : undefined,
        paymentStatus: paymentStatus && paymentStatus !== 'ALL' ? paymentStatus : undefined,
        paymentMethod: paymentMethod && paymentMethod !== 'ALL' ? paymentMethod : undefined,
        OR: search ? [
          { billNumber: { contains: search } },
          { tableNumber: { contains: search } },
          { session: { user: { phone: { contains: search } } } },
          { session: { user: { name: { contains: search } } } }
        ] : undefined
      },
      include: {
        payments: true,
        session: {
          include: {
            user: true,
            orders: {
              include: { items: true }
            }
          }
        },
        order: {
          include: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return bills.map(b => {
      const items = b.session?.orders.flatMap(o => o.items) || b.order?.items || [];
      return {
        billId: b.id,
        billNumber: b.billNumber,
        orderNumber: b.order?.orderNumber || 'ORD-0000',
        sessionId: b.sessionId,
        tableNumber: b.tableNumber || '12',
        guestName: b.session?.user?.name || null,
        guestPhone: b.session?.user?.phone || null,
        itemsCount: items.length,
        subtotal: b.subtotal,
        discountAmount: b.discountAmount,
        cgstAmount: b.cgstAmount,
        sgstAmount: b.sgstAmount,
        serviceCharge: b.serviceCharge,
        roundOffAmount: b.roundOffAmount,
        grandTotal: b.grandTotal,
        paymentStatus: b.paymentStatus as any,
        paymentMethod: b.paymentMethod || 'CASH',
        paidAt: b.paidAt?.toISOString() || null,
        settledBy: b.settledBy || null,
        settledAt: b.settledAt?.toISOString() || null,
        isVoid: b.isVoid,
        voidReason: b.voidReason || null,
        reprintCount: b.reprintCount,
        createdAt: b.createdAt.toISOString(),
        items: items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice
        })),
        payments: b.payments.map(p => ({
          id: p.id,
          billId: p.billId,
          transactionRef: p.transactionRef,
          method: p.method as any,
          status: p.status,
          amount: p.amount,
          operatorId: p.operatorId,
          operatorName: p.operatorName,
          referenceNumber: p.referenceNumber,
          note: p.note,
          refundAmount: p.refundAmount,
          refundReason: p.refundReason,
          createdAt: p.createdAt.toISOString()
        }))
      };
    });
  }

  /**
   * 8. Cashier Dashboard KPIs
   */
  async getCashierKpis(restaurantId: string): Promise<BillingDashboardKpis> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [activeSessions, todayBills, todayPayments] = await Promise.all([
      prisma.diningSession.findMany({
        where: { restaurantId, status: 'ACTIVE' },
        include: {
          orders: {
            where: { status: { notIn: ['REJECTED', 'CANCELLED'] } },
            include: { items: true }
          }
        }
      }),
      prisma.bill.findMany({
        where: {
          restaurantId,
          createdAt: { gte: todayStart }
        }
      }),
      prisma.payment.findMany({
        where: {
          bill: { restaurantId },
          status: 'PAID',
          createdAt: { gte: todayStart }
        }
      })
    ]);

    const openTablesCount = activeSessions.length;
    const runningBillsCount = activeSessions.filter(s => s.orders.length > 0).length;
    const runningBillsTotalAmount = activeSessions.reduce((sum, s) => {
      const allItems = s.orders.flatMap(o => o.items);
      const subtotal = allItems.reduce((sub, i) => sub + i.totalPrice, 0);
      return sum + subtotal;
    }, 0);

    const paidBillsToday = todayBills.filter(b => b.paymentStatus === 'PAID');
    const billsAwaitingPaymentCount = todayBills.filter(b => b.paymentStatus === 'PENDING' || b.paymentStatus === 'PROCESSING').length;

    const cashCollectedToday = todayPayments.filter(p => p.method === 'CASH').reduce((s, p) => s + p.amount, 0);
    const upiCollectedToday = todayPayments.filter(p => p.method === 'UPI').reduce((s, p) => s + p.amount, 0);
    const cardCollectedToday = todayPayments.filter(p => p.method === 'CARD').reduce((s, p) => s + p.amount, 0);
    const grossRevenueToday = todayPayments.reduce((s, p) => s + p.amount, 0);

    const totalDiscountsToday = todayBills.reduce((s, b) => s + b.discountAmount, 0);
    const totalTaxesToday = todayBills.reduce((s, b) => s + (b.cgstAmount + b.sgstAmount), 0);
    const totalServiceChargeToday = todayBills.reduce((s, b) => s + b.serviceCharge, 0);
    const outstandingBalanceToday = todayBills
      .filter(b => b.paymentStatus !== 'PAID' && b.paymentStatus !== 'VOID')
      .reduce((s, b) => s + b.grandTotal, 0);

    return {
      restaurantId,
      openTablesCount,
      runningBillsCount,
      runningBillsTotalAmount: Math.round(runningBillsTotalAmount),
      billsAwaitingPaymentCount,
      paidBillsTodayCount: paidBillsToday.length,
      cashCollectedToday,
      upiCollectedToday,
      cardCollectedToday,
      grossRevenueToday,
      totalDiscountsToday,
      totalTaxesToday,
      totalServiceChargeToday,
      outstandingBalanceToday
    };
  }

  /**
   * 9. Shift & Cash Management
   */
  async openShift(params: {
    restaurantId: string;
    branchId?: string;
    userId: string;
    userName: string;
    openingCash: number;
  }): Promise<CashierShiftSummary> {
    const { restaurantId, branchId, userId, userName, openingCash } = params;

    // Check if open shift exists
    const existing = await prisma.cashierShift.findFirst({
      where: { restaurantId, status: 'OPEN' }
    });
    if (existing) return this.formatShift(existing);

    const shiftNumber = `SHIFT-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const created = await prisma.cashierShift.create({
      data: {
        restaurantId,
        branchId,
        userId,
        userName,
        shiftNumber,
        openingCash,
        expectedCash: openingCash,
        status: 'OPEN'
      }
    });

    await iamService.logAuditEvent({
      actorId: userId,
      actorRole: 'CASHIER',
      action: 'shift.open',
      resource: 'cashier_shift',
      resourceId: created.id,
      scope: `REST:${restaurantId}`,
      after: { shiftNumber, openingCash }
    });

    return this.formatShift(created);
  }

  async getCurrentShift(restaurantId: string): Promise<CashierShiftSummary | null> {
    const shift = await prisma.cashierShift.findFirst({
      where: { restaurantId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' }
    });
    return shift ? this.formatShift(shift) : null;
  }

  async recordCashMovement(params: {
    shiftId: string;
    type: 'CASH_IN' | 'CASH_OUT';
    amount: number;
    notes: string;
    actor: { id: string; name?: string };
  }): Promise<CashierShiftSummary> {
    const { shiftId, type, amount, notes, actor } = params;

    const shift = await prisma.cashierShift.findUnique({ where: { id: shiftId } });
    if (!shift || shift.status !== 'OPEN') throw new Error('Active shift not found');

    const cashInDelta = type === 'CASH_IN' ? amount : 0;
    const cashOutDelta = type === 'CASH_OUT' ? amount : 0;
    const expectedDelta = type === 'CASH_IN' ? amount : -amount;

    const updated = await prisma.cashierShift.update({
      where: { id: shiftId },
      data: {
        cashIn: shift.cashIn + cashInDelta,
        cashOut: shift.cashOut + cashOutDelta,
        expectedCash: shift.expectedCash + expectedDelta,
        notes: shift.notes ? `${shift.notes}\n[${type}] ₹${amount} - ${notes} (by ${actor.name || 'User'})` : `[${type}] ₹${amount} - ${notes}`
      }
    });

    return this.formatShift(updated);
  }

  async closeShift(params: {
    shiftId: string;
    actualCash: number;
    notes?: string;
    actor: { id: string; name?: string };
  }): Promise<CashierShiftSummary> {
    const { shiftId, actualCash, notes, actor } = params;

    const shift = await prisma.cashierShift.findUnique({ where: { id: shiftId } });
    if (!shift || shift.status !== 'OPEN') throw new Error('Active shift not found');

    const variance = actualCash - shift.expectedCash;

    const closed = await prisma.cashierShift.update({
      where: { id: shiftId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        actualCash,
        cashVariance: variance,
        closedBy: actor.name || 'Cashier',
        notes: notes ? `${shift.notes || ''}\nClosing Note: ${notes}` : shift.notes
      }
    });

    await iamService.logAuditEvent({
      actorId: actor.id,
      actorRole: 'CASHIER',
      action: 'shift.close',
      resource: 'cashier_shift',
      resourceId: shiftId,
      scope: `REST:${shift.restaurantId}`,
      after: {
        expectedCash: shift.expectedCash,
        actualCash,
        variance,
        notes
      }
    });

    return this.formatShift(closed);
  }

  private formatShift(s: any): CashierShiftSummary {
    return {
      id: s.id,
      restaurantId: s.restaurantId,
      branchId: s.branchId,
      userId: s.userId,
      userName: s.userName,
      shiftNumber: s.shiftNumber,
      openedAt: s.openedAt.toISOString(),
      closedAt: s.closedAt?.toISOString() || null,
      status: s.status,
      openingCash: s.openingCash,
      cashPaymentsCollected: s.cashPaymentsCollected,
      upiPaymentsCollected: s.upiPaymentsCollected,
      cardPaymentsCollected: s.cardPaymentsCollected,
      totalCollections: s.cashPaymentsCollected + s.upiPaymentsCollected + s.cardPaymentsCollected,
      cashIn: s.cashIn,
      cashOut: s.cashOut,
      expectedCash: s.expectedCash,
      actualCash: s.actualCash,
      cashVariance: s.cashVariance,
      notes: s.notes,
      closedBy: s.closedBy
    };
  }
}

export const billingService = new BillingService();
