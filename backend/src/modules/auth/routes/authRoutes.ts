import { Router } from 'express';
import {
  requestPhoneOtp,
  verifyPhoneOtp,
  socialLogin,
  refreshAccessToken,
  getMe,
} from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/otp/request', requestPhoneOtp);
router.post('/otp/verify', verifyPhoneOtp);
router.post('/social', socialLogin);
router.post('/refresh', refreshAccessToken);
router.get('/me', authenticate, getMe);

export default router;
