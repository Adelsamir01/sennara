import { Router } from 'express';
import { authenticate } from '../../auth/middleware/authMiddleware';
import { getCurrent, premiumForecast } from '../controllers/weatherController';

const router = Router();

router.get('/current', authenticate, getCurrent);
// 7-day forecast requires an active premium subscription
router.get('/forecast', ...premiumForecast);

export default router;
