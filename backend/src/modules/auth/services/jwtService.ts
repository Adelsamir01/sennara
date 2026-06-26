import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import {
  storeRefreshToken,
  consumeRefreshToken,
  denyToken,
  isTokenDenied,
} from '../../../config/redis';
import { randomUUID } from 'crypto';

export interface TokenPayload {
  userId: string;
  phoneNumber?: string | null;
  tier: string;
  subscriptionExpiresAt?: string | null;
  jti: string;
  type: 'access';
}

export interface RefreshPayload {
  userId: string;
  jti: string;
  type: 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenUser {
  id: string;
  phone_number: string | null;
  subscription_tier: string;
  subscription_expires_at: Date | null;
}

const ACCESS_SECRET = env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = env.JWT_REFRESH_SECRET;
const ACCESS_TTL = env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'];
const REFRESH_TTL = env.JWT_REFRESH_TTL as jwt.SignOptions['expiresIn'];
const ACCESS_TTL_SECONDS = env.parseDurationSeconds(env.JWT_ACCESS_TTL);
const REFRESH_TTL_SECONDS = env.parseDurationSeconds(env.JWT_REFRESH_TTL);

export function generateTokens(user: TokenUser): TokenPair {
  const accessJti = randomUUID();
  const refreshJti = randomUUID();

  const accessToken = jwt.sign(
    {
      userId: user.id,
      phoneNumber: user.phone_number,
      tier: user.subscription_tier,
      subscriptionExpiresAt: user.subscription_expires_at?.toISOString() ?? null,
      jti: accessJti,
      type: 'access',
    } as TokenPayload,
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, jti: refreshJti, type: 'refresh' } as RefreshPayload,
    REFRESH_SECRET,
    { expiresIn: REFRESH_TTL }
  );

  // Store the refresh token so we can rotate/revoke it
  storeRefreshToken(refreshJti, user.id, REFRESH_TTL_SECONDS).catch(() => {
    // Best-effort; Redis failure will surface on refresh
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TTL_SECONDS,
  };
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshPayload;
}

export async function verifyAccessTokenWithDenyList(token: string): Promise<TokenPayload> {
  const payload = verifyAccessToken(token);
  if (await isTokenDenied(payload.jti)) {
    throw new Error('Token revoked');
  }
  return payload;
}

export async function rotateRefreshToken(
  refreshToken: string
): Promise<{ userId: string; newRefreshJti: string }> {
  const payload = verifyRefreshToken(refreshToken);
  const userId = await consumeRefreshToken(payload.jti);
  if (!userId || userId !== payload.userId) {
    throw new Error('Invalid or expired refresh token');
  }
  return { userId, newRefreshJti: randomUUID() };
}

export async function revokeAccessToken(token: string): Promise<void> {
  try {
    const payload = verifyAccessToken(token);
    await denyToken(payload.jti, ACCESS_TTL_SECONDS);
  } catch {
    // Ignore invalid tokens
  }
}

export async function revokeRefreshToken(token: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(token);
    await consumeRefreshToken(payload.jti);
  } catch {
    // Ignore invalid tokens
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}
