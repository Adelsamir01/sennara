import { Router } from 'express';
import {
  toggleLike,
  createComment,
  listComments,
  shareCatch,
  sendFriendRequest,
  respondFriendRequest,
  listFriendships,
} from '../controllers/feedController';
import { authenticate } from '../../auth/middleware/authMiddleware';

const router = Router();

router.post('/catches/:catchId/like', authenticate, toggleLike);
router.get('/catches/:catchId/comments', authenticate, listComments);
router.post('/catches/:catchId/comments', authenticate, createComment);
router.post('/catches/:catchId/share', authenticate, shareCatch);

router.get('/friendships', authenticate, listFriendships);
router.post('/friendships/request', authenticate, sendFriendRequest);
router.patch('/friendships/:userId/respond', authenticate, respondFriendRequest);

export default router;
