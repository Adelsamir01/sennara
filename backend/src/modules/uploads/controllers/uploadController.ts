import { Request, Response, NextFunction } from 'express';
import { presignUploadSchema } from '../dto/uploadSchemas';
import * as uploadService from '../services/uploadService';

export async function presignUpload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = presignUploadSchema.parse(req.body);
    const result = await uploadService.createPresignedUpload(
      req.user!.userId,
      dto.filename,
      dto.contentType,
      dto.entityType
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
