/**
 * Object storage and image conversion, as ports plus one adapter each.
 *
 * It lives in a package rather than in the server because two callers need the
 * same encoder: the API's upload route, and the catalogue sync in
 * `@mia/catalog`. A photo imported from a data file and one a person dragged
 * into the admin panel have to be byte-identical afterwards, and the only way
 * to guarantee that is for both to run the same code rather than two copies of
 * it that drift.
 *
 * Nothing here reads an environment variable. Each app resolves its own
 * settings and passes them to the constructor, which is what lets the server
 * boot on its `env` schema while a CLI script reads `process.env` directly.
 */
export {
  UnreadableImageError,
  type ConvertedImage,
  type ConvertTarget,
  type ImageConverter,
} from './convert/port.ts';
export { SharpImageConverter } from './convert/sharp.ts';

export {
  STAGING_PREFIX,
  type FileUploader,
  type ImageDimensions,
  type ObjectStat,
  type StoredObject,
} from './storage/port.ts';
export { R2FileUploader, parseWebpDimensions, r2Endpoint, type R2Config } from './storage/r2.ts';
