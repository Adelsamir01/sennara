import { Router } from 'express';
import {
  createCatch,
  getCatch,
  updateCatch,
  deleteCatch,
  listCatches,
} from '../controllers/catchController';
import { authenticate } from '../../auth/middleware/authMiddleware';

const router = Router();

router.post('/', authenticate, createCatch);
router.get('/', authenticate, listCatches);
router.get('/:id', authenticate, getCatch);
router.patch('/:id', authenticate, updateCatch);
router.delete('/:id', authenticate, deleteCatch);

export default router;
