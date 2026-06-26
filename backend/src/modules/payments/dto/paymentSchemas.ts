import { z } from 'zod';

export const paymentProviderSchema = z.enum([
  'paymob',
  'paytabs',
  'instapay',
  'vodafone_cash',
  'fawry',
  'stripe',
]);

export const initiatePaymentSchema = z.object({
  provider: paymentProviderSchema,
  tier: z.enum(['premium']),
  months: z.number().int().min(1).max(12).default(1),
  redirectUrl: z.string().url().optional(),
  mobileWalletNumber: z.string().optional(),
});

export const webhookSchema = z.object({
  provider: paymentProviderSchema,
  payload: z.record(z.unknown()),
});

export type InitiatePaymentDto = z.infer<typeof initiatePaymentSchema>;
export type WebhookDto = z.infer<typeof webhookSchema>;
