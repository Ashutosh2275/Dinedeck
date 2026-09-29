// Complete TypeScript Definitions for DINEDECK Control Center Platform OS

export interface PlatformOverviewData {
  range: string;
  restaurants: {
    total: number;
    active: number;
    pendingReview: number;
    suspended: number;
    branches: number;
  };
  customers: {
    total: number;
    staffMembers: number;
    activeDiningSessions: number;
  };
  operations: {
    totalOrders: number;
    activeCookingTickets: number;
    openServiceRequests: number;
    openSupportTickets: number;
  };
  finance: {
    grossOrderValue: number;
    netRestaurantPayable: number;
    platformCommissionRevenue: number;
    totalTaxCollected: number;
    gstTaxCollected?: number;
    totalDiscounts: number;
    successfulPayments: number;
    failedPayments: number;
    refundsCount: number;
  };

}

export interface AdminRestaurant {
  id: string;
  name: string;
  slug?: string | null;
  legalBusinessName?: string | null;
  description?: string | null;
  cuisineType: string;
  phone?: string | null;
  email?: string | null;
  city: string;
  state: string;
  pincode?: string | null;
  fullAddress?: string | null;
  rating: number;
  isActive: boolean;
  status: 'APPLICATION' | 'PENDING_REVIEW' | 'VERIFICATION_REQUIRED' | 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'REJECTED' | 'OFFBOARDED' | 'ARCHIVED';
  commissionRatePercent: number;
  cgstRatePercent: number;
  sgstRatePercent: number;
  serviceChargePercent: number;
  packagingCharge?: number;
  gstin?: string | null;
  fssaiNumber?: string | null;
  panNumber?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  branches?: AdminBranch[];
  branchesCount?: number;
  tablesCount?: number;
  _count?: { orders: number; reviews: number; items: number; staff: number };
  analytics?: { totalRevenue: number; totalTaxes: number; commissionRate: number };
  createdAt?: string;
}

export interface AdminBranch {
  id: string;
  restaurantId: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
  tables?: AdminTable[];
}

export interface AdminTable {
  id: string;
  branchId: string;
  tableNumber: string;
  capacity: number;
  qrCodeToken: string;
  isOccupied: boolean;
  branch?: { name: string; restaurant?: { name: string } };
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurant?: { id?: string; name: string; city?: string; slug?: string };
  branch?: { name: string };
  tableNumber: string;
  status: 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
  subtotal: number;
  discountAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  serviceCharge?: number;
  totalAmount: number;
  specialNotes?: string | null;
  createdAt: string;
  user?: { id: string; name: string; phone?: string; email?: string };
  items?: { id: string; name: string; quantity: number; unitPrice: number; totalPrice: number; variantName?: string }[];
  bill?: { id: string; paymentStatus: string; grandTotal: number };
  bills?: AdminBill[];
  statusHistory?: { id: string; status: string; changedBy?: string; remarks?: string; timestamp: string }[];
}

export interface AdminBill {
  id: string;
  billNumber: string;
  orderId?: string;
  subtotal: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  serviceCharge: number;
  grandTotal: number;
  paymentStatus: 'PENDING' | 'INITIATED' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string | null;
  createdAt: string;
  paidAt?: string | null;
  restaurant?: { id: string; name: string };
  tableNumber?: string;
  payments?: AdminPayment[];
}

export interface AdminPayment {
  id: string;
  billId: string;
  amount: number;
  method: string;
  status: 'INITIATED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  transactionRef: string;
  gatewaySignature?: string | null;
  createdAt: string;
  bill?: { billNumber: string; grandTotal: number; restaurant?: { id: string; name: string } };
}

export interface AdminSettlement {
  id: string;
  settlementNumber: string;
  restaurantId: string;
  restaurant?: { id: string; name: string; city: string };
  periodStart: string;
  periodEnd: string;
  grossOrderValue: number;
  dinedeckCommission: number;
  taxCollected: number;
  discountAbsorbed: number;
  netPayable: number;
  status: 'PENDING' | 'PROCESSING' | 'SETTLED' | 'FAILED';
  payoutRef?: string | null;
  settledAt?: string | null;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'MERCHANT_ONBOARDING' | 'SETTLEMENT_PAYOUT' | 'COMMISSION_CHANGE' | 'HIGH_VALUE_REFUND';
  title: string;
  targetId: string;
  targetName: string;
  requester: string;
  status: string;
  createdAt: string;
  payload: any;
}

export interface ReconciliationException {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  restaurant: string;
  restaurantId: string;
  referenceId: string;
  expectedAmount: number;
  actualAmount: number;
  discrepancy: number;
  description: string;
  detectedAt: string;
}

export interface RestaurantRiskScore {
  restaurantId: string;
  restaurantName: string;
  city: string;
  status: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  metrics: {
    totalOrders: number;
    cancellationRate: number;
    failedPayments: number;
    refundCount: number;
  };
}

export interface DeviceHardware {
  id: string;
  name: string;
  type: 'KDS_TABLET' | 'THERMAL_PRINTER' | 'WEB_CLIENT' | 'ANDROID_APP';
  restaurantId: string;
  restaurantName: string;
  deviceModel: string;
  appVersion: string;
  ipAddress: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  websocketConnected: boolean;
  lastSeenAt: string;
  station: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  category?: string;
  globalEnabled?: boolean;
  isEnabled?: boolean;
  rolloutPercent?: number;
  scope?: 'GLOBAL' | 'TENANT' | 'BRANCH' | string;
  tenantOverrides?: Record<string, boolean>;
  updatedAt?: string;
}


export interface ConfigVersion {
  versionNumber: string;
  auditId: string;
  action: string;
  actorId?: string;
  timestamp: string;
  snapshot: any;
}

export interface AdminComplianceRecord {
  id: string;
  restaurantId: string;
  restaurantName: string;
  city: string;
  gstin?: string | null;
  fssaiNumber?: string | null;
  panNumber?: string | null;
  kycStatus: 'VERIFIED' | 'PENDING' | 'REQUIRES_REVISION' | 'EXPIRED' | 'REJECTED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  expiryDate?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
  restaurantId?: string | null;
  restaurantName?: string | null;
  createdAt: string;
  lastLogin?: string | null;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  scope?: string | null;
  result: string;
  beforeJson?: string | null;
  afterJson?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  actorId?: string;
  actorRole?: string;
  actorName?: string;
  actor?: { id: string; name: string; email: string };
}

export interface SystemHealthMetrics {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  timestamp: string;
  uptimeSeconds: number;
  dbLatencyMs: number;
  activeWebSocketClients: number;
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
  nodeVersion: string;
  platform: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  restaurantId?: string;
  restaurantName?: string;
  restaurant?: { id: string; name: string; city: string };
  user?: { id: string; name: string; email: string };
  title?: string;
  subject?: string;
  description?: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_REVIEW' | 'INVESTIGATING' | 'WAITING' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED';
  assignee?: string | null;
  assignedTo?: string | null;
  internalNotes?: string | null;
  createdAt: string;
}



export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
}
