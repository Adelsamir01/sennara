export interface PaymentIntent {
  provider: string;
  amountEgp: number;
  currency: 'EGP';
  orderId: string;
  checkoutUrl?: string;
  token?: string;
  referenceNumber?: string;
  expiresAt?: Date;
  metadata: Record<string, unknown>;
}

export interface PaymentVerification {
  success: boolean;
  providerOrderId?: string;
  providerTransactionId?: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  amount?: number;
  metadata?: Record<string, unknown>;
}

export interface PaymentGateway {
  readonly provider: string;
  createIntent(input: {
    orderId: string;
    amountEgp: number;
    customerEmail?: string;
    customerPhone?: string;
    redirectUrl?: string;
    walletNumber?: string;
  }): Promise<PaymentIntent>;
  verifyWebhook(payload: Record<string, unknown>): Promise<PaymentVerification>;
}
