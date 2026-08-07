import type { MediaItem, ProductMedia } from '@mia/db/schema';
import { MEDIA_PROFILES, type MediaProfileName } from '@mia/validators';

import type { FileUploader } from '../../../infra/storage/port.ts';
import { STAGING_PREFIX } from '../../../infra/storage/port.ts';
import { httpError } from '../../../shared/http/errors.ts';

/**
 * Owns the life of every stored object: the dangling-path guard, the
 * server-side geometry check, the `_staging/ → final` move, and the
 * delete-diff on save. One helper, because the five `icon` columns and the
 * product `media` blob need exactly the same treatment and must not each grow
 * their own copy.
 */

export { STAGING_PREFIX };

interface ProfileRules {
  mime: readonly string[];
  maxBytes: number;
  square?: boolean;
  edge?: number;
  maxEdge?: number;
}

const rules = (name: MediaProfileName): ProfileRules => MEDIA_PROFILES[name] as ProfileRules;

const invalidMedia = (message: string) => httpError(422, message, 'invalid_media');

/**
 * Verify a freshly uploaded object against its profile and move it out of
 * staging. The upload route already converted and sized the object; this
 * re-checks format and geometry on a 64-byte ranged read — defense in depth,
 * so a path smuggled in through any other door still cannot commit.
 */
async function commitPath(
  storage: FileUploader,
  path: string,
  profileName: MediaProfileName,
  scope: string,
): Promise<string> {
  const profile = rules(profileName);

  const stat = await storage.head(path);
  if (!stat) throw invalidMedia(`No uploaded file at "${path}".`);
  if (stat.size > profile.maxBytes) throw invalidMedia('Uploaded file is too large.');
  if (stat.contentType && !profile.mime.includes(stat.contentType)) {
    throw invalidMedia(`Type ${stat.contentType} is not allowed here.`);
  }

  // SVG has no fixed pixel geometry and is stored as-is — nothing to probe.
  const isVector = stat.contentType === 'image/svg+xml';
  if (!isVector && profile.mime.every((mime) => mime.startsWith('image/'))) {
    const dimensions = await storage.probeImage(path);
    if (!dimensions) throw invalidMedia('Uploaded file is not a valid WebP image.');
    if (profile.square && dimensions.width !== dimensions.height) {
      throw invalidMedia('Icons must be square.');
    }
    if (profile.edge && (dimensions.width !== profile.edge || dimensions.height !== profile.edge)) {
      throw invalidMedia(`Icons must be exactly ${profile.edge}×${profile.edge}.`);
    }
    if (profile.maxEdge && Math.max(dimensions.width, dimensions.height) > profile.maxEdge) {
      throw invalidMedia(`Images must be at most ${profile.maxEdge}px on the longest edge.`);
    }
  }

  // `_staging/<uuid>/<filename>` → `<scope>/<uuid8>-<filename>`.
  const [, uuid = '', ...rest] = path.split('/');
  const fileName = rest.join('/') || 'file';
  const finalKey = `${scope}/${uuid.slice(0, 8)}-${fileName}`;
  await storage.move(path, finalKey);
  return finalKey;
}

const pathsOf = (media: ProductMedia): Set<string> => {
  const paths = new Set<string>();
  for (const item of [media.thumbnail, media.cleanPng]) if (item) paths.add(item.path);
  for (const list of [media.gallery, media.videos, media.documents]) {
    for (const item of list) paths.add(item.path);
  }
  return paths;
};

async function commitItem(
  storage: FileUploader,
  item: MediaItem | null,
  profileName: MediaProfileName,
  scope: string,
  knownPaths: Set<string>,
): Promise<MediaItem | null> {
  if (!item) return null;
  if (item.path.startsWith(STAGING_PREFIX)) {
    return { ...item, path: await commitPath(storage, item.path, profileName, scope) };
  }
  // A non-staging path must already belong to this entity — anything else is
  // a dangling reference or an attempt to claim someone else's object.
  if (!knownPaths.has(item.path)) throw invalidMedia(`Unknown media path "${item.path}".`);
  return item;
}

/** Commit an incoming `media` blob against the stored one. */
export async function commitProductMedia(
  storage: FileUploader,
  productId: string,
  stored: ProductMedia,
  incoming: ProductMedia,
): Promise<ProductMedia> {
  const scope = `products/${productId}`;
  const known = pathsOf(stored);

  const one = (item: MediaItem | null, profile: MediaProfileName) =>
    commitItem(storage, item, profile, scope, known);
  const many = (items: MediaItem[], profile: MediaProfileName) =>
    Promise.all(items.map((item) => one(item, profile))).then(
      (list) => list.filter((item): item is MediaItem => item !== null),
    );

  const committed: ProductMedia = {
    thumbnail: await one(incoming.thumbnail, 'product_image'),
    cleanPng: await one(incoming.cleanPng, 'product_image'),
    gallery: await many(incoming.gallery, 'product_image'),
    videos: await many(incoming.videos, 'video'),
    documents: await many(incoming.documents, 'document'),
  };

  // The delete-diff: every stored path that vanished loses its object.
  const kept = pathsOf(committed);
  for (const path of known) {
    if (!kept.has(path)) await storage.delete(path).catch(() => undefined);
  }
  return committed;
}

/**
 * Same contract for a bare `icon text` column: a string comparison instead of
 * a set diff. Returns the final key (or null), deleting a replaced object.
 */
export async function commitIcon(
  storage: FileUploader,
  scope: string,
  stored: string | null,
  incoming: string | null | undefined,
  profileName: MediaProfileName,
): Promise<string | null> {
  if (incoming === undefined) return stored;
  let final: string | null;
  if (incoming === null) {
    final = null;
  } else if (incoming.startsWith(STAGING_PREFIX)) {
    final = await commitPath(storage, incoming, profileName, scope);
  } else if (incoming === stored) {
    final = stored;
  } else {
    throw invalidMedia(`Unknown icon path "${incoming}".`);
  }
  if (stored && stored !== final) await storage.delete(stored).catch(() => undefined);
  return final;
}

/** Best-effort bucket cleanup when an entity is deleted outright. */
export async function deleteAllMedia(
  storage: FileUploader,
  media: ProductMedia,
  icons: Array<string | null> = [],
): Promise<void> {
  const paths = [...pathsOf(media), ...icons.filter((icon): icon is string => icon !== null)];
  await Promise.all(paths.map((path) => storage.delete(path).catch(() => undefined)));
}
