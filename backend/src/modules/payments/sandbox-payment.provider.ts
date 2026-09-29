import crypto from 'crypto';
import { 
  PaymentProvider, 
  CreatePaymentIntentParams, 
  PaymentIntentResult, 
  VerifyPaymentParams, 
  VerifyPaymentResult,
  PaymentLifecycleStatus
} from './payment-provider.interface.js';

export class SandboxPaymentProvider implements PaymentProvider {
  public name = 'DINEDECK_SANDBOX_GATEWAY';
  private secretKey: string;

  constructor(secretKey: string = 'dinedeck_sandbox_secret_2026') {
    this.secretKey = secretKey;
  }

  public async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const transactionRef = `TXN_IND_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const gatewayOrderId = `order_sbx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    return {
      paymentId: '', // To be filled after DB record creation
      transactionRef,
      gatewayOrderId,
      gatewayKey: 'rzp_test_dinedeck_sandbox_key',
      amountInr: params.amountInr,
      amountPaise: params.amountPaise,
      currency: 'INR',
      method: params.method,
      status: 'INITIATED',
      gatewayPayload: {
        gateway: 'DINEDECK_SANDBOX',
        gatewayOrderId,
        currency: 'INR',
        upiVpa: params.method === 'UPI' ? (params.upiVpa || 'customer@upi') : null,
        merchantVpa: 'dinedeck@icici',
        sandboxMode: true,
        supportedMethods: ['UPI', 'CARD', 'NET_BANKING', 'WALLET', 'CASH']
      },
      isSandbox: true
    };
  }

  public async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    // If Cash, automatic direct verification by captain/cashier
    if (params.transactionRef.startsWith('CASH_')) {
      return {
        isVerified: true,
        status: 'PAID',
        transactionRef: params.transactionRef,
        paidAt: new Date()
      };
    }

    // In sandbox, check for valid transaction format or failure trigger
    if (params.transactionRef.includes('FAIL')) {
      return {
        isVerified: false,
        status: 'FAILED',
        transactionRef: params.transactionRef,
        failureReason: 'Bank gateway declined transaction (Sandbox Simulation)'
      };
    }

    return {
      isVerified: true,
      status: 'PAID',
      transactionRef: params.transactionRef,
      gatewayPaymentId: `pay_sbx_${Date.now()}`,
      paidAt: new Date()
    };
  }

  public verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!signature) return false;
    const expected = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawBody)
      .digest('hex');
    return signature === expected || signature === 'SIG_UPI_VERIFIED_SANDBOX_SUCCESS';
  }

  public async processWebhookEvent(payload: any): Promise<{ paymentId: string; transactionRef: string; status: PaymentLifecycleStatus; paidAt?: Date }> {
    const paymentId = payload.paymentId || payload.payload?.payment?.entity?.id || '';
    const transactionRef = payload.transactionRef || payload.payload?.payment?.entity?.order_id || '';
    const event = payload.event || 'payment.captured';

    let status: PaymentLifecycleStatus = 'PROCESSING';
    if (event === 'payment.captured' || event === 'PAYMENT_SUCCESS') {
      status = 'PAID';
    } else if (event === 'payment.failed' || event === 'PAYMENT_FAILED') {
      status = 'FAILED';
    }

    return {
      paymentId,
      transactionRef,
      status,
      paidAt: status === 'PAID' ? new Date() : undefined
    };
  }
}
