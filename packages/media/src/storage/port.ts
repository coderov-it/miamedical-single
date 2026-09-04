/**
 * Object-storage port. Feature code depends on the `FileUploader` interface;
 * the concrete provider (`R2FileUploader`, r2.ts) is instantiated once and
 * imported as a singleton. Never feature policy — mime/size/geometry rules
 * live in `MEDIA_PROFILES` and the media service, not here.
 */

/** Uploads land here first; the entity save moves them to their final key. */
export const STAGING_PREFIX = '_staging/';

export interface ObjectStat {
  size: number;
  contentType: string | null;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface StoredObject {
  key: string;
  size: number;
  lastModified: Date;
}

export interface FileUploader {
  /** Write `bytes` at `key`. Overwrites silently — keys are UUID-scoped. */
  upload(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  /** `null` when the object does not exist — the dangling-path guard on save. */
  head(key: string): Promise<ObjectStat | null>;
  /**
   * Real dimensions of a stored WebP, read from a ranged GET of the first 64
   * bytes (VP8 / VP8L / VP8X all carry width+height in that window). `null`
   * when the object is missing or not parseable as WebP. Defense in depth on
   * commit: the server wrote the object itself, but this re-checks geometry
   * without transferring the body.
   */
  probeImage(key: string): Promise<ImageDimensions | null>;
  /** Staging → final. R2 has no rename: copy, then delete the source. */
  move(fromKey: string, toKey: string): Promise<void>;
  /** Every object under `prefix` — feeds the orphaned-staging sweep. */
  list(prefix: string): Promise<StoredObject[]>;
}
