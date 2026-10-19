// Customer Web Types & Dining Schema for DINEDECK

export interface CustomerUser {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  defaultSpiceLevel?: string;
  dietaryPreference?: 'ALL' | 'VEG' | 'NON_VEG';
  specialDietNotes?: string;
}

export interface MenuItemVariant {
  id: string;
  name: string;
  price: number;
}

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number;
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
  spiceLevel?: string;
  category?: { id: string; name: string };
  variants?: MenuItemVariant[];
  addons?: MenuItemAddon[];
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  items: MenuItem[];
}

export interface CartCustomization {
  portionSize?: 'REGULAR' | 'LARGE' | 'HALF' | 'FULL' | string;
  spiceLevel?: 'MILD' | 'MEDIUM' | 'SPICY' | 'EXTRA_HOT' | string;
  selectedVariant?: MenuItemVariant;
  selectedAddons?: MenuItemAddon[];
  specialNotes?: string;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  isVeg: boolean;
  customization?: CartCustomization;
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
  specialNotes?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: string;
  status: 'PLACED' | 'ACCEPTED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | string;
  subtotal: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  serviceCharge: number;
  totalAmount?: number;
  specialNotes?: string | null;
  acceptanceDeadline?: string | null;
  rejectionReason?: string | null;
  rejectionReasonCode?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  createdAt: string;
  items: OrderItem[];
  restaurantId?: string;
  restaurant?: {
    id: string;
    name: string;
    slug?: string;
    fullAddress?: string;
    logoUrl?: string;
  };
  bills?: Bill[];
  statusHistory?: Array<{
    id?: string;
    status: string;
    timestamp: string;
    note?: string;
  }>;
}

export interface Bill {
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
  items: OrderItem[];
}

export interface DiningSession {
  restaurantId: string;
  restaurantName: string;
  branchId?: string;
  tableNumber: string;
  floor?: string;
  isActive: boolean;
  sessionTimestamp?: number; // Epoch ms timestamp of table QR verification (90-minute validity)
  customerCount?: number;
  assignedServer?: {
    id: string;
    name: string;
    role: string;
    assignedAt?: string;
  };
}

// Local Immutable Offline Receipt Copy (Stored on device)
export interface OfflineReceipt {
  receiptId: string;
  billId: string;
  orderNumber: string;
  restaurantId?: string;
  restaurantName: string;
  restaurantAddress?: string;
  tableNumber: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  taxTotal: number;
  serviceCharge: number;
  grandTotal: number;
  paymentMethod: string;
  paidAt: string;
}
