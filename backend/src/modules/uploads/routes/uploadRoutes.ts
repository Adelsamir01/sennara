import { Router } from 'express';
import { authenticate } from '../../auth/middleware/authMiddleware';
import { presignUpload } from '../controllers/uploadController';

const router = Router();

router.post('/presign', authenticate, presignUpload);

export default router;
