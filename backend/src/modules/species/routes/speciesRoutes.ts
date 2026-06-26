import { Router } from 'express';
import { authenticate } from '../../auth/middleware/authMiddleware';
import { listSpecies, getSpecies } from '../controllers/speciesController';

const router = Router();

router.get('/', authenticate, listSpecies);
router.get('/:id', authenticate, getSpecies);

export default router;
