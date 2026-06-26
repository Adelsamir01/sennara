import * as paymentService from '../../src/modules/payments/services/paymentService';
import * as paymentRepo from '../../src/modules/payments/repositories/paymentRepository';
import * as userRepo from '../../src/modules/auth/repositories/userRepository';
import { PaymentGateway, PaymentIntent } from '../../src/modules/payments/adapters/paymentGateway';
import { initTestEnvironment, resetTestEnvironment, teardownTestEnvironment } from '../utils/testApp';
import { registerUser } from '../utils/authHelpers';

const mockGateway: PaymentGateway = {
  provider: 'mock-gateway',
  async createIntent(input): Promise<PaymentIntent> {
    return {
      provider: 'mock-gateway',
      amountEgp: input.amountEgp,
      currency: 'EGP',
      orderId: input.orderId,
      checkoutUrl: 'https://checkout.test/pay',
      token: 'mock-token',
      metadata: { test: true },
    };
  },
  async verifyWebhook(payload): Promise<any> {
    return {
      success: payload.status === 'paid',
      providerOrderId: payload.orderId ? String(payload.orderId) : undefined,
      providerTransactionId: String(payload.id || ''),
      status: payload.status === 'paid' ? 'success' : 'failed',
      amount: payload.amount as number,
      metadata: payload,
    };
  },
};

describe('Payment Module', () => {
  let userId: string;

  beforeAll(async () => {
    await initTestEnvironment();
    // Inject mock gateway by overriding an existing provider slot
    (paymentService as any).gateways['paymob'] = mockGateway;
  });

  beforeEach(async () => {
    const auth = await registerUser('01077777777');
    userId = auth.user.id as string;
  });

  afterEach(async () => {
    await resetTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  it('calculates subscription amount correctly', () => {
    expect(paymentService.calculateAmount('premium', 1)).toBe(129);
    expect(paymentService.calculateAmount('premium', 12)).toBe(999);
  });

  it('creates a payment intent', async () => {
    const result = await paymentService.initiatePayment(userId, {
      provider: 'paymob',
      tier: 'premium',
      months: 1,
    });

    expect(result.intent.checkoutUrl).toBe('https://checkout.test/pay');
    expect(result.intent.amountEgp).toBe(129);

    const payment = await paymentRepo.findPaymentById(result.paymentId);
    expect(payment).not.toBeNull();
    expect(payment?.status).toBe('pending');
  });

  it('processes successful webhook and upgrades user', async () => {
    const { paymentId, intent } = await paymentService.initiatePayment(userId, {
      provider: 'paymob',
      tier: 'premium',
      months: 1,
    });

    const payment = await paymentRepo.findPaymentById(paymentId);

    await paymentService.handleWebhook('paymob', {
      status: 'paid',
      orderId: intent.orderId,
      id: 'txn-123',
      amount: payment?.amount_egp,
    });

    const updatedPayment = await paymentRepo.findPaymentById(paymentId);
    expect(updatedPayment?.status).toBe('success');
    expect(updatedPayment?.provider_transaction_id).toBe('txn-123');

    const user = await userRepo.findUserById(userId);
    expect(user?.subscription_tier).toBe('premium');
    expect(user?.subscription_expires_at).not.toBeNull();
  });

  it('processes failed webhook', async () => {
    const { paymentId, intent } = await paymentService.initiatePayment(userId, {
      provider: 'paymob',
      tier: 'premium',
      months: 1,
    });

    await paymentService.handleWebhook('paymob', {
      status: 'failed',
      orderId: intent.orderId,
      id: 'txn-456',
    });

    const updatedPayment = await paymentRepo.findPaymentById(paymentId);
    expect(updatedPayment?.status).toBe('failed');
  });
});
