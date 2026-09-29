export type BillStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'PARTIALLY_PAID' | 'FAILED' | 'REFUNDED' | 'VOID';
export type PaymentMethod = 'UPI' | 'CASH' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'SPLIT';
export type DiscountType = 'NONE' | 'PERCENTAGE' | 'FIXED' | 'COMPLIMENTARY';
export type SplitType = 'SINGLE' | 'EQUAL' | 'ITEM' | 'GUEST' | 'CUSTOM';

export interface BillableOrderItemSummary {
  id: string;
  orderId: string;
  orderNumber: string;
  menuItemId: string;
  name: string;
  variantName?: string | null;
  addonsSummary?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string; // QUEUED, PREPARING, READY, SERVED, CANCELLED, REJECTED
  stationCode: string;
  course: string;
  isServed: boolean;
  isCancelledOrRejected: boolean;
}

export interface ChronologicalOrderSummary {
  orderId: string;
  orderNumber: string;
  kotNumbers: string[];
  status: string;
  priority: string;
  createdAt: string;
  servedAt?: string | null;
  rejectionReason?: string | null;
  specialNotes?: string | null;
  itemsCount: number;
  subtotal: number;
  items: BillableOrderItemSummary[];
}

export interface TableDiningSessionSummary {
  sessionId: string;
  sessionToken: string;
  tableId: string;
  tableNumber: string;
  capacity: number;
  branchId: string;
  branchName?: string;
  restaurantId: string;
  guestName?: string | null;
  guestPhone?: string | null;
  startedAt: string;
  durationMinutes: number;
  status: 'ACTIVE' | 'SETTLING' | 'COMPLETED' | 'CANCELLED';
  
  // Aggregated Order & Item Counts
  totalOrdersCount: number;
  activeOrdersCount: number;
  servedItemsCount: number;
  totalItemsCount: number;
  cookingItemsCount: number;
  hasServedItems: boolean;
  isReadyForSettlement: boolean;
  
  // Chronological Orders
  orders: ChronologicalOrderSummary[];
  
  // Running Bill Calculation
  runningSubtotal: number;
  runningDiscount: number;
  runningTaxableAmount: number;
  runningCgst: number;
  runningSgst: number;
  runningServiceCharge: number;
  runningRoundOff: number;
  runningGrandTotal: number;
  
  // Bill & Settlement State
  billId?: string | null;
  billNumber?: string | null;
  paymentStatus: BillStatus;
  paymentMethod?: string | null;
  paidAmount: number;
  remainingAmount: number;
  isPaid: boolean;
}

export interface BillCalculationBreakdown {
  subtotal: number;
  discountType: DiscountType;
  discountPercent: number;
  discountAmount: number;
  discountReason?: string | null;
  complimentaryReason?: string | null;
  taxableAmount: number;
  cgstRatePercent: number;
  cgstAmount: number;
  sgstRatePercent: number;
  sgstAmount: number;
  serviceChargePercent: number;
  serviceChargeAmount: number;
  exactTotal: number;
  roundOffAmount: number;
  grandTotal: number;
  totalPaid: number;
  remainingBalance: number;
  isSettled: boolean;
}

export interface PaymentTransactionRecord {
  id: string;
  billId: string;
  transactionRef: string;
  method: PaymentMethod;
  status: string;
  amount: number;
  operatorId?: string | null;
  operatorName?: string | null;
  referenceNumber?: string | null;
  note?: string | null;
  refundAmount?: number;
  refundReason?: string | null;
  createdAt: string;
}

export interface PaymentSplitItem {
  id: string;
  label: string; // "Guest 1", "Split A", "Item: Butter Chicken"
  shareAmount: number;
  method: PaymentMethod;
  status: 'PENDING' | 'PAID' | 'FAILED';
  transactionRef?: string;
  paidAt?: string;
}

export interface CashierShiftSummary {
  id: string;
  restaurantId: string;
  branchId?: string | null;
  userId: string;
  userName: string;
  shiftNumber: string;
  openedAt: string;
  closedAt?: string | null;
  status: 'OPEN' | 'CLOSED';
  openingCash: number;
  cashPaymentsCollected: number;
  upiPaymentsCollected: number;
  cardPaymentsCollected: number;
  totalCollections: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  actualCash?: number | null;
  cashVariance?: number | null;
  notes?: string | null;
  closedBy?: string | null;
}

export interface BillingDashboardKpis {
  restaurantId: string;
  openTablesCount: number;
  runningBillsCount: number;
  runningBillsTotalAmount: number;
  billsAwaitingPaymentCount: number;
  paidBillsTodayCount: number;
  cashCollectedToday: number;
  upiCollectedToday: number;
  cardCollectedToday: number;
  grossRevenueToday: number;
  totalDiscountsToday: number;
  totalTaxesToday: number;
  totalServiceChargeToday: number;
  outstandingBalanceToday: number;
}

export interface HistoricalBillSummary {
  billId: string;
  billNumber: string;
  orderNumber: string;
  sessionId?: string | null;
  tableNumber: string;
  guestName?: string | null;
  guestPhone?: string | null;
  itemsCount: number;
  subtotal: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  serviceCharge: number;
  roundOffAmount: number;
  grandTotal: number;
  paymentStatus: BillStatus;
  paymentMethod: string;
  paidAt?: string | null;
  settledBy?: string | null;
  settledAt?: string | null;
  isVoid: boolean;
  voidReason?: string | null;
  reprintCount: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number }>;
  payments: PaymentTransactionRecord[];
}
