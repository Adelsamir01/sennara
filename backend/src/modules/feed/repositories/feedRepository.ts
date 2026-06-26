import { query } from '../../../config/database';

export async function toggleLike(catchId: string, userId: string): Promise<boolean> {
  const existing = await query(
    'SELECT id FROM catch_likes WHERE catch_id = $1 AND user_id = $2 LIMIT 1',
    [catchId, userId]
  );

  if (existing.rowCount && existing.rowCount > 0) {
    await query(
      'DELETE FROM catch_likes WHERE catch_id = $1 AND user_id = $2',
      [catchId, userId]
    );
    return false; // unliked
  }

  await query(
    'INSERT INTO catch_likes (catch_id, user_id) VALUES ($1, $2)',
    [catchId, userId]
  );
  return true; // liked
}

export async function createComment(
  catchId: string,
  userId: string,
  content: string,
  parentCommentId?: string
) {
  const result = await query(
    `INSERT INTO catch_comments (catch_id, user_id, parent_comment_id, content)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [catchId, userId, parentCommentId || null, content]
  );
  return result.rows[0];
}

export interface CommentRow {
  id: string;
  catch_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: Date;
  updated_at: Date;
  user_display_name: string | null;
  user_handle: string | null;
  user_avatar_url: string | null;
}

export async function listComments(
  catchId: string,
  limit: number,
  cursor?: string
): Promise<CommentRow[]> {
  const values: unknown[] = [catchId];
  let idx = 2;
  const conditions = ['catch_id = $1'];

  if (cursor) {
    conditions.push(`created_at < $${idx++}`);
    values.push(new Date(cursor));
  }

  const result = await query(
    `SELECT
       c.*,
       u.display_name as user_display_name,
       u.handle as user_handle,
       u.avatar_url as user_avatar_url
     FROM catch_comments c
     JOIN users u ON u.id = c.user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY c.created_at DESC
     LIMIT $${idx++}`,
    [...values, limit]
  );
  return result.rows as CommentRow[];
}

export async function recordShare(
  catchId: string,
  userId: string,
  platform?: string
) {
  const result = await query(
    `INSERT INTO catch_shares (catch_id, user_id, platform)
     VALUES ($1, $2, $3) RETURNING *`,
    [catchId, userId, platform || 'in_app']
  );
  return result.rows[0];
}

export async function getCounts(catchId: string) {
  const result = await query(
    `SELECT
       (SELECT COUNT(*) FROM catch_likes WHERE catch_id = $1) as likes,
       (SELECT COUNT(*) FROM catch_comments WHERE catch_id = $1) as comments,
       (SELECT COUNT(*) FROM catch_shares WHERE catch_id = $1) as shares`,
    [catchId]
  );
  const row = result.rows[0] as Record<string, string>;
  return {
    likes: parseInt(row.likes, 10),
    comments: parseInt(row.comments, 10),
    shares: parseInt(row.shares, 10),
  };
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  const result = await query(
    `INSERT INTO friendships (requester_id, addressee_id)
     VALUES ($1, $2)
     ON CONFLICT (requester_id, addressee_id) DO UPDATE SET
       status = 'pending',
       updated_at = NOW()
     RETURNING *`,
    [requesterId, addresseeId]
  );
  return result.rows[0];
}

export async function updateFriendship(
  requesterId: string,
  addresseeId: string,
  status: 'accepted' | 'blocked'
) {
  const result = await query(
    `UPDATE friendships
     SET status = $3, updated_at = NOW()
     WHERE requester_id = $1 AND addressee_id = $2
     RETURNING *`,
    [requesterId, addresseeId, status]
  );
  return result.rows[0] || null;
}

export async function listFriendships(userId: string, status?: string) {
  const result = await query(
    `SELECT
       f.*,
       u.id as friend_id,
       u.display_name as friend_display_name,
       u.handle as friend_handle,
       u.avatar_url as friend_avatar_url
     FROM friendships f
     JOIN users u ON (
       (f.requester_id = $1 AND u.id = f.addressee_id)
       OR (f.addressee_id = $1 AND u.id = f.requester_id)
     )
     WHERE f.status = COALESCE($2, f.status)
     ORDER BY f.updated_at DESC`,
    [userId, status || null]
  );
  return result.rows;
}
