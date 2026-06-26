import crypto from 'crypto';
import { PaymentGateway } from '../adapters/paymentGateway';
import { PaymobAdapter } from '../adapters/paymobAdapter';
import { PaytabsAdapter } from '../adapters/paytabsAdapter';
import { InstapayAdapter } from '../adapters/instapayAdapter';
import * as paymentRepo from '../repositories/paymentRepository';
import * as userRepo from '../../auth/repositories/userRepository';

const PRICING: Record<string, { monthlyEgp: number; yearlyEgp: number }> = {
  premium: { monthlyEgp: 129, yearlyEgp: 999 },
};

export const gateways: Record<string, PaymentGateway> = {
  paymob: new PaymobAdapter(),
  paytabs: new PaytabsAdapter(),
  instapay: new InstapayAdapter(),
};

export function calculateAmount(tier: string, months: number): number {
  const price = PRICING[tier];
  if (!price) throw new Error('Invalid tier');
  if (months === 12) return price.yearlyEgp;
  return price.monthlyEgp * months;
}

export async function initiatePayment(
  userId: string,
  input: {
    provider: string;
    tier: string;
    months: number;
    redirectUrl?: string;
    mobileWalletNumber?: string;
  }
) {
  const gateway = gateways[input.provider];
  if (!gateway) throw new Error('Unsupported provider');

  const amount = calculateAmount(input.tier, input.months);
  const orderId = `snnr-${crypto.randomUUID()}`;

  const user = await userRepo.findUserById(userId);
  if (!user) throw new Error('User not found');

  const payment = await paymentRepo.createPayment({
    userId,
    provider: input.provider,
    providerOrderId: orderId,
    amountEgp: amount,
    subscriptionTier: input.tier,
    subscriptionMonths: input.months,
  });

  const intent = await gateway.createIntent({
    orderId,
    amountEgp: amount,
    customerEmail: user.email || undefined,
    customerPhone: user.phone_number || undefined,
    redirectUrl: input.redirectUrl,
    walletNumber: input.mobileWalletNumber,
  });

  await paymentRepo.updatePaymentMetadata(payment.id, {
    checkoutUrl: intent.checkoutUrl,
    ...intent.metadata,
  });

  return { paymentId: payment.id, intent };
}

export async function handleWebhook(provider: string, payload: Record<string, unknown>) {
  const gateway = gateways[provider];
  if (!gateway) throw new Error('Unsupported provider');

  const verification = await gateway.verifyWebhook(payload);

  const paymentLookupId = verification.providerOrderId || verification.providerTransactionId;
  if (!paymentLookupId) return verification;

  const payment = await paymentRepo.findPaymentByProviderOrderId(paymentLookupId);

  if (payment && verification.success && verification.providerTransactionId) {
    await paymentRepo.markPaymentSuccess(payment.id, verification.providerTransactionId);
    await userRepo.updateUser(payment.user_id, {
      subscription_tier: payment.subscription_tier || undefined,
    });
    // Set expiry: months from now
    const months = payment.subscription_months || 1;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);
    await paymentRepo.setSubscriptionExpiry(payment.user_id, expiry);
  } else if (payment) {
    await paymentRepo.markPaymentFailed(payment.id);
  }

  return verification;
}

export async function getPricing() {
  return PRICING;
}
