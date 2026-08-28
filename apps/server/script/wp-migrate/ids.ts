import { createHash } from 'node:crypto';

/**
 * Deterministic UUIDv5 from a WordPress row id.
 *
 * Every entity gets its primary key here, in the extract phase, rather than
 * from `defaultRandom()` at insert time. Three things depend on that:
 *
 *  - the JSON chunks can cross-reference each other (a spec value naming its
 *    product, a media entry naming its R2 scope) before anything is written;
 *  - R2 object keys are stable, so re-running the loader does not orphan a
 *    bucket full of uploads under a fresh product id;
 *  - the loader is idempotent — same WordPress row, same uuid, so a second run
 *    updates rather than duplicating. Edit a chunk, re-run, get the fix.
 *
 * RFC 4122 §4.3: sha1 over namespace bytes + name, then stamp version 5 and
 * the RFC variant. No dependency — `node:crypto` is already here.
 */

/** Random once, then frozen forever: changing it renumbers the whole catalog. */
const NAMESPACE = '6f1a2c04-9e3b-4d7a-8f52-1c0b7e4a9d31';

export function uuidV5(name: string, namespace: string = NAMESPACE): string {
  const hash = createHash('sha1');
  hash.update(Buffer.from(namespace.replaceAll('-', ''), 'hex'));
  hash.update(Buffer.from(name, 'utf8'));
  const bytes = hash.digest();

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50; // version 5
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // RFC 4122 variant

  const hex = bytes.subarray(0, 16).toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Namespaced per entity kind so a term and a post that happen to share a
 * numeric id can never collide.
 */
export const productId = (postId: number): string => uuidV5(`product:${postId}`);
export const categoryId = (termId: number): string => uuidV5(`category:${termId}`);
export const specId = (categoryCode: string, key: string): string =>
  uuidV5(`spec:${categoryCode}:${key}`);
export const specOptionId = (categoryCode: string, key: string, value: string): string =>
  uuidV5(`spec-option:${categoryCode}:${key}:${value}`);
export const addonId = (wpAddonId: number): string => uuidV5(`addon:${wpAddonId}`);
