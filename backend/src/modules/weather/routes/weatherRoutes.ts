import { Router } from 'express';
import { authenticate } from '../../auth/middleware/authMiddleware';
import { getCurrent, getForecastHandler } from '../controllers/weatherController';

const router = Router();

router.get('/current', authenticate, getCurrent);
// 7-day forecast is free for 1 day; full 7 days is premium (handled in controller via middleware)
router.get('/forecast', authenticate, getForecastHandler);

export default router;
