/**
 * The R2 pass: category icons, spec icons, add-on icons, and the product media
 * blob. Everything goes through the same `MEDIA_PROFILES` rules and the same
 * sharp encoder the upload route uses, so an imported object and one a person
 * dragged into the admin panel are indistinguishable afterwards.
 *
 * Keys carry a hash of the file's CONTENT: `products/<id>/<sha8>-<name>.webp`.
 * That is what makes the pass both cheap and correct on a re-run — an unchanged
 * photo resolves to a key that already exists and is skipped after one `head()`
 * instead of a download and an encode, while editing a photo under the same
 * file name produces a different key and really does replace what the product
 * shows. (The superseded object stays in the bucket; the staging sweep only
 * covers `_staging/`, so a periodic prune of orphans is a separate job.)
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';

import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import type { MediaItem, ProductMedia } from '@mia/db/schema';
import { categories, categorySpecs, productAddons, products } from '@mia/db/schema';
import { MEDIA_PROFILES, type MediaProfileName } from '@mia/validators';

import { imageConverter } from '../../src/infra/convert/sharp.ts';
import { r2FileUploader } from '../../src/infra/storage/r2.ts';
import type { CatalogPlan, PlannedAsset, PlannedMedia } from './planned.ts';

export interface MediaStats {
  uploaded: number;
  reused: number;
  failed: number;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
};

export async function loadMedia(db: Database, plan: CatalogPlan, log: Log): Promise<MediaStats> {
  const stats: MediaStats = { uploaded: 0, reused: 0, failed: 0 };

  for (const category of plan.categories) {
    if (category.icon) {
      const key = await store(category.icon, `categories/${category.id}`, 'icon_256', stats, log);
      if (key) await db.update(categories).set({ icon: key }).where(eq(categories.id, category.id));
    }
    for (const spec of category.specs) {
      if (!spec.icon) continue;
      const key = await store(spec.icon, `specs/${category.id}`, 'icon_256', stats, log);
      if (key)
        await db.update(categorySpecs).set({ icon: key }).where(eq(categorySpecs.id, spec.id));
    }
  }

  for (const product of plan.products) {
    for (const addon of product.addons) {
      if (!addon.icon) continue;
      const key = await store(addon.icon, `addons/${product.id}`, 'icon_1024', stats, log);
      if (key)
        await db.update(productAddons).set({ icon: key }).where(eq(productAddons.id, addon.id));
    }

    if (product.media.length === 0) continue;
    const blob = await buildBlob(product.media, `products/${product.id}`, stats, log);
    await db.update(products).set({ media: blob }).where(eq(products.id, product.id));
  }

  return stats;
}

async function buildBlob(
  items: PlannedMedia[],
  scope: string,
  stats: MediaStats,
  log: Log,
): Promise<ProductMedia> {
  const blob: ProductMedia = {
    thumbnail: null,
    cleanPng: null,
    gallery: [],
    videos: [],
    documents: [],
  };

  for (const item of [...items].sort((a, b) => a.position - b.position)) {
    const profile = PROFILE_BY_ROLE[item.role];
    const key = await store(item.asset, scope, profile, stats, log);
    if (!key) continue;

    const entry: MediaItem = {
      path: key,
      mimeType: storedMimeType(item.asset, profile),
      ...(item.alt ? { alt: item.alt } : {}),
    };
    if (item.role === 'thumbnail') blob.thumbnail = entry;
    else if (item.role === 'cleanPng') blob.cleanPng = entry;
    else if (item.role === 'video') blob.videos.push(entry);
    else if (item.role === 'document') blob.documents.push(entry);
    else blob.gallery.push(entry);
  }

  // The schema caps, applied here so a long file is trimmed rather than rejected
  // by the admin the next time somebody opens the product.
  blob.gallery = blob.gallery.slice(0, 30);
  blob.videos = blob.videos.slice(0, 10);
  blob.documents = blob.documents.slice(0, 20);
  return blob;
}

const PROFILE_BY_ROLE: Record<PlannedMedia['role'], MediaProfileName> = {
  thumbnail: 'product_image',
  cleanPng: 'product_image',
  gallery: 'product_image',
  video: 'video',
  document: 'document',
};

/**
 * Convert if the profile converts, upload unless the key is already there, and
 * return the final key. `null` means the object could not be stored — reported,
 * counted, and the run carries on: one unreadable JPEG must not cost the other
 * ninety-seven products their import.
 */
async function store(
  asset: PlannedAsset,
  scope: string,
  profileName: MediaProfileName,
  stats: MediaStats,
  log: Log,
): Promise<string | null> {
  const key = keyFor(asset, scope, profileName);
  try {
    if (await r2FileUploader.head(key)) {
      stats.reused += 1;
      log('reuse', key);
      return key;
    }

    const bytes = await encode(asset, profileName);
    const profile = MEDIA_PROFILES[profileName];
    if (bytes.byteLength > profile.maxBytes) {
      throw new Error(
        `${kb(bytes.byteLength)} is over the ${kb(profile.maxBytes)} cap for ${profileName}`,
      );
    }
    await r2FileUploader.upload(key, bytes, storedMimeType(asset, profileName));
    stats.uploaded += 1;
    log('up', key, kb(bytes.byteLength));
    return key;
  } catch (error) {
    stats.failed += 1;
    log('fail', asset.ref, (error as Error).message);
    return null;
  }
}

async function encode(asset: PlannedAsset, profileName: MediaProfileName): Promise<Uint8Array> {
  const source = new Uint8Array(readFileSync(asset.sourcePath));
  if (!converts(asset, profileName)) return source;

  const profile = MEDIA_PROFILES[profileName] as {
    square?: boolean;
    edge?: number;
    maxEdge?: number;
  };
  const converted = await imageConverter.toWebp(source, {
    ...(profile.square ? { square: true } : {}),
    ...(profile.edge ? { edge: profile.edge } : {}),
    ...(profile.maxEdge ? { maxEdge: profile.maxEdge } : {}),
  });
  return converted.bytes;
}

/** SVG is stored byte-for-byte; video and PDF pass through; every raster becomes WebP. */
function converts(asset: PlannedAsset, profileName: MediaProfileName): boolean {
  if (profileName === 'video' || profileName === 'document') return false;
  return sourceMimeType(asset) !== 'image/svg+xml';
}

const sourceMimeType = (asset: PlannedAsset): string =>
  MIME_BY_EXTENSION[extname(asset.sourcePath).toLowerCase()] ?? 'application/octet-stream';

const storedMimeType = (asset: PlannedAsset, profileName: MediaProfileName): string =>
  converts(asset, profileName) ? 'image/webp' : sourceMimeType(asset);

/**
 * `<scope>/<sha8>-<name>.<ext>` — the same shape the admin's own commit writes
 * (`<uuid8>-<name>`), with the random half replaced by a hash of the bytes so
 * the key is a function of the file rather than of the moment it was uploaded.
 */
function keyFor(asset: PlannedAsset, scope: string, profileName: MediaProfileName): string {
  const digest = createHash('sha256').update(readFileSync(asset.sourcePath)).digest('hex');
  const name = sanitizeFileName(basename(asset.sourcePath, extname(asset.sourcePath)));
  const extension = converts(asset, profileName)
    ? '.webp'
    : extname(asset.sourcePath).toLowerCase();
  return `${scope}/${digest.slice(0, 8)}-${name}${extension}`;
}

/** The upload route's own rule, so a migrated key and an uploaded one match. */
const sanitizeFileName = (name: string): string =>
  name
    .toLowerCase()
    .replaceAll(/[^a-z0-9.-]+/g, '-')
    .replaceAll(/-{2,}/g, '-')
    .replaceAll(/^[.-]+|[.-]+$/g, '')
    .slice(0, 80) || 'file';

const kb = (bytes: number): string => `${(bytes / 1024).toFixed(0)} kB`;

export type Log = (verb: 'up' | 'reuse' | 'fail', subject: string, detail?: string) => void;

/** Counts every object the media pass would touch, for `--dry-run`. */
export function countObjects(plan: CatalogPlan): number {
  let total = 0;
  for (const category of plan.categories) {
    if (category.icon) total += 1;
    total += category.specs.filter((spec) => spec.icon).length;
  }
  for (const product of plan.products) {
    total += product.media.length;
    total += product.addons.filter((addon) => addon.icon).length;
  }
  return total;
}
