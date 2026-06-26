import request from 'supertest';
import { app } from './testApp';

export async function registerUser(phoneNumber: string = '01012345678'): Promise<{
  user: Record<string, unknown>;
  tokens: { accessToken: string; refreshToken: string };
}> {
  const otpResponse = await request(app)
    .post('/api/v1/auth/otp/request')
    .send({ phoneNumber });

  const verifyResponse = await request(app)
    .post('/api/v1/auth/otp/verify')
    .send({ phoneNumber, otp: otpResponse.body.otp });

  return verifyResponse.body;
}

export async function registerSocialUser(email: string): Promise<{
  user: Record<string, unknown>;
  tokens: { accessToken: string; refreshToken: string };
}> {
  const response = await request(app)
    .post('/api/v1/auth/social')
    .send({
      provider: 'google',
      idToken: `token-${email}`,
      displayName: 'Social User',
      email,
    });

  return response.body;
}
