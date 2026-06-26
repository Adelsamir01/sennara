import { Router } from 'express';
import {
  createWaypoint,
  getWaypoint,
  updateWaypoint,
  deleteWaypoint,
  listNearby,
} from '../controllers/waypointController';
import { authenticate } from '../../auth/middleware/authMiddleware';

const router = Router();

router.post('/', authenticate, createWaypoint);
router.get('/nearby', authenticate, listNearby);
router.get('/:id', authenticate, getWaypoint);
router.patch('/:id', authenticate, updateWaypoint);
router.delete('/:id', authenticate, deleteWaypoint);

export default router;
