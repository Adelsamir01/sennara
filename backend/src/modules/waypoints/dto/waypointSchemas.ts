import { z } from 'zod';

export const waypointPrivacySchema = z.enum(['public', 'friends_only', 'secret']);
export const waypointTypeSchema = z.enum([
  'catch_spot',
  'dock',
  'marina',
  'reef',
  'wreck',
  'river_bank',
  'lake_shore',
  'custom',
]);

export const createWaypointSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  privacy: waypointPrivacySchema.default('secret'),
  waypointType: waypointTypeSchema.default('catch_spot'),
  waterBody: z.string().optional(),
  depthMeters: z.number().positive().optional(),
  attributes: z.record(z.unknown()).default({}),
});

export const updateWaypointSchema = createWaypointSchema.partial();

export const listWaypointsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(100).default(10),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type CreateWaypointDto = z.infer<typeof createWaypointSchema>;
export type UpdateWaypointDto = z.infer<typeof updateWaypointSchema>;
export type ListWaypointsDto = z.infer<typeof listWaypointsSchema>;
