import type { LanguageCode } from './i18n.ts';

/**
 * Media never gets a table: it is not searched, not filtered, and not shared
 * between products, so rows would buy referential integrity nothing needs.
 * Products carry one typed `media` jsonb column; the five icon-bearing tables
 * carry a plain `icon text` column holding the R2 object key.
 *
 * Upload rules live in `MEDIA_PROFILES` (`@mia/validators`): every image is
 * converted to `image/webp` before it reaches the bucket, icons are square
 * (256² exact, or ≤1024² for addons), video is unconverted but capped at 50 MB.
 */

/** Keyed by `LanguageCode` so a stray `{ fr: … }` fails to compile. */
export type MediaAlt = { [K in LanguageCode]?: string | undefined };

export interface MediaItem {
  /** R2 object key — never a URL. Clients prepend `PUBLIC_MEDIA_BASE_URL`. */
  path: string;
  mimeType: string;
  /** Alt text for images/videos; the visible label for a document. */
  alt?: MediaAlt | undefined;
}

export interface ProductMedia {
  thumbnail: MediaItem | null;
  /** Transparent cutout. WebP like everything else — the key name is historical. */
  cleanPng: MediaItem | null;
  gallery: MediaItem[];
  videos: MediaItem[];
  /** The PDFs — datasheets, manuals, certificates. */
  documents: MediaItem[];
}

export const EMPTY_PRODUCT_MEDIA: ProductMedia = {
  thumbnail: null,
  cleanPng: null,
  gallery: [],
  videos: [],
  documents: [],
};
