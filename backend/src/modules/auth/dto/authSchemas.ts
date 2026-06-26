import { z } from 'zod';

const egyptianPhoneRegex = /^(\+20|0)?1[0-2,5]\d{8}$/;

export const phoneRequestSchema = z.object({
  phoneNumber: z.string().regex(egyptianPhoneRegex, 'Invalid Egyptian phone number'),
});

export const otpVerifySchema = z.object({
  phoneNumber: z.string().regex(egyptianPhoneRegex, 'Invalid Egyptian phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const socialLoginSchema = z.object({
  provider: z.enum(['google', 'apple']),
  idToken: z.string().min(1, 'ID token is required'),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type PhoneRequestDto = z.infer<typeof phoneRequestSchema>;
export type OtpVerifyDto = z.infer<typeof otpVerifySchema>;
export type SocialLoginDto = z.infer<typeof socialLoginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type LogoutDto = z.infer<typeof logoutSchema>;
