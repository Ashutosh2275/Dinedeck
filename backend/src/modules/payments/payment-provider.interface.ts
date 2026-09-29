export type PaymentMethodType = 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'CASH';

export type PaymentLifecycleStatus = 
  | 'PENDING'
  | 'INITIATED'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'EXPIRED';

export interface CreatePaymentIntentParams {
  billId: string;
  orderId: string;
  restaurantId: string;
  userId?: string;
  amountInr: number; // in INR decimal, e.g. 529.10
  amountPaise: number; // integer paise, e.g. 52910
  method: PaymentMethodType;
  upiVpa?: string;
  customerPhone?: string;
  customerEmail?: string;
  idempotencyKey?: string;
}

export interface PaymentIntentResult {
  paymentId: string;
  transactionRef: string;
  gatewayOrderId?: string;
  gatewayKey?: string;
  amountInr: number;
  amountPaise: number;
  currency: string;
  method: PaymentMethodType;
  status: PaymentLifecycleStatus;
  gatewayPayload: Record<string, any>;
  isSandbox: boolean;
}

export interface VerifyPaymentParams {
  paymentId: string;
  transactionRef: string;
  gatewaySignature?: string;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
}

export interface VerifyPaymentResult {
  isVerified: boolean;
  status: PaymentLifecycleStatus;
  transactionRef: string;
  gatewayPaymentId?: string;
  paidAt?: Date;
  failureReason?: string;
}

export interface PaymentProvider {
  name: string;
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  processWebhookEvent(payload: any): Promise<{ paymentId: string; transactionRef: string; status: PaymentLifecycleStatus; paidAt?: Date }>;
}
