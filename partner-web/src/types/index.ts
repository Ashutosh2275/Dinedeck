// Core IAM, Business & KDS Types for DINEDECK Partner Web

export type RoleType =
  | 'RESTAURANT_OWNER'
  | 'GENERAL_MANAGER'
  | 'MANAGER'
  | 'CHEF'
  | 'KITCHEN_STAFF'
  | 'CAPTAIN'
  | 'WAITER'
  | 'CASHIER'
  | 'RECEPTIONIST'
  | 'INVENTORY_MANAGER'
  | 'SUPPORT_VIEW_ONLY'
  | 'DINEDECK_SUPER_ADMIN';

export interface Scope {
  type: 'PLATFORM' | 'RESTAURANT' | 'BRANCH' | 'FLOOR' | 'TABLE' | 'STATION' | 'DEPARTMENT' | 'SHIFT';
  value: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatarUrl?: string | null;
  restaurantId?: string | null;
}

export interface Restaurant {
  id: string;
  name: string;
  slug?: string | null;
  city: string;
  state: string;
  pincode?: string | null;
  fullAddress?: string | null;
  phone?: string | null;
  rating: number;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  status: string;
  legalBusinessName?: string | null;
  gstin?: string | null;
  fssaiNumber?: string | null;
  commissionRatePercent: number;
  cgstRatePercent: number;
  sgstRatePercent: number;
  serviceChargePercent: number;
}

export interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
}

export interface AuthData {
  user: User;
  restaurant: Restaurant | null;
  branch: Branch | null;
  assignedRoles: string[];
  permissions: string[];
  scopes: Scope[];
  accessToken: string;
  refreshToken?: string;
}

export interface PermissionCategory {
  key: string;
  label: string;
  description: string;
}

export interface PermissionItem {
  id: string;
  resource: string;
  action: string;
  category: string;
  categoryLabel: string;
  name: string;
  description: string;
}

export interface RoleTemplateItem {
  id: string;
  name: string;
  badgeColor: string;
  description: string;
  permissions: string[];
}

export interface FranchiseLocation {
  id: string;
  restaurantId: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  tableCount: number;
  staffCount: number;
}

export interface StaffMember {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  designation: string;
  primaryRole: string;
  roleName: string;
  badgeColor: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  isActive: boolean;
  isRootOwner: boolean;
  franchiseId?: string;
  franchiseName?: string;
  branchId?: string;
  floorScope: string;
  tableScope: string;
  stationScope?: string;
  departmentScope?: string;
  shiftScope?: string;
  scopes: { type: string; value: string }[];
  permissionsCount: number;
  totalPermissionsCount: number;
  effectivePermissions: string[];
  overrides: { permissionId: string; isGranted: boolean }[];
  lastActive?: string;
  roles?: { roleId: string; roleName?: string; scopes: Scope[] }[];
}



export interface OrderItem {
  id?: string;
  menuItemId?: string;
  name: string;
  variantName?: string | null;
  addonsSummary?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status?: string;
  stationCode?: string;
  course?: string;
  dietaryAlerts?: string | null;
  kitchenNotes?: string | null;
}

export interface BillSummary {
  id: string;
  billNumber: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  grandTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: string;
  status: 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
  subtotal: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  serviceCharge: number;
  totalAmount: number;
  specialNotes?: string | null;
  createdAt: string;
  items: OrderItem[];
  bills?: BillSummary[];
  user?: { name: string; phone?: string | null };
}

export interface ServiceCall {
  id: string;
  restaurantId?: string | null;
  tableNumber?: string | null;
  tableId?: string | null;
  type?: string | null;
  requestType?: string | null;
  notes?: string | null;
  customNote?: string | null;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED' | 'RESOLVED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  discountedPrice?: number | null;
  imageUrl?: string | null;
  isVeg: boolean;
  isBestseller?: boolean;
  isAvailable: boolean;
  preparationTime: number;
  stationCode?: string;
  spiceLevel?: number; // 1: Mild, 2: Medium, 3: Hot
  cogsCost?: number; // Cost of goods sold / raw material cost
  swiggyPrice?: number;
  zomatoPrice?: number;
  stockCount?: number; // Portions remaining before auto-86
  daypart?: 'ALL_DAY' | 'LUNCH_ONLY' | 'DINNER_ONLY' | 'HAPPY_HOURS';
  allergens?: string[];
  isJainFriendly?: boolean;
  isGlutenFree?: boolean;
  isVegan?: boolean;
  category?: { id: string; name: string };
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  items: MenuItem[];
}

export interface TableItem {
  id: string;
  tableNumber: string;
  capacity: number;
  floor?: string;
  qrCodeToken?: string | null;
  isOccupied: boolean;
  branch?: { id: string; name: string };
  currentOrder?: Order | null;
  assignedServer?: {
    id: string;
    name: string;
    role: string;
    assignedAt?: string;
  };
}

export interface WaiterPickupAlert {
  orderId: string;
  orderNumber: string;
  tableNumber: string;
  waiterId: string;
  waiterName: string;
  itemsReady: Array<{ id?: string; name: string; quantity: number; stationCode?: string }>;
  stationName?: string;
  notifiedAt: string;
}

export interface TableAllocationSurveillanceItem {
  tableId: string;
  tableNumber: string;
  capacity: number;
  floor: string;
  isOccupied: boolean;
  assignedServer: {
    waiterId: string;
    waiterName: string;
    waiterRole: string;
    assignedAt: string;
    assignedBy?: string;
  };
  activeSession: {
    sessionId: string;
    startedAt: string;
    durationMinutes: number;
    activeOrdersCount: number;
    totalItemsCount: number;
  } | null;
  pendingPickups: Array<{
    orderId: string;
    orderNumber: string;
    itemsCount: number;
    itemNames: string[];
    readyAt: string;
    waiterNotifiedAt?: string | null;
    elapsedSeconds: number;
    slaLevel: 'GREEN' | 'AMBER' | 'RED_BREACH';
  }>;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  action: string;
  resource: string;
  resourceId: string;
  scope?: string | null;
  beforeJson?: string | null;
  afterJson?: string | null;
  result: string;
  createdAt: string;
  actor?: { id?: string; name?: string; email?: string; role?: string; branchId?: string };
}

export interface ShiftOverview {
  restaurantId?: string;
  ordersToday: number;
  activeOrders: number;
  cookingQueue: number;
  pendingServiceCalls: number;
  settledRevenue: number;
  settledOrdersCount: number;
  totalTaxes: number;
  activeSessions: number;
  totalTables: number;
  occupiedTables: number;
  occupancyRatePercent: number;
}

// -----------------------------------------------------------------------------
// KDS PRODUCTION TYPES
// -----------------------------------------------------------------------------

export type KdsOrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'QUEUED'
  | 'PREPARING'
  | 'READY'
  | 'EXPO_CHECK'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'ON_HOLD'
  | 'DELAYED'
  | 'RECALLED'
  | 'RE_FIRE';

export type KdsItemStatus =
  | 'QUEUED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'HOLD'
  | 'RE_FIRE';

export type KdsPriority =
  | 'NORMAL'
  | 'HIGH'
  | 'RUSH'
  | 'VIP'
  | 'ALLERGY'
  | 'RE_FIRE';

export type KdsCourse =
  | 'STARTER'
  | 'MAIN'
  | 'DESSERT'
  | 'BEVERAGE';

export type KdsSlaStatus =
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'DELAYED'
  | 'SLA_BREACHED';

export interface KdsStationSummary {
  id: string;
  code: string;
  name: string;
  isExpo: boolean;
  activeTicketsCount: number;
  preparingItemsCount: number;
  readyItemsCount: number;
  printerIp?: string | null;
  printerStatus: 'ONLINE' | 'OFFLINE' | 'PAPER_OUT' | 'ERROR';
}

export interface KdsItemDetail {
  id: string;
  orderItemId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  variantName?: string | null;
  addonsSummary?: string | null;
  stationCode: string;
  course: KdsCourse;
  status: KdsItemStatus;
  dietaryAlerts?: string | null;
  kitchenNotes?: string | null;
  isHeld: boolean;
  isRefire: boolean;
  startedAt?: string | null;
  readyAt?: string | null;
  preparationTimeMinutes: number;
}

export interface KdsTicketCard {
  id: string;
  orderNumber: string;
  kotNumber?: string;
  restaurantId: string;
  tableNumber: string;
  sessionId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  status: KdsOrderStatus;
  priority: KdsPriority;
  slaStatus: KdsSlaStatus;
  
  createdAt: string;
  acceptedAt?: string | null;
  readyAt?: string | null;
  servedAt?: string | null;
  elapsedMinutes: number;
  dynamicEtaMinutes: number;
  remainingMinutes: number;
  
  items: KdsItemDetail[];
  totalItemsCount: number;
  readyItemsCount: number;
  isFullyReady: boolean;
  stationCodes: string[];
  
  specialNotes?: string | null;
  kitchenNotes?: string | null;
  dietaryAlerts?: string | null;
  rejectionReason?: string | null;
  recallReason?: string | null;
  holdReason?: string | null;
  isHeld: boolean;
  
  waiterId?: string | null;
  waiterName?: string | null;
  expoCheckedAt?: string | null;
  waiterNotifiedAt?: string | null;
  
  kotTickets: Array<{
    id: string;
    kotNumber: string;
    stationCode: string;
    status: string;
    reprintCount: number;
    printedAt?: string | null;
  }>;
}

export interface KdsKitchenAnalytics {
  restaurantId: string;
  period: string;
  ordersPerHour: number;
  totalOrdersProcessed: number;
  avgAcceptanceTimeSeconds: number;
  avgPreparationTimeMinutes: number;
  avgReadyTimeMinutes: number;
  slaCompliancePercent: number;
  delayedOrdersCount: number;
  delayedOrdersPercent: number;
  refireRatePercent: number;
  cancellationRatePercent: number;
  stationUtilization: Array<{
    stationCode: string;
    stationName: string;
    activeLoad: number;
    avgPrepTimeMinutes: number;
    delayContributionPercent: number;
    isBottleneck: boolean;
  }>;
  bottleneckDiagnosis?: string | null;
}

export interface KitchenKdsSetting {
  id?: string;
  restaurantId: string;
  autoGenerateKot: boolean;
  autoPrintKot: boolean;
  defaultPrepTimeMinutes: number;
  warningThresholdMinutes: number;
  breachThresholdMinutes: number;
  alertSoundEnabled: boolean;
  courseSequencingEnabled: boolean;
  requireExpoCheck: boolean;
  densityMode: string;
}

// -------------------------------------------------------------
// BILLING & POS WORKSTATION TYPES
// -------------------------------------------------------------

export type BillStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'PARTIALLY_PAID' | 'FAILED' | 'REFUNDED' | 'VOID';
export type PaymentMethod = 'UPI' | 'CASH' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'SPLIT';
export type DiscountType = 'NONE' | 'PERCENTAGE' | 'FIXED' | 'COMPLIMENTARY';

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
  status: string;
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
  
  totalOrdersCount: number;
  activeOrdersCount: number;
  servedItemsCount: number;
  totalItemsCount: number;
  cookingItemsCount: number;
  hasServedItems: boolean;
  isReadyForSettlement: boolean;
  
  orders: ChronologicalOrderSummary[];
  
  runningSubtotal: number;
  runningDiscount: number;
  runningTaxableAmount: number;
  runningCgst: number;
  runningSgst: number;
  runningServiceCharge: number;
  runningRoundOff: number;
  runningGrandTotal: number;
  
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
  label: string;
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
