/**
 * REMOVED 2026-09-01 — This file was moved here from `src/lib/storage.ts`.
 * The R2 storage helper was never wired into the actual upload path; Changa
 * uses Convex file storage (`ctx.storage` in `convex/files.ts`) instead.
 *
 * Kept in `docs/` for historical reference only. Do not import this file —
 * the `@aws-sdk/client-s3` dependency is no longer needed and is a candidate
 * for removal in a future cleanup pass.
 *
 * If/when R2 is re-introduced (e.g. for cheaper dataset hosting), this is
 * a starting point but should be wired through the Changa asset schema
 * (currently `changaSubmissionAssets.storageId: v.id("_storage")`).
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'samiati-media';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

type MediaType = 'audio' | 'image' | 'video' | 'document';

function getContentType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    mp3: 'audio/mpeg',
    webm: 'audio/webm',
    wav: 'audio/wav',
    mp4: 'video/mp4',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
  };
  return mimeMap[ext || ''] || 'application/octet-stream';
}

export async function uploadToR2(
  file: File,
  mediaType: MediaType,
  customKey?: string
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = customKey || `${mediaType}/${timestamp}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file,
    ContentType: getContentType(file),
  });

  await r2.send(command);
  return key;
}

export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  await r2.send(command);
}

export function getR2Url(key: string): string {
  if (PUBLIC_URL) {
    return `${PUBLIC_URL}/${key}`;
  }
  return `https://${BUCKET}.${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;
}
