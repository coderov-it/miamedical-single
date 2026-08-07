import sharp, { type Metadata } from 'sharp';

import { env } from '../../config/env.ts';
import {
  type ConvertedImage,
  type ConvertTarget,
  type ImageConverter,
  UnreadableImageError,
} from './port.ts';

/**
 * libvips via sharp — decodes JPEG/PNG/WebP/AVIF/GIF, honours EXIF rotation,
 * and encodes WebP at a quality meant to be visually lossless for product
 * photography. Fast enough that conversion on the request path is a
 * non-event: a 20 MP JPEG lands well under a second.
 */
export class SharpImageConverter implements ImageConverter {
  constructor(private readonly quality: number) {}

  async toWebp(input: Uint8Array, target: ConvertTarget): Promise<ConvertedImage> {
    // `rotate()` with no args applies the EXIF orientation, so a portrait
    // phone photo does not land sideways once the metadata is stripped.
    let image = sharp(input).rotate();

    let meta: Metadata;
    try {
      meta = await image.metadata();
    } catch {
      throw new UnreadableImageError();
    }
    if (!meta.width || !meta.height) throw new UnreadableImageError();

    // metadata() reports pre-rotation dimensions; EXIF orientations 5–8 swap.
    const swapped = (meta.orientation ?? 1) >= 5;
    const width = swapped ? meta.height : meta.width;
    const height = swapped ? meta.width : meta.height;

    if (target.square) {
      // Exact-edge profiles always land on the edge (upscaling included);
      // maxEdge squares crop at the source's short side and only shrink.
      const side = target.edge ?? Math.min(width, height, target.maxEdge ?? Number.MAX_SAFE_INTEGER);
      image = image.resize(side, side, { fit: 'cover', position: 'centre' });
    } else if (target.maxEdge) {
      image = image.resize(target.maxEdge, target.maxEdge, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    try {
      const { data, info } = await image
        .webp({ quality: this.quality, smartSubsample: true })
        .toBuffer({ resolveWithObject: true });
      return { bytes: data, width: info.width, height: info.height, mimeType: 'image/webp' };
    } catch {
      throw new UnreadableImageError();
    }
  }
}

/** The one converter instance the app wires everywhere. */
export const imageConverter: ImageConverter = new SharpImageConverter(env.MEDIA_WEBP_QUALITY);
