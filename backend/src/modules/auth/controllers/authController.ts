import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { t } from '../../../shared/i18n';
import * as userRepo from '../repositories/userRepository';
import { generateOtp, storeOtp, verifyOtp, getRecentOtpCount } from '../services/otpService';
import { sendOtpSms } from '../services/smsService';
import { generateTokens, verifyRefreshToken } from '../services/jwtService';
import {
  phoneRequestSchema,
  otpVerifySchema,
  refreshTokenSchema,
  socialLoginSchema,
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

export async function requestPhoneOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = phoneRequestSchema.parse(req.body);
    const locale = (req.headers['x-locale'] as 'ar' | 'en') || 'ar';

    const recentCount = await getRecentOtpCount(dto.phoneNumber);
    if (recentCount >= 5) {
      next(new AppError('rateLimited', 429, t(locale, 'errors.generic')));
      return;
    }

    const otp = generateOtp();
    await storeOtp(dto.phoneNumber, otp, 'smsmisr');
    const smsResult = await sendOtpSms(dto.phoneNumber, otp, 'smsmisr');

    // In dev, return OTP in response body for easier testing
    const includeOtp = process.env.NODE_ENV !== 'production' ? { otp } : {};

    res.status(200).json({
      success: smsResult.success,
      gateway: smsResult.gateway,
      message: t(locale, 'auth.otpSent', { phone: dto.phoneNumber }),
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

    const valid = await verifyOtp(dto.phoneNumber, dto.otp);
    if (!valid) {
      next(new AppError('unauthorized', 401, t(locale, 'errors.unauthorized')));
      return;
    }

    let user = await userRepo.findUserByPhone(dto.phoneNumber);
    const isNewUser = !user;

    if (!user) {
      user = await userRepo.createUser({
        phoneNumber: dto.phoneNumber,
        authProvider: 'phone_otp',
        locale,
      });
    }

    const tokens = generateTokens({
      userId: user.id,
      phoneNumber: user.phone_number,
      tier: user.subscription_tier,
    });

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

    const tokens = generateTokens({
      userId: user.id,
      phoneNumber: user.phone_number,
      tier: user.subscription_tier,
    });

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
    const { userId } = verifyRefreshToken(dto.refreshToken);
    const user = await userRepo.findUserById(userId);

    if (!user) {
      next(new AppError('unauthorized', 401, 'User not found'));
      return;
    }

    const tokens = generateTokens({
      userId: user.id,
      phoneNumber: user.phone_number,
      tier: user.subscription_tier,
    });

    res.status(200).json({ tokens });
  } catch (err) {
    next(err);
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
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex').slice(0, 32);
}
