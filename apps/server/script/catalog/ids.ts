import { createHash } from 'node:crypto';

/**
 * Every primary key the importer writes, derived from the codes in the JSON
 * rather than handed out by `defaultRandom()`.
 *
 * That is what makes a re-run an UPDATE instead of a second copy: same code,
 * same uuid, so editing a file and running again changes only what changed —
 * which also makes an interrupted run resumable by repeating it.
 *
 * Keyed on the hand-written `code` in the JSON, never on an id from anywhere
 * else — which is what lets a category file be renamed, reordered or rewritten
 * without renumbering the catalogue.
 *
 * RFC 4122 §4.3: sha1 over namespace bytes + name, then stamp version 5 and the
 * RFC variant.
 */

/** Random once, then frozen forever: changing it renumbers the whole catalogue. */
const NAMESPACE = 'b7c1e0d2-4a86-4f3e-9c15-2d8f6a0b71e4';

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

/** Namespaced per entity kind so two codes that collide as text cannot as ids. */
export const categoryId = (code: string): string => uuidV5(`category:${code}`);
export const specId = (categoryCode: string, key: string): string =>
  uuidV5(`spec:${categoryCode}:${key}`);
export const specOptionId = (categoryCode: string, key: string, value: string): string =>
  uuidV5(`spec-option:${categoryCode}:${key}:${value}`);

export const productId = (code: string): string => uuidV5(`product:${code}`);
export const addonId = (productCode: string, handle: string): string =>
  uuidV5(`addon:${productCode}:${handle}`);
export const faqId = (productCode: string, handle: string): string =>
  uuidV5(`faq:${productCode}:${handle}`);
export const questionId = (productCode: string, key: string): string =>
  uuidV5(`question:${productCode}:${key}`);
export const questionOptionId = (productCode: string, key: string, value: string): string =>
  uuidV5(`question-option:${productCode}:${key}:${value}`);

/**
 * A stable handle for a row the author did not give a code to — an addon, an
 * FAQ. Derived from its Italian text, so reordering the list keeps every id and
 * only a rewritten name mints a new one (the old row is then pruned).
 */
export function handleOf(text: string): string {
  const handle = text
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 60);
  return handle || 'untitled';
}

/** `handleOf` with the slug rules the database and `SlugSchema` enforce. */
export const slugify = handleOf;
