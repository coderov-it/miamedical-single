import { randomUUID } from 'node:crypto';

import { P } from '@mia/permissions';
import {
  isImageProfile,
  MAX_UPLOAD_SOURCE_BYTES,
  MEDIA_PROFILE_NAMES,
  MEDIA_PROFILES,
  MediaPathSchema,
  type MediaProfileName,
} from '@mia/validators';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import * as v from 'valibot';

import { STAGING_PREFIX, UnreadableImageError } from '@mia/media';

import { imageConverter, r2FileUploader } from '../../infra/media.ts';
import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { httpError } from '../../shared/http/errors.ts';
import { validate } from '../../shared/http/validate.ts';

/**
 * The upload endpoint and staging-object deletion — there is no media
 * library, no repo, no DB access at all. Files come through the server as
 * multipart bodies: images are decoded and re-encoded as WebP (sharp) to the
 * profile's geometry, video/PDF pass through after mime+size checks. Objects
 * become real when the entity referencing them is saved (`commitMedia` /
 * `commitIcon` move them out of `_staging/`); anything left behind is removed
 * by the periodic sweep in sweep.ts.
 */

const sanitizeFileName = (name: string): string =>
  name
    .toLowerCase()
    .replaceAll(/[^a-z0-9.-]+/g, '-')
    .replaceAll(/-{2,}/g, '-')
    .replaceAll(/^[.-]+|[.-]+$/g, '')
    .slice(0, 80) || 'file';

const invalidMedia = (message: string) => httpError(422, message, 'invalid_media');

const DeleteSchema = v.object({ path: MediaPathSchema });

export const mediaRoutes = new Hono<AppEnv>()
  .post(
    '/upload',
    requirePermission(P.MEDIA_UPLOAD),
    bodyLimit({
      maxSize: MAX_UPLOAD_SOURCE_BYTES + 1_048_576, // multipart framing overhead
      onError: () => {
        throw invalidMedia('File is too large.');
      },
    }),
    async (c) => {
      const body = await c.req.parseBody();
      const profileName = body['profile'];
      const file = body['file'];
      if (
        typeof profileName !== 'string' ||
        !(MEDIA_PROFILE_NAMES as string[]).includes(profileName)
      ) {
        throw invalidMedia('Unknown media profile.');
      }
      if (!(file instanceof File)) throw invalidMedia('No file in the "file" field.');

      const profile = MEDIA_PROFILES[profileName as MediaProfileName];
      if (!(profile.source.mime as readonly string[]).includes(file.type)) {
        throw invalidMedia(`This slot accepts: ${profile.source.mime.join(', ')}.`);
      }
      if (file.size > profile.source.maxBytes) {
        throw invalidMedia(
          `File is too large (max ${Math.round(profile.source.maxBytes / 1_048_576)} MB).`,
        );
      }

      const uuid = randomUUID();
      const source = new Uint8Array(await file.arrayBuffer());

      // SVG is stored byte-for-byte — a vector is already small and scales
      // losslessly, so converting or rasterizing it would only lose quality.
      // It must fit the profile's *final* budget, since nothing shrinks it.
      if (file.type === 'image/svg+xml') {
        if (source.byteLength > profile.maxBytes) {
          throw invalidMedia(`SVG is too large (max ${Math.round(profile.maxBytes / 1024)} KB).`);
        }
        const key = `${STAGING_PREFIX}${uuid}/${sanitizeFileName(file.name)}`;
        await r2FileUploader.upload(key, source, file.type);
        return c.json({
          data: { path: key, mimeType: file.type, sizeBytes: source.byteLength },
        });
      }

      if (isImageProfile(profileName as MediaProfileName)) {
        const target = profile as { square?: boolean; edge?: number; maxEdge?: number };
        let converted;
        try {
          converted = await imageConverter.toWebp(source, {
            square: target.square,
            edge: target.edge,
            maxEdge: target.maxEdge,
          });
        } catch (error) {
          if (error instanceof UnreadableImageError) throw invalidMedia(error.message);
          throw error;
        }
        if (converted.bytes.byteLength > profile.maxBytes) {
          throw invalidMedia('Image is too large even after conversion.');
        }
        const baseName = sanitizeFileName(file.name).replace(/\.[^.]+$/, '') || 'image';
        const key = `${STAGING_PREFIX}${uuid}/${baseName}.webp`;
        await r2FileUploader.upload(key, converted.bytes, converted.mimeType);
        return c.json({
          data: {
            path: key,
            mimeType: converted.mimeType,
            width: converted.width,
            height: converted.height,
            sizeBytes: converted.bytes.byteLength,
          },
        });
      }

      // Video and PDF pass through untouched — bounded, never converted.
      const key = `${STAGING_PREFIX}${uuid}/${sanitizeFileName(file.name)}`;
      await r2FileUploader.upload(key, source, file.type);
      return c.json({
        data: { path: key, mimeType: file.type, sizeBytes: source.byteLength },
      });
    },
  )

  .delete(
    '/object',
    requirePermission(P.MEDIA_DELETE),
    validate('json', DeleteSchema),
    async (c) => {
      const { path } = c.req.valid('json');
      // Committed objects are deleted by the save-diff of the entity that owns
      // them; a direct delete is only for cancelling an upload still in staging.
      if (!path.startsWith(STAGING_PREFIX)) {
        throw httpError(422, 'Only staging objects can be deleted directly.', 'invalid_media');
      }
      await r2FileUploader.delete(path);
      return c.json({ data: { deleted: true } });
    },
  );
