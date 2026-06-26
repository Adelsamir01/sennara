import { generateOtp, storeOtp, verifyOtp } from '../../src/modules/auth/services/otpService';
import { initTestEnvironment, resetTestEnvironment, teardownTestEnvironment } from '../utils/testApp';

describe('OTP Service', () => {
  beforeAll(async () => {
    await initTestEnvironment();
  });

  afterEach(async () => {
    await resetTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  it('generates 6-digit OTPs', () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('stores and verifies OTPs', async () => {
    const phone = '01099999999';
    const otp = generateOtp();

    await storeOtp(phone, otp, 'whatsapp');
    const valid = await verifyOtp(phone, otp);
    expect(valid).toBe(true);

    const invalid = await verifyOtp(phone, '000000');
    expect(invalid).toBe(false);
  });
});
