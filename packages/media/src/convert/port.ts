/**
 * Image-conversion port. Feature code depends on `ImageConverter`; the
 * concrete encoder (`SharpImageConverter`, sharp.ts) is instantiated once.
 * The target geometry comes from `MEDIA_PROFILES` — this layer only knows
 * how to crop, resize and encode, never which profile wants what.
 */

export interface ConvertTarget {
  /** Centre-crop to a square before scaling. */
  square?: boolean | undefined;
  /** Output exactly this edge (squares only) — small sources are upscaled. */
  edge?: number | undefined;
  /** Only shrink: cap the longest edge, never enlarge. */
  maxEdge?: number | undefined;
}

export interface ConvertedImage {
  bytes: Uint8Array;
  width: number;
  height: number;
  mimeType: 'image/webp';
}

export interface ImageConverter {
  /**
   * Decode any supported raster format, apply the target geometry and encode
   * as WebP. Throws `UnreadableImageError` when the input cannot be decoded.
   */
  toWebp(input: Uint8Array, target: ConvertTarget): Promise<ConvertedImage>;
}

/** The route maps this to a 422 — anything else stays a 500. */
export class UnreadableImageError extends Error {
  constructor(message = 'This file is not a readable image.') {
    super(message);
    this.name = 'UnreadableImageError';
  }
}
