// Canonical KDS Types for DINEDECK Kitchen Display System

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
  
  // Timing Telemetry
  createdAt: string;
  acceptedAt?: string | null;
  readyAt?: string | null;
  servedAt?: string | null;
  elapsedMinutes: number;
  dynamicEtaMinutes: number;
  remainingMinutes: number;
  
  // Items and Station Routing
  items: KdsItemDetail[];
  totalItemsCount: number;
  readyItemsCount: number;
  isFullyReady: boolean;
  stationCodes: string[];
  
  // Critical Kitchen Notes & Alerts
  specialNotes?: string | null;
  kitchenNotes?: string | null;
  dietaryAlerts?: string | null;
  rejectionReason?: string | null;
  recallReason?: string | null;
  holdReason?: string | null;
  isHeld: boolean;
  
  // Service & Steward Context
  waiterId?: string | null;
  waiterName?: string | null;
  expoCheckedAt?: string | null;
  waiterNotifiedAt?: string | null;
  
  // Linked KOT Tickets
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
