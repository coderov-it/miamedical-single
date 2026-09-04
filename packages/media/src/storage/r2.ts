import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import type { FileUploader, ImageDimensions, ObjectStat, StoredObject } from './port.ts';

/**
 * Cloudflare's endpoint is account-scoped, so unlike every other SDK in the
 * project there is no default host to fall back on — it has to be assembled.
 */
export const r2Endpoint = (accountId: string): string =>
  `https://${accountId}.r2.cloudflarestorage.com`;

/**
 * What the adapter needs to reach a bucket. Every field is optional because an
 * app may boot without object storage configured; the failure is deferred to
 * the first call, where the message can name the variables to set.
 */
export interface R2Config {
  accountId?: string | undefined;
  accessKeyId?: string | undefined;
  secretAccessKey?: string | undefined;
  bucket?: string | undefined;
}

/**
 * Cloudflare R2 through its S3-compatible API: `region: 'auto'` plus the
 * account-scoped endpoint, exactly as Cloudflare documents.
 *
 * Construction is lazy so a caller boots without R2 credentials — only the
 * first storage call fails, with a message that says what to configure.
 */
export class R2FileUploader implements FileUploader {
  private client: S3Client | undefined;
  private bucket: string | undefined;

  constructor(private readonly config: R2Config) {}

  private s3(): { client: S3Client; bucket: string } {
    if (!this.client || !this.bucket) {
      const {
        accountId: R2_ACCOUNT_ID,
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
        bucket: R2_BUCKET,
      } = this.config;
      if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
        throw new Error(
          'Object storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET.',
        );
      }
      this.client = new S3Client({
        region: 'auto',
        endpoint: r2Endpoint(R2_ACCOUNT_ID),
        credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
      });
      this.bucket = R2_BUCKET;
    }
    return { client: this.client, bucket: this.bucket };
  }

  async upload(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    const { client, bucket } = this.s3();
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: contentType }),
    );
  }

  async delete(key: string): Promise<void> {
    const { client, bucket } = this.s3();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  async head(key: string): Promise<ObjectStat | null> {
    const { client, bucket } = this.s3();
    try {
      const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return { size: result.ContentLength ?? 0, contentType: result.ContentType ?? null };
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async probeImage(key: string): Promise<ImageDimensions | null> {
    const { client, bucket } = this.s3();
    try {
      const result = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key, Range: 'bytes=0-63' }),
      );
      const bytes = result.Body ? await result.Body.transformToByteArray() : undefined;
      return bytes ? parseWebpDimensions(bytes) : null;
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async move(fromKey: string, toKey: string): Promise<void> {
    const { client, bucket } = this.s3();
    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        // CopySource is "bucket/key", URL-encoded per the S3 API.
        CopySource: `${bucket}/${encodeURIComponent(fromKey).replaceAll('%2F', '/')}`,
        Key: toKey,
      }),
    );
    await this.delete(fromKey);
  }

  async list(prefix: string): Promise<StoredObject[]> {
    const { client, bucket } = this.s3();
    const objects: StoredObject[] = [];
    let token: string | undefined;
    do {
      const page = await client.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
      );
      for (const item of page.Contents ?? []) {
        if (!item.Key) continue;
        objects.push({
          key: item.Key,
          size: item.Size ?? 0,
          lastModified: item.LastModified ?? new Date(0),
        });
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    return objects;
  }
}

function isNotFound(error: unknown): boolean {
  const name = (error as { name?: string })?.name;
  const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
  return name === 'NotFound' || name === 'NoSuchKey' || status === 404;
}

/**
 * WebP width/height live in the first 64 bytes for all three encodings:
 * RIFF(12) + chunk fourCC/size(8) + payload. No dependency, no body transfer.
 */
export function parseWebpDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 30) return null;
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.subarray(start, start + length));
  if (ascii(0, 4) !== 'RIFF' || ascii(8, 4) !== 'WEBP') return null;

  const chunk = ascii(12, 4);
  const b = (i: number) => bytes[i] ?? 0;

  if (chunk === 'VP8X') {
    // Canvas size: 24-bit little-endian, minus one. Payload starts at 20.
    return {
      width: 1 + (b(24) | (b(25) << 8) | (b(26) << 16)),
      height: 1 + (b(27) | (b(28) << 8) | (b(29) << 16)),
    };
  }
  if (chunk === 'VP8L') {
    if (b(20) !== 0x2f) return null; // signature byte
    return {
      width: 1 + (((b(22) & 0x3f) << 8) | b(21)),
      height: 1 + (((b(24) & 0x0f) << 10) | (b(23) << 2) | ((b(22) & 0xc0) >> 6)),
    };
  }
  if (chunk === 'VP8 ') {
    // Key-frame start code, then 14-bit dimensions.
    if (b(23) !== 0x9d || b(24) !== 0x01 || b(25) !== 0x2a) return null;
    return {
      width: (b(26) | (b(27) << 8)) & 0x3fff,
      height: (b(28) | (b(29) << 8)) & 0x3fff,
    };
  }
  return null;
}
