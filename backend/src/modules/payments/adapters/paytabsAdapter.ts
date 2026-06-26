import { PaymentGateway, PaymentIntent, PaymentVerification } from './paymentGateway';

export class PaytabsAdapter implements PaymentGateway {
  readonly provider = 'paytabs';
  private readonly baseUrl = 'https://secure-egypt.paytabs.com';

  async createIntent(input: {
    orderId: string;
    amountEgp: number;
    customerEmail?: string;
    customerPhone?: string;
    redirectUrl?: string;
  }): Promise<PaymentIntent> {
    const res = await fetch(`${this.baseUrl}/payment/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: process.env.PAYTABS_SERVER_KEY || '',
      },
      body: JSON.stringify({
        profile_id: process.env.PAYTABS_PROFILE_ID,
        tran_type: 'sale',
        tran_class: 'ecom',
        cart_id: input.orderId,
        cart_description: 'Sennara Premium Subscription',
        cart_currency: 'EGP',
        cart_amount: input.amountEgp,
        callback: `${process.env.API_PREFIX}/payments/webhooks/paytabs`,
        return: input.redirectUrl || `${process.env.API_PREFIX}/payments/return`,
        customer_details: {
          name: 'Sennara User',
          email: input.customerEmail || 'user@sennara.app',
          phone: input.customerPhone || '01000000000',
          street1: 'NA',
          city: 'Cairo',
          country: 'EG',
          state: 'Cairo',
          zip: 'NA',
        },
      }),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!data.redirect_url && !data.transaction_ref) {
      throw new Error('Paytabs payment creation failed');
    }

    return {
      provider: this.provider,
      amountEgp: input.amountEgp,
      currency: 'EGP',
      orderId: input.orderId,
      checkoutUrl: data.redirect_url as string | undefined,
      token: data.transaction_ref as string | undefined,
      metadata: data,
    };
  }

  async verifyWebhook(payload: Record<string, unknown>): Promise<PaymentVerification> {
    const paymentResult = payload?.payment_result as Record<string, unknown> | undefined;
    const success = paymentResult?.response_status === 'A';
    return {
      success,
      providerOrderId: payload?.cart_id ? String(payload.cart_id) : undefined,
      providerTransactionId: String(payload?.tran_ref || ''),
      status: success ? 'success' : 'failed',
      amount: payload?.cart_amount ? parseFloat(String(payload.cart_amount)) : undefined,
      metadata: payload,
    };
  }
}
