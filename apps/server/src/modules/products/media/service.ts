import type { MediaItem, ProductMedia, VideoItem } from '@mia/db/schema';
import { isExternalVideo, MEDIA_PROFILES, type MediaProfileName } from '@mia/validators';

import { STAGING_PREFIX, type FileUploader } from '@mia/media';
import { httpError } from '../../../shared/http/errors.ts';

/**
 * Owns the life of every stored object: the dangling-path guard, the
 * server-side geometry check, the `_staging/ → final` move, and the rollback
 * of that move when the save fails. One helper, because the three `icon`
 * columns and the product `media` blob need exactly the same treatment and
 * must not each grow their own copy.
 *
 * A save never deletes the object it replaces. The old row may still point at
 * it (the DB write can fail after the commit), so replaced and removed objects
 * stay until the sweep in `modules/media/sweep.ts` finds no row referencing
 * them. Order of operations: docs/code/media-lifecycle.md.
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
 * The final keys one save attempt moved out of staging — and only those. They
 * are the only objects a failed save may delete: anything else was live before
 * the attempt and the unchanged row still references it.
 */
export type CommittedKeys = string[];

/**
 * Run a save that commits media. If `work` throws — a 422 on the third gallery
 * item, a constraint on the UPDATE — every key it committed is deleted and the
 * error rethrown. Keep reads that follow the write outside `work`: once the row
 * is written, its new keys are live and must survive a failed re-read.
 */
export async function withMediaRollback<T>(
  storage: FileUploader,
  work: (committed: CommittedKeys) => Promise<T>,
): Promise<T> {
  const committed: CommittedKeys = [];
  try {
    return await work(committed);
  } catch (error) {
    await Promise.all(committed.map((key) => storage.delete(key).catch(() => undefined)));
    throw error;
  }
}

/**
 * `Promise.all` that waits for every task before rejecting, so a sibling commit
 * still in flight has logged its key by the time the rollback reads the list.
 */
async function settleAll<T>(tasks: Promise<T>[]): Promise<T[]> {
  const results = await Promise.allSettled(tasks);
  const values: T[] = [];
  for (const result of results) {
    if (result.status === 'rejected') throw result.reason;
    values.push(result.value);
  }
  return values;
}

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
  committed: CommittedKeys,
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
  // Logged before the move: a copy that lands and a source-delete that throws
  // still leaves an object at `finalKey` for the rollback to remove.
  committed.push(finalKey);
  await storage.move(path, finalKey);
  return finalKey;
}

const pathsOf = (media: ProductMedia): Set<string> => {
  const paths = new Set<string>();
  for (const item of [media.thumbnail, media.cleanPng]) if (item) paths.add(item.path);
  for (const list of [media.gallery, media.documents]) {
    for (const item of list) paths.add(item.path);
  }
  // YouTube / Facebook / linked videos own no bucket object.
  for (const item of media.videos) if (!isExternalVideo(item)) paths.add(item.path);
  return paths;
};

async function commitItem(
  storage: FileUploader,
  item: MediaItem | null,
  profileName: MediaProfileName,
  scope: string,
  knownPaths: Set<string>,
  committed: CommittedKeys,
): Promise<MediaItem | null> {
  if (!item) return null;
  if (item.path.startsWith(STAGING_PREFIX)) {
    return { ...item, path: await commitPath(storage, item.path, profileName, scope, committed) };
  }
  // A non-staging path must already belong to this entity — anything else is
  // a dangling reference or an attempt to claim someone else's object.
  if (!knownPaths.has(item.path)) throw invalidMedia(`Unknown media path "${item.path}".`);
  return item;
}

/**
 * Commit an incoming `media` blob against the stored one. Every key moved out
 * of staging is appended to `committed`; nothing stored is deleted.
 */
export async function commitProductMedia(
  storage: FileUploader,
  productId: string,
  stored: ProductMedia,
  incoming: ProductMedia,
  committed: CommittedKeys,
): Promise<ProductMedia> {
  const scope = `products/${productId}`;
  const known = pathsOf(stored);

  const one = (item: MediaItem | null, profile: MediaProfileName) =>
    commitItem(storage, item, profile, scope, known, committed);
  const many = (items: MediaItem[], profile: MediaProfileName) =>
    settleAll(items.map((item) => one(item, profile))).then((list) =>
      list.filter((item): item is MediaItem => item !== null),
    );

  const video = (item: VideoItem): Promise<VideoItem | null> => {
    if (isExternalVideo(item)) return Promise.resolve(item);
    return one(item, 'video');
  };

  const result: ProductMedia = {
    thumbnail: await one(incoming.thumbnail, 'product_image'),
    cleanPng: await one(incoming.cleanPng, 'product_image'),
    gallery: await many(incoming.gallery, 'product_image'),
    videos: (await settleAll(incoming.videos.map(video))).filter(
      (item): item is VideoItem => item !== null,
    ),
    documents: await many(incoming.documents, 'document'),
  };
  // No delete-diff: a path that vanished keeps its object until the sweep.
  return result;
}

/**
 * Same contract for a bare `icon text` column: a string comparison instead of
 * a set diff. Returns the final key (or null); a replaced object is left for
 * the sweep.
 */
export async function commitIcon(
  storage: FileUploader,
  scope: string,
  stored: string | null,
  incoming: string | null | undefined,
  profileName: MediaProfileName,
  committed: CommittedKeys,
): Promise<string | null> {
  if (incoming === undefined) return stored;
  if (incoming === null) return null;
  if (incoming.startsWith(STAGING_PREFIX)) {
    return commitPath(storage, incoming, profileName, scope, committed);
  }
  if (incoming === stored) return stored;
  throw invalidMedia(`Unknown icon path "${incoming}".`);
}

/**
 * Best-effort bucket cleanup when an entity is deleted outright. Called only
 * after the DELETE succeeded — the row that referenced these keys is gone.
 */
export async function deleteAllMedia(
  storage: FileUploader,
  media: ProductMedia,
  icons: Array<string | null> = [],
): Promise<void> {
  const paths = [...pathsOf(media), ...icons.filter((icon): icon is string => icon !== null)];
  await Promise.all(paths.map((path) => storage.delete(path).catch(() => undefined)));
}
