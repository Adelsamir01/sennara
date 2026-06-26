import { Router } from 'express';
import { authenticate } from '../../auth/middleware/authMiddleware';
import { getPricing, initiate, webhook } from '../controllers/paymentController';

const router = Router();

router.get('/pricing', getPricing);
router.post('/initiate', authenticate, initiate);
router.post('/webhooks/:provider', webhook);

export default router;
