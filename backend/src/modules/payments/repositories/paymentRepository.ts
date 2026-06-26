import { query } from '../../../config/database';

export interface PaymentRow {
  id: string;
  user_id: string;
  provider: string;
  provider_transaction_id: string | null;
  provider_order_id: string | null;
  amount_egp: number;
  status: string;
  subscription_tier: string | null;
  subscription_months: number | null;
  metadata: Record<string, unknown>;
  paid_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function createPayment(input: {
  userId: string;
  provider: string;
  providerOrderId: string;
  amountEgp: number;
  subscriptionTier: string;
  subscriptionMonths: number;
}): Promise<PaymentRow> {
  const result = await query<PaymentRow>(
    `INSERT INTO payments (
      user_id, provider, provider_order_id, amount_egp,
      subscription_tier, subscription_months
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      input.userId,
      input.provider,
      input.providerOrderId,
      input.amountEgp,
      input.subscriptionTier,
      input.subscriptionMonths,
    ]
  );
  return result.rows[0];
}

export async function findPaymentById(id: string): Promise<PaymentRow | null> {
  const result = await query<PaymentRow>('SELECT * FROM payments WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] || null;
}

export async function findPaymentByProviderOrderId(
  providerOrderId: string
): Promise<PaymentRow | null> {
  const result = await query<PaymentRow>(
    'SELECT * FROM payments WHERE provider_order_id = $1 LIMIT 1',
    [providerOrderId]
  );
  return result.rows[0] || null;
}

export async function updatePaymentMetadata(
  id: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await query(
    `UPDATE payments SET metadata = metadata || $1::jsonb WHERE id = $2`,
    [JSON.stringify(metadata), id]
  );
}

export async function markPaymentSuccess(
  id: string,
  providerTransactionId: string
): Promise<void> {
  await query(
    `UPDATE payments
     SET status = 'success', provider_transaction_id = $2, paid_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [id, providerTransactionId]
  );
}

export async function markPaymentFailed(id: string): Promise<void> {
  await query(
    `UPDATE payments SET status = 'failed', updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

export async function setSubscriptionExpiry(userId: string, expiry: Date): Promise<void> {
  await query(
    `UPDATE users SET subscription_expires_at = $2, updated_at = NOW() WHERE id = $1`,
    [userId, expiry]
  );
}
