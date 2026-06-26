import { z } from 'zod';

export const catchPrivacySchema = z.enum(['public', 'friends_only', 'secret']);

export const createCatchSchema = z.object({
  speciesId: z.string().uuid().optional(),
  customSpeciesName: z.string().max(120).optional(),
  waypointId: z.string().uuid().optional(),
  weightKg: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  baitType: z.string().max(120).optional(),
  lureType: z.string().max(120).optional(),
  technique: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  photoUrls: z.array(z.string().url()).default([]),
  videoUrls: z.array(z.string().url()).default([]),
  privacy: catchPrivacySchema.default('friends_only'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  catchDate: z.coerce.date().optional(),
  weather: z.record(z.unknown()).default({}),
});

export const updateCatchSchema = createCatchSchema.partial();

export const listCatchesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.1).max(100).optional(),
  speciesId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  feed: z.enum(['nearby', 'following', 'trending']).default('nearby'),
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export type CreateCatchDto = z.infer<typeof createCatchSchema>;
export type UpdateCatchDto = z.infer<typeof updateCatchSchema>;
export type ListCatchesDto = z.infer<typeof listCatchesSchema>;
