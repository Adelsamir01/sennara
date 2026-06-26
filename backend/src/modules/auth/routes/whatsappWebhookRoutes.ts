import { Router } from 'express';
import { verifyWebhook, receiveWebhook } from '../controllers/whatsappWebhookController';

const router = Router();

router.get('/', verifyWebhook);
router.post('/', receiveWebhook);

export default router;
