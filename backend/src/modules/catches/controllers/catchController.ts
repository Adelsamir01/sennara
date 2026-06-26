import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { t } from '../../../shared/i18n';
import * as catchRepo from '../repositories/catchRepository';
import { createCatchSchema, updateCatchSchema, listCatchesSchema } from '../dto/catchSchemas';

interface CatchWithCounts extends catchRepo.CatchRow {
  user_display_name?: string | null;
  user_handle?: string | null;
  user_avatar_url?: string | null;
  species_english?: string | null;
  species_arabic?: string | null;
  likes_count?: string;
  comments_count?: string;
}

function publicCatch(
  row: CatchWithCounts,
  viewerId: string,
  viewerTier?: string
) {
  const isOwner = row.user_id === viewerId;
  const coords = catchRepo.parseWktPoint(row.exact_location);

  // Exact location: owner always sees exact; others see exact only if premium + public.
  let location = coords;
  if (!isOwner && row.privacy === 'public' && viewerTier !== 'premium') {
    location = coords
      ? {
          latitude: Math.round(coords.latitude * 100) / 100,
          longitude: Math.round(coords.longitude * 100) / 100,
        }
      : null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    user: {
      displayName: row.user_display_name,
      handle: row.user_handle,
      avatarUrl: row.user_avatar_url,
    },
    species: row.species_id
      ? {
          id: row.species_id,
          englishName: row.species_english,
          arabicName: row.species_arabic,
        }
      : null,
    weightKg: row.weight_kg ? parseFloat(String(row.weight_kg)) : null,
    lengthCm: row.length_cm ? parseFloat(String(row.length_cm)) : null,
    baitType: row.bait_type,
    lureType: row.lure_type,
    technique: row.technique,
    description: row.description,
    photoUrls: row.photo_urls,
    videoUrls: row.video_urls,
    privacy: row.privacy,
    location,
    weather: row.weather,
    catchDate: row.catch_date,
    createdAt: row.created_at,
    likesCount: parseInt(String(row.likes_count || '0'), 10),
    commentsCount: parseInt(String(row.comments_count || '0'), 10),
  };
}

export async function createCatch(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = createCatchSchema.parse(req.body);
    const userId = req.user!.userId;
    const catchRecord = await catchRepo.createCatch(userId, dto);
    res.status(201).json({ catch: publicCatch(catchRecord, userId) });
  } catch (err) {
    next(err);
  }
}

export async function getCatch(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const locale = (req.headers['x-locale'] as 'ar' | 'en') || 'ar';
    const row = await catchRepo.findCatchById(req.params.id);
    if (!row) {
      next(new AppError('notFound', 404, t(locale, 'errors.notFound')));
      return;
    }
    res.status(200).json({
      catch: publicCatch(row as CatchWithCounts, req.user!.userId, req.user?.tier),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCatch(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = updateCatchSchema.parse(req.body);
    const userId = req.user!.userId;
    const updated = await catchRepo.updateCatch(req.params.id, userId, dto);
    if (!updated) {
      next(new AppError('notFound', 404, 'Catch not found'));
      return;
    }
    res.status(200).json({ catch: publicCatch(updated, userId) });
  } catch (err) {
    next(err);
  }
}

export async function deleteCatch(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const locale = (req.headers['x-locale'] as 'ar' | 'en') || 'ar';
    await catchRepo.deleteCatch(req.params.id, req.user!.userId);
    res.status(200).json({ message: t(locale, 'logbook.catchDeleted') });
  } catch (err) {
    next(err);
  }
}

export async function listCatches(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = listCatchesSchema.parse(req.query);
    const viewerId = req.user!.userId;
    const rows = await catchRepo.listCatches(viewerId, {
      feed: dto.feed,
      lat: dto.lat,
      lng: dto.lng,
      radiusKm: dto.radiusKm,
      speciesId: dto.speciesId,
      userId: dto.userId,
      limit: dto.limit,
      cursor: dto.cursor,
    });

    const nextCursor =
      rows.length === dto.limit && rows.length > 0
        ? rows[rows.length - 1].catch_date.toISOString()
        : null;

    res.status(200).json({
      catches: rows.map((r) =>
        publicCatch(r as CatchWithCounts, viewerId, req.user?.tier)
      ),
      nextCursor,
    });
  } catch (err) {
    next(err);
  }
}
