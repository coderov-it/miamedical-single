/**
 * The two phases that touch R2: category icons, then product media.
 *
 * Both download from the live site, convert through the same
 * `SharpImageConverter` the upload route uses, and store under the same scope
 * the admin's own uploader commits to — so a migrated object and a
 * hand-uploaded one are indistinguishable afterwards. PDFs, MP4s and SVGs pass
 * through untouched, per `MEDIA_PROFILES`.
 *
 * `head()` before every upload makes a re-run cheap: keys are derived from the
 * WordPress attachment id, so a completed download is never fetched twice —
 * which is also what makes an interrupted media pass resumable.
 */
import { eq, type Database } from '@mia/db';
import { categories, products } from '@mia/db/schema';
import { MEDIA_PROFILES } from '@mia/validators';

import { imageConverter } from '../../../src/infra/convert/sharp.ts';
import { r2FileUploader } from '../../../src/infra/storage/r2.ts';
import type { CategoryChunk, MediaChunk, ProductChunk } from '../types.ts';
import { kb, objectReporter, secs } from './progress.ts';

export interface MediaStats {
  uploaded: number;
  reused: number;
  failed: number;
}

interface MediaEntry {
  path: string;
  mimeType: string;
  alt?: { it: string };
}

/** Longest edge of a stored product image. Icons have their own geometry. */
const MAX_EDGE = 2048;

/**
 * The WooCommerce category image becomes `categories.icon` at the `icon_256`
 * geometry. An icon that would breach the profile's `maxBytes` is left unset
 * rather than written: the admin could not have uploaded it, so neither does
 * this.
 */
export async function loadCategoryIcons(
  db: Database,
  categoryChunks: CategoryChunk[],
): Promise<MediaStats> {
  const profile = MEDIA_PROFILES.icon_256;
  const withIcon = categoryChunks.filter((chunk) => chunk.iconSource !== null);
  const report = objectReporter('icon ', withIcon.length);
  const stats: MediaStats = { uploaded: 0, reused: 0, failed: 0 };

  for (const chunk of withIcon) {
    const source = chunk.iconSource!;
    const isVector = source.mimeType === 'image/svg+xml';
    const key = `categories/${chunk.id}/icon-${source.wpAttachmentId}.${isVector ? 'svg' : 'webp'}`;

    const existing = await r2FileUploader.head(key);
    if (existing) {
      stats.reused++;
      report('reuse', key);
    } else {
      const startedAt = Date.now();
      try {
        const downloaded = await download(source.url);
        const bytes = isVector
          ? downloaded
          : (await imageConverter.toWebp(downloaded, { square: true, edge: profile.edge })).bytes;
        if (bytes.byteLength > profile.maxBytes) {
          throw new Error(`${bytes.byteLength} bytes over the ${profile.maxBytes} icon cap`);
        }
        await r2FileUploader.upload(key, bytes, isVector ? source.mimeType : 'image/webp');
        stats.uploaded++;
        report('up', key, `${kb(bytes.byteLength)}  ${secs(startedAt)}`);
      } catch (error) {
        stats.failed++;
        report('fail', chunk.code, `${source.url} — ${(error as Error).message}`);
        continue;
      }
    }

    await db.update(categories).set({ icon: key }).where(eq(categories.id, chunk.id));
  }

  return stats;
}

/** Product thumbnails, galleries, videos and documents into `products.media`. */
export async function loadMedia(
  db: Database,
  media: MediaChunk[],
  productChunks: ProductChunk[],
): Promise<MediaStats> {
  const report = objectReporter('media', media.length);
  const stats: MediaStats = { uploaded: 0, reused: 0, failed: 0 };

  const byProduct = new Map<string, MediaChunk[]>();
  for (const item of media) {
    const list = byProduct.get(item.productId) ?? [];
    list.push(item);
    byProduct.set(item.productId, list);
  }

  for (const [productKey, items] of byProduct) {
    const product = productChunks.find((chunk) => chunk.id === productKey);
    if (!product) continue;

    const blob: {
      thumbnail: MediaEntry | null;
      cleanPng: MediaEntry | null;
      gallery: MediaEntry[];
      videos: MediaEntry[];
      documents: MediaEntry[];
    } = { thumbnail: null, cleanPng: null, gallery: [], videos: [], documents: [] };

    for (const item of items.sort((a, b) => a.position - b.position)) {
      const isImage = item.mimeType.startsWith('image/') && item.mimeType !== 'image/svg+xml';
      const fileName = item.sourceUrl.split('/').pop() ?? `${item.wpAttachmentId}`;
      const stem = fileName.replace(/\.[^.]+$/, '');
      const key = isImage
        ? `products/${product.id}/${item.wpAttachmentId}-${stem}.webp`
        : `products/${product.id}/${item.wpAttachmentId}-${fileName}`;
      const mimeType = isImage ? 'image/webp' : item.mimeType;

      const existing = await r2FileUploader.head(key);
      if (existing) {
        stats.reused++;
        report('reuse', key);
      } else {
        const startedAt = Date.now();
        try {
          const source = await download(item.sourceUrl);
          const stored = isImage
            ? (await imageConverter.toWebp(source, { maxEdge: MAX_EDGE })).bytes
            : source;
          await r2FileUploader.upload(key, stored, mimeType);
          stats.uploaded++;
          report('up', key, `${kb(stored.byteLength)}  ${secs(startedAt)}`);
        } catch (error) {
          stats.failed++;
          report('fail', key, `${item.sourceUrl} — ${(error as Error).message}`);
          continue;
        }
      }

      const entry: MediaEntry = {
        path: key,
        mimeType,
        ...(item.alt ? { alt: { it: item.alt.slice(0, 300) } } : {}),
      };
      if (item.role === 'thumbnail' && !blob.thumbnail) blob.thumbnail = entry;
      else if (item.role === 'document') blob.documents.push(entry);
      else if (item.role === 'video') blob.videos.push(entry);
      else blob.gallery.push(entry);
    }

    // Schema caps: gallery 30, videos 10, documents 20.
    blob.gallery = blob.gallery.slice(0, 30);
    blob.videos = blob.videos.slice(0, 10);
    blob.documents = blob.documents.slice(0, 20);

    await db.update(products).set({ media: blob }).where(eq(products.id, product.id));
  }

  return stats;
}

async function download(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}
