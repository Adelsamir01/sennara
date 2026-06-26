import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, S3_BUCKET, getPublicUrl } from '../../../config/s3';

export interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export async function createPresignedUpload(
  userId: string,
  filename: string,
  contentType: string,
  entityType: string
): Promise<PresignedUpload> {
  const ext = filename.split('.').pop() || 'bin';
  const key = `${entityType}/${userId}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return {
    uploadUrl,
    publicUrl: getPublicUrl(key),
    key,
  };
}
