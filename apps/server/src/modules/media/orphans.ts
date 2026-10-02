import type { FileUploader, StoredObject } from '@mia/media';

/**
 * Reclaims committed objects no row references any more. A save never deletes
 * what it replaces (see `products/media/service.ts`), so this is the only
 * place a replaced or removed final object leaves the bucket.
 *
 * An object is deleted only when all of these hold:
 *
 *   under one of FINAL_PREFIXES      the scopes `commitPath` and the catalogue sync write
 *   older than FINAL_GRACE_MS        a save committing right now is never raced
 *   its key appears in no reference  `loadReferences` runs AFTER the listing
 *   the breaker did not trip         see `BREAKER_*` below
 *
 * Kept free of `env` and the DB client so a test can drive it with fakes; the
 * wiring and the dry-run decision live in sweep.ts. Walkthrough:
 * docs/code/media-lifecycle.md.
 */

/** Every scope a committed object lands under. `_staging/` is the other sweep's. */
export const FINAL_PREFIXES = ['products/', 'addons/', 'categories/', 'specs/'] as const;

/** A day: far longer than any save, so "old" can never mean "being committed". */
export const FINAL_GRACE_MS = 24 * 3_600_000;

/*
  The breaker. A server pointed at the wrong database — a dev box sharing the
  production bucket, a restore that has not run yet — would see most of the
  bucket as unreferenced. Real orphans are a trickle (one per replaced photo),
  so a run that would delete more than half of a non-trivial bucket refuses and
  says so instead.
*/
const BREAKER_MIN_OBJECTS = 20;
const BREAKER_MAX_SHARE = 0.5;

export type ReclaimSkip = 'no_references' | 'breaker';

export interface ReclaimResult {
  /** Objects listed under FINAL_PREFIXES, young and old. */
  scanned: number;
  /** Old enough and referenced nowhere. */
  orphans: string[];
  deleted: number;
  /** Why nothing was deleted although orphans exist; `null` when it ran. */
  skipped: ReclaimSkip | null;
}

export interface ReclaimOptions {
  /** Report the orphans, delete nothing. */
  dryRun: boolean;
  now?: number;
  graceMs?: number;
}

/**
 * `loadReferences` returns every stored string that may name an object key —
 * key columns, jsonb blobs walked to their leaves, and free text an admin could
 * paste a link into. A key is referenced when it occurs inside any of them, a
 * substring test rather than equality, so a full CDN URL keeps its object too.
 */
export async function reclaimFinalObjects(
  uploader: FileUploader,
  loadReferences: () => Promise<string[]>,
  options: ReclaimOptions,
): Promise<ReclaimResult> {
  const cutoff = (options.now ?? Date.now()) - (options.graceMs ?? FINAL_GRACE_MS);

  const listed: StoredObject[] = [];
  for (const prefix of FINAL_PREFIXES) listed.push(...(await uploader.list(prefix)));

  // A missing timestamp comes back as epoch from the adapter — unknown, so kept.
  const old = listed.filter((object) => {
    const time = object.lastModified.getTime();
    return time > 0 && time < cutoff;
  });
  const result: ReclaimResult = { scanned: listed.length, orphans: [], deleted: 0, skipped: null };
  if (old.length === 0) return result;

  // After the listing: a reference written while we listed is still seen.
  const references = await loadReferences();
  const haystack = references.join('\n');
  result.orphans = old.map((object) => object.key).filter((key) => !haystack.includes(key));
  if (result.orphans.length === 0) return result;

  if (references.length === 0) {
    result.skipped = 'no_references';
    return result;
  }
  const share = result.orphans.length / listed.length;
  if (listed.length >= BREAKER_MIN_OBJECTS && share > BREAKER_MAX_SHARE) {
    result.skipped = 'breaker';
    return result;
  }
  if (options.dryRun) return result;

  for (const key of result.orphans) {
    try {
      await uploader.delete(key);
      result.deleted += 1;
    } catch {
      // Best effort: the next tick retries whatever is still unreferenced.
    }
  }
  return result;
}
