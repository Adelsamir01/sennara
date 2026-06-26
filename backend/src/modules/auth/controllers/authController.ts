import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';
import { AppError } from '../../../shared/errors/AppError';
import { t } from '../../../shared/i18n';
import * as userRepo from '../repositories/userRepository';
import { generateOtp, storeOtp, verifyOtp, getRecentOtpCount } from '../services/otpService';
import { sendOtp } from '../services/otpSender';
import {
  generateTokens,
  rotateRefreshToken,
  revokeAccessToken,
  revokeRefreshToken,
} from '../services/jwtService';
import {
  phoneRequestSchema,
  otpVerifySchema,
  refreshTokenSchema,
  socialLoginSchema,
  logoutSchema,
} from '../dto/authSchemas';

function publicUser(user: userRepo.UserRow) {
  return {
    id: user.id,
    phoneNumber: user.phone_number,
    email: user.email,
    displayName: user.display_name,
    handle: user.handle,
    avatarUrl: user.avatar_url,
    locale: user.locale,
    subscriptionTier: user.subscription_tier,
    defaultPrivacy: user.default_privacy,
  };
}

function normalizePhoneNumber(phoneNumber: string): string {
  let cleaned = phoneNumber.replace(/\s|-/g, '');
  if (cleaned.startsWith('+20')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0020')) {
    cleaned = '0' + cleaned.slice(4);
  }
  return cleaned;
}

export async function requestPhoneOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = phoneRequestSchema.parse(req.body);
    const locale = (req.headers['x-locale'] as 'ar' | 'en') || 'ar';
    const phoneNumber = normalizePhoneNumber(dto.phoneNumber);

    const recentCount = await getRecentOtpCount(phoneNumber);
    if (recentCount >= 5) {
      next(new AppError('rateLimited', 429, t(locale, 'errors.generic')));
      return;
    }

    const otp = generateOtp();
    const otpResult = await sendOtp(phoneNumber, otp);

    if (otpResult.success) {
      await storeOtp(phoneNumber, otp, otpResult.gateway);
      logger.info('OTP sent', { phone: phoneNumber, gateway: otpResult.gateway });
    } else {
      logger.warn('OTP send failed', { phone: phoneNumber, error: otpResult.error });
    }

    const includeOtp = env.OTP_TEST_MODE ? { otp } : {};

    res.status(200).json({
      success: otpResult.success,
      gateway: otpResult.gateway,
      message: otpResult.success
        ? t(locale, 'auth.otpSent', { phone: phoneNumber })
        : t(locale, 'errors.generic'),
      ...includeOtp,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyPhoneOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = otpVerifySchema.parse(req.body);
    const locale = (req.headers['x-locale'] as 'ar' | 'en') || 'ar';
    const phoneNumber = normalizePhoneNumber(dto.phoneNumber);

    const valid = await verifyOtp(phoneNumber, dto.otp);
    if (!valid) {
      next(new AppError('unauthorized', 401, t(locale, 'errors.unauthorized')));
      return;
    }

    let user = await userRepo.findUserByPhone(phoneNumber);
    const isNewUser = !user;

    if (!user) {
      user = await userRepo.createUser({
        phoneNumber,
        authProvider: 'phone_otp',
        locale,
      });
    }

    await userRepo.updateUser(user.id, { last_seen_at: new Date() });
    const tokens = generateTokens(user);

    res.status(200).json({
      user: publicUser(user),
      tokens,
      isNewUser,
    });
  } catch (err) {
    next(err);
  }
}

export async function socialLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = socialLoginSchema.parse(req.body);
    const locale = (req.headers['x-locale'] as 'ar' | 'en') || 'ar';

    // In production, validate the ID token with Google/Apple first.
    // For now we trust the client-supplied token and derive a stable provider ID hash.
    const providerId = `social:${dto.provider}:${hashIdToken(dto.idToken)}`;

    let user = await userRepo.findUserByProvider(dto.provider, providerId);
    const isNewUser = !user;

    if (!user) {
      user = await userRepo.createUser({
        email: dto.email,
        displayName: dto.displayName,
        authProvider: dto.provider,
        authProviderId: providerId,
        locale,
      });
    }

    await userRepo.updateUser(user.id, { last_seen_at: new Date() });
    const tokens = generateTokens(user);

    res.status(200).json({
      user: publicUser(user),
      tokens,
      isNewUser,
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = refreshTokenSchema.parse(req.body);
    const { userId } = await rotateRefreshToken(dto.refreshToken);
    const user = await userRepo.findUserById(userId);

    if (!user) {
      next(new AppError('unauthorized', 401, 'User not found'));
      return;
    }

    const tokens = generateTokens(user);
    res.status(200).json({ tokens });
  } catch (err) {
    next(new AppError('unauthorized', 401, 'Invalid or expired refresh token'));
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const dto = logoutSchema.parse(req.body);
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

    await Promise.all([
      accessToken ? revokeAccessToken(accessToken) : Promise.resolve(),
      revokeRefreshToken(dto.refreshToken),
    ]);

    res.status(200).json({ success: true, message: 'Logged out' });
  } catch (err) {
    logger.warn('Logout error', { err });
    // Always return success to avoid leaking token validity
    res.status(200).json({ success: true, message: 'Logged out' });
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locale = (req.headers['x-locale'] as 'ar' | 'en') || 'ar';
    const user = await userRepo.findUserById(req.user!.userId);
    if (!user) {
      next(new AppError('notFound', 404, t(locale, 'errors.notFound')));
      return;
    }
    res.status(200).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

function hashIdToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex').slice(0, 32);
}
