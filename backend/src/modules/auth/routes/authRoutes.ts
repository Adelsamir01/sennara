import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  requestPhoneOtp,
  verifyPhoneOtp,
  socialLogin,
  refreshAccessToken,
  logout,
  getMe,
} from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

const otpRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rateLimited', message: 'Too many OTP requests. Try again later.' },
  keyGenerator: (req) => req.body?.phoneNumber || req.ip || 'unknown',
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rateLimited', message: 'Too many OTP attempts. Try again later.' },
  keyGenerator: (req) => req.body?.phoneNumber || req.ip || 'unknown',
});

router.post('/otp/request', otpRequestLimiter, requestPhoneOtp);
router.post('/otp/verify', otpVerifyLimiter, verifyPhoneOtp);
router.post('/social', socialLogin);
router.post('/refresh', refreshAccessToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
