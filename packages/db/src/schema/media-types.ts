import type { LocalizedOptional } from '@mia/validators/language';
import type { VideoProvider } from '@mia/validators/video';

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

/**
 * Keyed by the language registry, so a code that is not a language fails to
 * compile and a newly registered language needs no edit here. Optional in
 * every language including the source: alt text is a nice-to-have, and the
 * CHECK constraints that make Italian mandatory do not apply inside `media`.
 */
export type MediaAlt = LocalizedOptional;

export interface MediaItem {
  /** R2 object key — never a URL. Clients prepend `PUBLIC_MEDIA_BASE_URL`. */
  path: string;
  mimeType: string;
  /** Alt text for images/videos; the visible label for a document. */
  alt?: MediaAlt | undefined;
}

/**
 * A video that lives elsewhere — YouTube, Facebook, or a direct file link.
 * `url` is canonical (see `parseVideoUrl`); the embed URL is derived, never
 * stored. No `path`, so the bucket commit and delete-diff never see it.
 */
export interface ExternalVideo {
  provider: VideoProvider;
  url: string;
  alt?: MediaAlt | undefined;
}

/** An uploaded video file, or an external one. `isExternalVideo` tells them apart. */
export type VideoItem = MediaItem | ExternalVideo;

export interface ProductMedia {
  thumbnail: MediaItem | null;
  /** Transparent cutout. WebP like everything else — the key name is historical. */
  cleanPng: MediaItem | null;
  gallery: MediaItem[];
  videos: VideoItem[];
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
