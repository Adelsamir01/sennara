import { query } from '../../../config/database';
import { AppError } from '../../../shared/errors/AppError';

export interface CatchRow {
  id: string;
  user_id: string;
  species_id: string | null;
  custom_species_name: string | null;
  waypoint_id: string | null;
  weight_kg: number | null;
  length_cm: number | null;
  bait_type: string | null;
  lure_type: string | null;
  technique: string | null;
  description: string | null;
  photo_urls: string[];
  video_urls: string[];
  privacy: string;
  exact_location: string | null; // WKT
  weather: Record<string, unknown>;
  catch_date: Date;
  created_at: Date;
  updated_at: Date;
}

export async function createCatch(
  userId: string,
  input: {
    speciesId?: string;
    customSpeciesName?: string;
    waypointId?: string;
    weightKg?: number;
    lengthCm?: number;
    baitType?: string;
    lureType?: string;
    technique?: string;
    description?: string;
    photoUrls?: string[];
    videoUrls?: string[];
    privacy: string;
    latitude: number;
    longitude: number;
    catchDate?: Date;
    weather?: Record<string, unknown>;
  }
): Promise<CatchRow> {
  const result = await query<CatchRow>(
    `INSERT INTO catches (
      user_id, species_id, custom_species_name, waypoint_id, weight_kg, length_cm,
      bait_type, lure_type, technique, description,
      photo_urls, video_urls, privacy,
      exact_location, weather, catch_date
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
      ST_SetSRID(ST_MakePoint($15, $14), 4326)::geography,
      $16, $17
    )
    RETURNING *, ST_AsText(exact_location) as exact_location`,
    [
      userId,
      input.speciesId || null,
      input.customSpeciesName || null,
      input.waypointId || null,
      input.weightKg || null,
      input.lengthCm || null,
      input.baitType || null,
      input.lureType || null,
      input.technique || null,
      input.description || null,
      input.photoUrls || [],
      input.videoUrls || [],
      input.privacy,
      input.latitude,
      input.longitude,
      JSON.stringify(input.weather || {}),
      input.catchDate || new Date(),
    ]
  );
  return result.rows[0];
}

export async function findCatchById(id: string): Promise<CatchRow | null> {
  const result = await query<CatchRow>(
    'SELECT *, ST_AsText(exact_location) as exact_location FROM catches WHERE id = $1 LIMIT 1',
    [id]
  );
  return result.rows[0] || null;
}

export async function updateCatch(
  id: string,
  userId: string,
  input: Partial<{
    speciesId?: string;
    customSpeciesName?: string;
    waypointId?: string;
    weightKg?: number;
    lengthCm?: number;
    baitType?: string;
    lureType?: string;
    technique?: string;
    description?: string;
    photoUrls?: string[];
    videoUrls?: string[];
    privacy?: string;
    latitude?: number;
    longitude?: number;
    catchDate?: Date;
    weather?: Record<string, unknown>;
  }>
): Promise<CatchRow | null> {
  const existing = await findCatchById(id);
  if (!existing || existing.user_id !== userId) {
    throw new AppError('forbidden', 403, 'Not allowed to update this catch');
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const setField = (dbName: string, value: unknown) => {
    fields.push(`${dbName} = $${idx++}`);
    values.push(value);
  };

  if (input.speciesId !== undefined) setField('species_id', input.speciesId || null);
  if (input.customSpeciesName !== undefined) setField('custom_species_name', input.customSpeciesName || null);
  if (input.waypointId !== undefined) setField('waypoint_id', input.waypointId || null);
  if (input.weightKg !== undefined) setField('weight_kg', input.weightKg || null);
  if (input.lengthCm !== undefined) setField('length_cm', input.lengthCm || null);
  if (input.baitType !== undefined) setField('bait_type', input.baitType || null);
  if (input.lureType !== undefined) setField('lure_type', input.lureType || null);
  if (input.technique !== undefined) setField('technique', input.technique || null);
  if (input.description !== undefined) setField('description', input.description || null);
  if (input.photoUrls !== undefined) setField('photo_urls', input.photoUrls || []);
  if (input.videoUrls !== undefined) setField('video_urls', input.videoUrls || []);
  if (input.privacy !== undefined) setField('privacy', input.privacy);
  if (input.latitude !== undefined && input.longitude !== undefined) {
    fields.push(`exact_location = ST_SetSRID(ST_MakePoint($${idx + 1}, $${idx}), 4326)::geography`);
    values.push(input.latitude, input.longitude);
    idx += 2;
  }
  if (input.weather !== undefined) setField('weather', JSON.stringify(input.weather));
  if (input.catchDate !== undefined) setField('catch_date', input.catchDate);

  if (fields.length === 0) return existing;

  values.push(id);
  const result = await query<CatchRow>(
    `UPDATE catches SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING *, ST_AsText(exact_location) as exact_location`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteCatch(id: string, userId: string): Promise<void> {
  const result = await query(
    'DELETE FROM catches WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  if (result.rowCount === 0) {
    throw new AppError('forbidden', 403, 'Not allowed to delete this catch');
  }
}

export async function listCatches(
  viewerId: string,
  filters: {
    feed: 'nearby' | 'following' | 'trending';
    lat?: number;
    lng?: number;
    radiusKm?: number;
    speciesId?: string;
    userId?: string;
    limit: number;
    cursor?: string;
  }
): Promise<CatchRow[]> {
  const values: unknown[] = [viewerId];
  let idx = 2;
  const conditions: string[] = [
    `(
       c.privacy = 'public'
       OR c.user_id = $1
       OR (
         c.privacy = 'friends_only'
         AND EXISTS (
           SELECT 1 FROM friendships f
           WHERE f.status = 'accepted'
             AND (
               (f.requester_id = $1 AND f.addressee_id = c.user_id)
               OR (f.addressee_id = $1 AND f.requester_id = c.user_id)
             )
         )
       )
     )`,
  ];

  if (filters.speciesId) {
    conditions.push(`c.species_id = $${idx++}`);
    values.push(filters.speciesId);
  }

  if (filters.userId) {
    conditions.push(`c.user_id = $${idx++}`);
    values.push(filters.userId);
  }

  if (filters.feed === 'following') {
    conditions.push(`EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND (f.requester_id = $1 OR f.addressee_id = $1)
        AND (f.requester_id = c.user_id OR f.addressee_id = c.user_id)
    )`);
  }

  if (filters.lat !== undefined && filters.lng !== undefined && filters.radiusKm) {
    conditions.push(`ST_DWithin(
      c.exact_location,
      ST_SetSRID(ST_MakePoint($${idx + 1}, $${idx}), 4326)::geography,
      $${idx + 2} * 1000
    )`);
    values.push(filters.lat, filters.lng, filters.radiusKm);
    idx += 3;
  }

  if (filters.cursor) {
    conditions.push(`c.catch_date < $${idx++}`);
    values.push(new Date(filters.cursor));
  }

  const orderBy =
    filters.feed === 'trending'
      ? '(SELECT COUNT(*) FROM catch_likes l WHERE l.catch_id = c.id) DESC, c.catch_date DESC'
      : 'c.catch_date DESC';

  const result = await query<CatchRow>(
    `SELECT
       c.*,
       ST_AsText(c.exact_location) as exact_location,
       u.display_name as user_display_name,
       u.handle as user_handle,
       u.avatar_url as user_avatar_url,
       s.english_name as species_english,
       s.arabic_name as species_arabic,
       (SELECT COUNT(*) FROM catch_likes l WHERE l.catch_id = c.id) as likes_count,
       (SELECT COUNT(*) FROM catch_comments m WHERE m.catch_id = c.id) as comments_count
     FROM catches c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN species s ON s.id = c.species_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT $${idx++}`,
    [...values, filters.limit]
  );
  return result.rows;
}

export function parseWktPoint(wkt: string | null): { latitude: number; longitude: number } | null {
  if (!wkt) return null;
  const match = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!match) return null;
  return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
}
