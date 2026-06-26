import { z } from 'zod';

export const presignUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/|video\//, 'Only image or video uploads allowed'),
  entityType: z.enum(['catch', 'avatar', 'species']).default('catch'),
});

export type PresignUploadDto = z.infer<typeof presignUploadSchema>;
