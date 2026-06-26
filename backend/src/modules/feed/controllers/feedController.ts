import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import * as feedRepo from '../repositories/feedRepository';
import {
  createCommentSchema,
  listCommentsSchema,
  friendshipActionSchema,
  updateFriendshipSchema,
} from '../dto/feedSchemas';

export async function toggleLike(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const catchId = req.params.catchId;
    const liked = await feedRepo.toggleLike(catchId, userId);
    const counts = await feedRepo.getCounts(catchId);
    res.status(200).json({ liked, ...counts });
  } catch (err) {
    next(err);
  }
}

export async function createComment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = createCommentSchema.parse(req.body);
    const userId = req.user!.userId;
    const comment = await feedRepo.createComment(
      req.params.catchId,
      userId,
      dto.content,
      dto.parentCommentId
    );
    const counts = await feedRepo.getCounts(req.params.catchId);
    res.status(201).json({ comment, ...counts });
  } catch (err) {
    next(err);
  }
}

export async function listComments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = listCommentsSchema.parse(req.query);
    const comments = await feedRepo.listComments(
      req.params.catchId,
      dto.limit,
      dto.cursor
    );
    const nextCursor =
      comments.length === dto.limit && comments.length > 0
        ? comments[comments.length - 1].created_at.toISOString()
        : null;
    res.status(200).json({ comments, nextCursor });
  } catch (err) {
    next(err);
  }
}

export async function shareCatch(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const platform = req.body.platform || 'in_app';
    const share = await feedRepo.recordShare(req.params.catchId, userId, platform);
    const counts = await feedRepo.getCounts(req.params.catchId);
    res.status(201).json({ share, ...counts });
  } catch (err) {
    next(err);
  }
}

export async function sendFriendRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = friendshipActionSchema.parse(req.body);
    if (dto.userId === req.user!.userId) {
      next(new AppError('forbidden', 403, 'Cannot friend yourself'));
      return;
    }
    const friendship = await feedRepo.sendFriendRequest(req.user!.userId, dto.userId);
    res.status(201).json({ friendship });
  } catch (err) {
    next(err);
  }
}

export async function respondFriendRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = updateFriendshipSchema.parse(req.body);
    const requesterId = req.params.userId;
    const addresseeId = req.user!.userId;
    const friendship = await feedRepo.updateFriendship(
      requesterId,
      addresseeId,
      dto.status
    );
    if (!friendship) {
      next(new AppError('notFound', 404, 'Friend request not found'));
      return;
    }
    res.status(200).json({ friendship });
  } catch (err) {
    next(err);
  }
}

export async function listFriendships(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const friendships = await feedRepo.listFriendships(req.user!.userId, status);
    res.status(200).json({ friendships });
  } catch (err) {
    next(err);
  }
}
