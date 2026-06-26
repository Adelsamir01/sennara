import { S3Client } from '@aws-sdk/client-s3';

const credentials = {
  accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
};

export const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials,
});

// Separate client used to generate publicly-routable presigned URLs.
// The endpoint here must match the public proxy (e.g. Nginx /s3/ -> MinIO).
export const s3PublicClient = process.env.S3_PUBLIC_ENDPOINT
  ? new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_PUBLIC_ENDPOINT,
      forcePathStyle: true,
      credentials,
    })
  : s3Client;

export const S3_BUCKET = process.env.S3_BUCKET || 'sennara-uploads';

export function getPublicUrl(key: string): string {
  const endpoint = process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT || '';
  return `${endpoint.replace(/\/$/, '')}/${S3_BUCKET}/${key}`;
}
