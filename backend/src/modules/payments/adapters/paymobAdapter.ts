import { PaymentGateway, PaymentIntent, PaymentVerification } from './paymentGateway';

/**
 * Paymob Egypt adapter.
 * Outline of the standard flow: auth token → order → payment key → iframe/wallet/Fawry.
 */
export class PaymobAdapter implements PaymentGateway {
  readonly provider = 'paymob';
  private readonly baseUrl = 'https://accept.paymob.com/api';

  async createIntent(input: {
    orderId: string;
    amountEgp: number;
    customerEmail?: string;
    customerPhone?: string;
    redirectUrl?: string;
    walletNumber?: string;
  }): Promise<PaymentIntent> {
    const token = await this.getAuthToken();
    const paymobOrder = await this.createOrder(token, input.orderId, input.amountEgp);
    const paymentKey = await this.createPaymentKey(
      token,
      paymobOrder.id,
      input.amountEgp,
      input.customerEmail,
      input.customerPhone
    );

    const isWallet = !!input.walletNumber;
    const integrationId = isWallet
      ? process.env.PAYMOB_INTEGRATION_ID_WALLET
      : process.env.PAYMOB_INTEGRATION_ID_CARD;

    if (isWallet) {
      // Vodafone Cash / mobile wallet flow
      const walletRes = await fetch(`${this.baseUrl}/acceptance/payments/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: { identifier: input.walletNumber, subtype: 'WALLET' },
          payment_token: paymentKey,
        }),
      });
      const walletData = (await walletRes.json()) as Record<string, unknown>;
      return {
        provider: this.provider,
        amountEgp: input.amountEgp,
        currency: 'EGP',
        orderId: input.orderId,
        checkoutUrl: walletData.redirect_url as string | undefined,
        token: paymentKey,
        metadata: walletData,
      };
    }

    return {
      provider: this.provider,
      amountEgp: input.amountEgp,
      currency: 'EGP',
      orderId: input.orderId,
      checkoutUrl: `https://accept.paymob.com/api/acceptance/iframes/${integrationId}?payment_token=${paymentKey}`,
      token: paymentKey,
      metadata: { integrationId },
    };
  }

  async verifyWebhook(payload: Record<string, unknown>): Promise<PaymentVerification> {
    // In production: validate HMAC signature from Paymob callback
    const obj = payload?.obj as Record<string, unknown> | undefined;
    const success = obj?.success === true;
    return {
      success,
      providerOrderId: obj?.merchant_order_id ? String(obj.merchant_order_id) : undefined,
      providerTransactionId: String(obj?.id || ''),
      status: success ? 'success' : 'failed',
      amount: obj?.amount_cents ? (obj.amount_cents as number) / 100 : undefined,
      metadata: payload,
    };
  }

  private async getAuthToken(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!data.token) throw new Error('Paymob auth failed');
    return String(data.token);
  }

  private async createOrder(
    token: string,
    merchantOrderId: string,
    amountEgp: number
  ): Promise<{ id: number }> {
    const res = await fetch(`${this.baseUrl}/ecommerce/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: false,
        amount_cents: amountEgp * 100,
        currency: 'EGP',
        merchant_order_id: merchantOrderId,
        items: [],
      }),
    });
    return (await res.json()) as { id: number };
  }

  private async createPaymentKey(
    token: string,
    orderId: number,
    amountEgp: number,
    email?: string,
    phone?: string
  ): Promise<string> {
    const res = await fetch(`${this.baseUrl}/acceptance/payment_keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: amountEgp * 100,
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          first_name: 'Sennara',
          last_name: 'User',
          email: email || 'user@sennara.app',
          phone_number: phone || '01000000000',
          apartment: 'NA',
          floor: 'NA',
          street: 'NA',
          building: 'NA',
          shipping_method: 'NA',
          postal_code: 'NA',
          city: 'Cairo',
          country: 'EG',
          state: 'Cairo',
        },
        currency: 'EGP',
        integration_id: parseInt(process.env.PAYMOB_INTEGRATION_ID_CARD || '0', 10),
      }),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!data.token) throw new Error('Paymob payment key failed');
    return String(data.token);
  }
}
