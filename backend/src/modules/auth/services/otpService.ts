import crypto from 'crypto';
import { env } from '../../../config/env';
import { query } from '../../../config/database';
import { cacheGet, cacheSet, cacheDelete } from '../../../config/redis';

const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const OTP_MAX_ATTEMPTS = 5;

function hashOtp(otp: string): string {
  return crypto.createHmac('sha256', env.OTP_SECRET).update(otp).digest('hex');
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOtp(phoneNumber: string, otp: string, gateway: string): Promise<void> {
  const otpHash = hashOtp(otp);
  const cacheKey = `otp:${phoneNumber}`;

  await Promise.all([
    query(
      `INSERT INTO otp_codes (phone_number, otp_hash, gateway, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')`,
      [phoneNumber, otpHash, gateway]
    ),
    cacheSet(cacheKey, { otpHash, attempts: 0, gateway }, OTP_TTL_SECONDS),
  ]);
}

export async function verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
  const cacheKey = `otp:${phoneNumber}`;
  const cached = await cacheGet<{ otpHash: string; attempts: number }>(cacheKey);

  if (!cached) return false;

  const attemptHash = hashOtp(otp);
  if (cached.attempts >= OTP_MAX_ATTEMPTS) {
    return false;
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(attemptHash, 'hex'),
    Buffer.from(cached.otpHash, 'hex')
  );

  if (!valid) {
    cached.attempts += 1;
    await cacheSet(cacheKey, cached, OTP_TTL_SECONDS);
    return false;
  }

  await cacheDelete(cacheKey);
  await query(
    'UPDATE otp_codes SET verified_at = NOW() WHERE phone_number = $1 AND verified_at IS NULL',
    [phoneNumber]
  );
  return true;
}

export async function getRecentOtpCount(phoneNumber: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) FROM otp_codes
     WHERE phone_number = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [phoneNumber]
  );
  return parseInt(result.rows[0].count, 10);
}
