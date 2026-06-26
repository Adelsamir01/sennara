import request from 'supertest';
import { app, initTestEnvironment, resetTestEnvironment, teardownTestEnvironment } from '../utils/testApp';

jest.mock('../../src/modules/auth/services/smsService', () => ({
  sendOtpSms: jest.fn().mockResolvedValue({ success: true, gateway: 'smsmisr' }),
}));

describe('Auth Module', () => {
  beforeAll(async () => {
    await initTestEnvironment();
  });

  afterEach(async () => {
    await resetTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('POST /api/v1/auth/otp/request', () => {
    it('sends OTP to a valid Egyptian phone number', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: '01012345678' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.otp).toBeDefined();
      expect(response.body.otp).toHaveLength(6);
    });

    it('rejects invalid Egyptian phone numbers', async () => {
      await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: '12345' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/otp/verify', () => {
    it('creates a new user and returns tokens on valid OTP', async () => {
      const otpResponse = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: '01012345678' });

      const otp = otpResponse.body.otp;

      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phoneNumber: '01012345678', otp })
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.phoneNumber).toBe('01012345678');
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
      expect(response.body.isNewUser).toBe(true);
    });

    it('rejects invalid OTP', async () => {
      await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: '01012345678' });

      await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phoneNumber: '01012345678', otp: '000000' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/social', () => {
    it('creates a user via Google social login', async () => {
      const response = await request(app)
        .post('/api/v1/auth/social')
        .send({
          provider: 'google',
          idToken: 'fake-google-token',
          displayName: 'Test User',
          email: 'test@example.com',
        })
        .expect(200);

      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.isNewUser).toBe(true);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('refreshes access token', async () => {
      const otpResponse = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: '01012345678' });

      const verifyResponse = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phoneNumber: '01012345678', otp: otpResponse.body.otp });

      const refreshToken = verifyResponse.body.tokens.refreshToken;

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.tokens.accessToken).toBeDefined();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns current authenticated user', async () => {
      const otpResponse = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: '01012345678' });

      const verifyResponse = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phoneNumber: '01012345678', otp: otpResponse.body.otp });

      const accessToken = verifyResponse.body.tokens.accessToken;

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.user.id).toBe(verifyResponse.body.user.id);
    });

    it('rejects unauthenticated requests', async () => {
      await request(app).get('/api/v1/auth/me').expect(401);
    });
  });
});
