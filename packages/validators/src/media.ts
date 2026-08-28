import * as v from 'valibot';

/**
 * What the picker accepts for image slots. Sharp's prebuilt binaries decode
 * all the raster formats; HEIC/HEIF is deliberately absent (needs a custom
 * libvips). SVG — the recommended icon source — is never converted or
 * resized: a vector is already small and scales losslessly, so it is stored
 * byte-for-byte (bounded by the profile's `maxBytes`). Raster photos may be
 * large — the server shrinks them, so the cap is about abuse, not storage.
 */
const IMAGE_SOURCE = {
  mime: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'],
  maxBytes: 26_214_400,
} as const;

/**
 * Upload contract, shared verbatim by the upload route, the admin uploader
 * and the save path — one table, three consumers, zero drift. Deliberately
 * code rather than env config: these limits are contract, not deployment
 * tuning.
 *
 * `source` is what the admin may hand to `POST /media/upload`; `mime` /
 * `maxBytes` are what may land in the bucket. For image profiles the server
 * converts source → WebP (sharp) and resizes to the profile's geometry, so
 * the two differ. Video and PDF pass through untouched, so they coincide.
 */
export const MEDIA_PROFILES = {
  /** Product thumbnail / cleanPng / gallery. ~2048px WebP at q92 lands well under this. */
  product_image: {
    mime: ['image/webp', 'image/svg+xml'],
    maxBytes: 3_145_728,
    square: false,
    maxEdge: 2048,
    source: IMAGE_SOURCE,
  },
  /** Category and spec icons — raster lands exactly 256×256. */
  icon_256: {
    mime: ['image/webp', 'image/svg+xml'],
    maxBytes: 262_144,
    square: true,
    edge: 256,
    source: IMAGE_SOURCE,
  },
  /** Addon icons — raster lands square, up to 1024×1024. */
  icon_1024: {
    mime: ['image/webp', 'image/svg+xml'],
    maxBytes: 716_800,
    square: true,
    maxEdge: 1024,
    source: IMAGE_SOURCE,
  },
  /** Unconverted, only bounded. */
  video: {
    mime: ['video/mp4', 'video/webm'],
    maxBytes: 31_457_280,
    source: { mime: ['video/mp4', 'video/webm'], maxBytes: 31_457_280 },
  },
  document: {
    mime: ['application/pdf'],
    maxBytes: 15_728_640,
    source: { mime: ['application/pdf'], maxBytes: 15_728_640 },
  },
} as const;

export type MediaProfileName = keyof typeof MEDIA_PROFILES;

export const MEDIA_PROFILE_NAMES = Object.keys(MEDIA_PROFILES) as MediaProfileName[];

/** Profiles whose uploads are decoded and re-encoded as WebP on the server. */
export function isImageProfile(profile: MediaProfileName): boolean {
  return MEDIA_PROFILES[profile].mime.every((mime) => mime.startsWith('image/'));
}

/** R2 object key. Never a URL — clients prepend the CDN base themselves. */
export const MediaPathSchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(512),
  v.regex(/^[a-z0-9_/][a-z0-9._/-]*$/i, 'Not a valid storage path.'),
  v.check((path) => !path.includes('..'), 'Not a valid storage path.'),
);

const AltTextSchema = v.pipe(v.string(), v.trim(), v.maxLength(300));

/** Explicit literal keys, so the output type stays `Partial<Record<LanguageCode, string>>`. */
const AltSchema = v.strictObject({
  it: v.optional(AltTextSchema),
  en: v.optional(AltTextSchema),
});

export const MediaItemSchema = v.strictObject({
  path: MediaPathSchema,
  mimeType: v.pipe(v.string(), v.maxLength(100)),
  alt: v.optional(AltSchema),
});

export const ProductMediaSchema = v.strictObject({
  thumbnail: v.nullable(MediaItemSchema),
  cleanPng: v.nullable(MediaItemSchema),
  gallery: v.pipe(v.array(MediaItemSchema), v.maxLength(30)),
  videos: v.pipe(v.array(MediaItemSchema), v.maxLength(10)),
  documents: v.pipe(v.array(MediaItemSchema), v.maxLength(20)),
});

export const EMPTY_PRODUCT_MEDIA_INPUT = {
  thumbnail: null,
  cleanPng: null,
  gallery: [],
  videos: [],
  documents: [],
};

/** The largest body `POST /media/upload` may ever carry (multipart overhead aside). */
export const MAX_UPLOAD_SOURCE_BYTES = Math.max(
  ...MEDIA_PROFILE_NAMES.map((name) => MEDIA_PROFILES[name].source.maxBytes),
);

export type MediaItemInput = v.InferOutput<typeof MediaItemSchema>;
export type ProductMediaInput = v.InferOutput<typeof ProductMediaSchema>;
