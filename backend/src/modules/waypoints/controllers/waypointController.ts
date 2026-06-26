import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { t } from '../../../shared/i18n';
import * as waypointRepo from '../repositories/waypointRepository';
import {
  createWaypointSchema,
  updateWaypointSchema,
  listWaypointsSchema,
} from '../dto/waypointSchemas';

function publicWaypoint(
  row: waypointRepo.WaypointRow,
  viewer?: { userId: string; tier?: string }
) {
  const coords = waypointRepo.parseWktPoint(row.coordinates);
  const isOwner = viewer ? row.user_id === viewer.userId : false;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    privacy: row.privacy,
    waypointType: row.waypoint_type,
    waterBody: row.water_body,
    depthMeters: row.depth_meters ? parseFloat(String(row.depth_meters)) : null,
    attributes: row.attributes,
    createdAt: row.created_at,
    // Exact coordinates visible only to owner or premium viewers for public waypoints.
    location:
      isOwner || viewer?.tier === 'premium' || row.privacy !== 'public'
        ? coords
        : approximate(coords),
  };
}

function approximate(coords: { latitude: number; longitude: number }) {
  // ~1.1 km grid obfuscation for free users
  return {
    latitude: Math.round(coords.latitude * 100) / 100,
    longitude: Math.round(coords.longitude * 100) / 100,
  };
}

export async function createWaypoint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = createWaypointSchema.parse(req.body);
    const userId = req.user!.userId;
    const waypoint = await waypointRepo.createWaypoint(userId, dto);
    res.status(201).json({ waypoint: publicWaypoint(waypoint, req.user) });
  } catch (err) {
    next(err);
  }
}

export async function getWaypoint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const locale = (req.headers['x-locale'] as 'ar' | 'en') || 'ar';
    const waypoint = await waypointRepo.findWaypointById(req.params.id);
    if (!waypoint) {
      next(new AppError('notFound', 404, t(locale, 'errors.notFound')));
      return;
    }
    res.status(200).json({ waypoint: publicWaypoint(waypoint, req.user) });
  } catch (err) {
    next(err);
  }
}

export async function updateWaypoint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = updateWaypointSchema.parse(req.body);
    const userId = req.user!.userId;
    const waypoint = await waypointRepo.updateWaypoint(req.params.id, userId, dto);
    if (!waypoint) {
      next(new AppError('notFound', 404, 'Waypoint not found'));
      return;
    }
    res.status(200).json({ waypoint: publicWaypoint(waypoint, req.user) });
  } catch (err) {
    next(err);
  }
}

export async function deleteWaypoint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const locale = (req.headers['x-locale'] as 'ar' | 'en') || 'ar';
    await waypointRepo.deleteWaypoint(req.params.id, req.user!.userId);
    res.status(200).json({ message: t(locale, 'common.success') });
  } catch (err) {
    next(err);
  }
}

export async function listNearby(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = listWaypointsSchema.parse(req.query);
    const userId = req.user!.userId;
    const waypoints = await waypointRepo.listNearbyWaypoints(
      userId,
      dto.lat,
      dto.lng,
      dto.radiusKm,
      dto.limit,
      dto.offset
    );
    res.status(200).json({
      waypoints: waypoints.map((w) => publicWaypoint(w, req.user)),
    });
  } catch (err) {
    next(err);
  }
}
