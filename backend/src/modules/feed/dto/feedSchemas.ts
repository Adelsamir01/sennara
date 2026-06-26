import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  parentCommentId: z.string().uuid().optional(),
});

export const listCommentsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const friendshipActionSchema = z.object({
  userId: z.string().uuid(),
});

export const updateFriendshipSchema = z.object({
  status: z.enum(['accepted', 'blocked']),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
export type ListCommentsDto = z.infer<typeof listCommentsSchema>;
export type FriendshipActionDto = z.infer<typeof friendshipActionSchema>;
export type UpdateFriendshipDto = z.infer<typeof updateFriendshipSchema>;
