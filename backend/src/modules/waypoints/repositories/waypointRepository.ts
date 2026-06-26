import { query } from '../../../config/database';
import { AppError } from '../../../shared/errors/AppError';

export interface WaypointRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  coordinates: string; // WKT from PostGIS
  privacy: string;
  waypoint_type: string;
  water_body: string | null;
  depth_meters: number | null;
  attributes: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export async function createWaypoint(
  userId: string,
  input: {
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    privacy: string;
    waypointType: string;
    waterBody?: string;
    depthMeters?: number;
    attributes?: Record<string, unknown>;
  }
): Promise<WaypointRow> {
  const result = await query<WaypointRow>(
    `INSERT INTO waypoints (
      user_id, name, description, coordinates, privacy, waypoint_type,
      water_body, depth_meters, attributes
    ) VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, $6, $7, $8, $9, $10)
    RETURNING *, ST_AsText(coordinates) as coordinates`,
    [
      userId,
      input.name,
      input.description || null,
      input.longitude,
      input.latitude,
      input.privacy,
      input.waypointType,
      input.waterBody || null,
      input.depthMeters || null,
      JSON.stringify(input.attributes || {}),
    ]
  );
  return result.rows[0];
}

export async function findWaypointById(id: string): Promise<WaypointRow | null> {
  const result = await query<WaypointRow>(
    'SELECT *, ST_AsText(coordinates) as coordinates FROM waypoints WHERE id = $1 LIMIT 1',
    [id]
  );
  return result.rows[0] || null;
}

export async function updateWaypoint(
  id: string,
  userId: string,
  input: Partial<{
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    privacy: string;
    waypointType: string;
    waterBody: string;
    depthMeters: number;
    attributes: Record<string, unknown>;
  }>
): Promise<WaypointRow | null> {
  const existing = await findWaypointById(id);
  if (!existing || existing.user_id !== userId) {
    throw new AppError('forbidden', 403, 'Not allowed to update this waypoint');
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(input.description);
  }
  if (input.latitude !== undefined && input.longitude !== undefined) {
    fields.push(`coordinates = ST_SetSRID(ST_MakePoint($${idx + 1}, $${idx}), 4326)::geography`);
    values.push(input.latitude, input.longitude);
    idx += 2;
  }
  if (input.privacy !== undefined) {
    fields.push(`privacy = $${idx++}`);
    values.push(input.privacy);
  }
  if (input.waypointType !== undefined) {
    fields.push(`waypoint_type = $${idx++}`);
    values.push(input.waypointType);
  }
  if (input.waterBody !== undefined) {
    fields.push(`water_body = $${idx++}`);
    values.push(input.waterBody);
  }
  if (input.depthMeters !== undefined) {
    fields.push(`depth_meters = $${idx++}`);
    values.push(input.depthMeters);
  }
  if (input.attributes !== undefined) {
    fields.push(`attributes = $${idx++}`);
    values.push(JSON.stringify(input.attributes));
  }

  if (fields.length === 0) return existing;

  values.push(id);
  const result = await query<WaypointRow>(
    `UPDATE waypoints SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING *, ST_AsText(coordinates) as coordinates`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteWaypoint(id: string, userId: string): Promise<void> {
  const result = await query(
    'DELETE FROM waypoints WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  if (result.rowCount === 0) {
    throw new AppError('forbidden', 403, 'Not allowed to delete this waypoint');
  }
}

export async function listNearbyWaypoints(
  viewerId: string,
  lat: number,
  lng: number,
  radiusKm: number,
  limit: number,
  offset: number
): Promise<WaypointRow[]> {
  const result = await query<WaypointRow>(
    `SELECT
       w.*,
       ST_AsText(w.coordinates) as coordinates,
       ST_Distance(w.coordinates, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 AS distance_km
     FROM waypoints w
     WHERE ST_DWithin(
       w.coordinates,
       ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
       $3 * 1000
     )
     AND (
       w.privacy = 'public'
       OR w.user_id = $4
       OR (
         w.privacy = 'friends_only'
         AND EXISTS (
           SELECT 1 FROM friendships f
           WHERE f.status = 'accepted'
             AND (
               (f.requester_id = $4 AND f.addressee_id = w.user_id)
               OR (f.addressee_id = $4 AND f.requester_id = w.user_id)
             )
         )
       )
     )
     ORDER BY w.coordinates <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
     LIMIT $5 OFFSET $6`,
    [lat, lng, radiusKm, viewerId, limit, offset]
  );
  return result.rows;
}

export function parseWktPoint(wkt: string): { latitude: number; longitude: number } {
  const match = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!match) throw new AppError('internal', 500, 'Invalid WKT point');
  return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
}
