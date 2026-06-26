import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

const credentials = {
  accessKeyId: env.S3_ACCESS_KEY_ID,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY,
};

export const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials,
});

// Separate client used to generate publicly-routable presigned URLs.
// The endpoint here must match the public proxy (e.g. Nginx /sennara-uploads/ -> MinIO).
export const s3PublicClient = env.S3_PUBLIC_ENDPOINT
  ? new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_PUBLIC_ENDPOINT,
      forcePathStyle: true,
      credentials,
    })
  : s3Client;

export const S3_BUCKET = env.S3_BUCKET;

export function getPublicUrl(key: string): string {
  const endpoint = env.S3_PUBLIC_ENDPOINT || env.S3_ENDPOINT;
  return `${endpoint.replace(/\/$/, '')}/${S3_BUCKET}/${key}`;
}
