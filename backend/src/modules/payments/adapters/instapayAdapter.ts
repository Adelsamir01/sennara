import { PaymentGateway, PaymentIntent, PaymentVerification } from './paymentGateway';

export class InstapayAdapter implements PaymentGateway {
  readonly provider = 'instapay';
  private readonly baseUrl = 'https://api.instapay.dev';

  async createIntent(input: {
    orderId: string;
    amountEgp: number;
    customerEmail?: string;
    customerPhone?: string;
    redirectUrl?: string;
  }): Promise<PaymentIntent> {
    const res = await fetch(`${this.baseUrl}/api/v1/payment/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.INSTAPAY_CLIENT_SECRET}`,
      },
      body: JSON.stringify({
        amount: input.amountEgp,
        currency: 'EGP',
        order_id: input.orderId,
        description: 'Sennara Premium Subscription',
        customer: {
          email: input.customerEmail,
          phone: input.customerPhone,
        },
        return_url: input.redirectUrl,
        callback_url: `${process.env.API_PREFIX}/payments/webhooks/instapay`,
      }),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!data.payment_url && !data.id) {
      throw new Error('InstaPay payment creation failed');
    }

    return {
      provider: this.provider,
      amountEgp: input.amountEgp,
      currency: 'EGP',
      orderId: input.orderId,
      checkoutUrl: data.payment_url as string | undefined,
      token: data.id as string | undefined,
      metadata: data,
    };
  }

  async verifyWebhook(payload: Record<string, unknown>): Promise<PaymentVerification> {
    const success = payload?.status === 'paid';
    return {
      success,
      providerOrderId: payload?.order_id ? String(payload.order_id) : undefined,
      providerTransactionId: String(payload?.id || ''),
      status: success ? 'success' : 'failed',
      amount: payload?.amount ? parseFloat(String(payload.amount)) : undefined,
      metadata: payload,
    };
  }
}
