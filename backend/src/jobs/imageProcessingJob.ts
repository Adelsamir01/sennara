import { Job } from 'bullmq';
import sharp from 'sharp';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '../config/s3';

export interface ImageProcessingData {
  key: string;
  widths?: number[];
}

export async function processImage(job: Job<ImageProcessingData>): Promise<void> {
  const { key, widths = [320, 800, 1200] } = job.data;

  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
  );

  if (!response.Body) {
    throw new Error('Empty image body');
  }

  const buffer = Buffer.from(await response.Body.transformToByteArray());

  for (const width of widths) {
    const resized = await sharp(buffer)
      .resize(width, undefined, { withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    const variantKey = key.replace(/\.(\w+)$/, `-${width}w.$1`);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: variantKey,
        Body: resized,
        ContentType: 'image/jpeg',
      })
    );
  }
}
