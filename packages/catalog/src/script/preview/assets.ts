/**
 * A media ref → the file on disk, and the href the page points at.
 *
 * The two-step lookup repeats `script/sync/resolve.ts` rather
 * than importing it, because this package must not depend on the server: a
 * bare name lives in the category's own folder, a name containing a slash is
 * relative to the assets root. Repeating it is only safe while the two agree,
 * so the rule is written once here and once there and both say the same thing
 * — get it wrong and the preview shows a broken photo for a ref the importer
 * would have resolved, which is worse than no preview at all.
 *
 * The page is written INTO the assets root, so an href is just the path
 * relative to that root and no file is ever copied or served.
 */
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

export type AssetKind = 'image' | 'video' | 'document';

export interface ResolvedAsset {
  /** Exactly what the data file wrote. Every failure message quotes this. */
  ref: string;
  kind: AssetKind;
  /** Relative to the assets root, url-encoded. Empty when nothing was found. */
  href: string;
  /** Where it was looked for, reported when it is not there. */
  sourcePath: string;
  exists: boolean;
  bytes: number;
}

const IMAGE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']);
const VIDEO = new Set(['.mp4', '.webm', '.mov']);

function kindOf(ref: string): AssetKind {
  const dot = ref.lastIndexOf('.');
  const extension = dot === -1 ? '' : ref.slice(dot).toLowerCase();
  if (IMAGE.has(extension)) return 'image';
  if (VIDEO.has(extension)) return 'video';
  return 'document';
}

/** A ref resolver bound to one category, mirroring the importer's. */
export type AssetResolver = (ref: string) => ResolvedAsset;

export function assetResolver(assetsRoot: string, categoryCode: string): AssetResolver {
  return (ref) => {
    const kind = kindOf(ref);
    const scoped = {
      relative: `${categoryCode}/${ref}`,
      path: join(assetsRoot, categoryCode, ref),
    };
    const rooted = { relative: ref, path: join(assetsRoot, ref) };

    const found = !ref.includes('/') && existsSync(scoped.path) ? scoped : rooted;
    if (existsSync(found.path)) {
      return {
        ref,
        kind,
        href: encodeURI(found.relative),
        sourcePath: found.path,
        exists: true,
        bytes: statSync(found.path).size,
      };
    }
    return { ref, kind, href: '', sourcePath: found.path, exists: false, bytes: 0 };
  };
}

export function fileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000).toString()} kB`;
}
