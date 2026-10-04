/**
 * Where to send someone after signing in, from an untrusted `?next=`.
 *
 * Only a same-site path survives. A prefix check is not enough: a browser
 * resolves `//evil.example`, `/\evil.example` and `/<tab>/evil.example` alike
 * to http://evil.example/, and a sign-in page is exactly where an open redirect
 * is worth exploiting. So the value is resolved the way the browser will resolve
 * it, against a placeholder origin, and kept only if it is still on that origin.
 *
 * Its own module and export subpath so both the storefront and the back office
 * can import it into the browser without pulling in the package root.
 */
const PLACEHOLDER_ORIGIN = 'http://same-site.invalid';

export function safeRedirectPath(raw: string | null | undefined, fallback: string): string {
  if (!raw || !raw.startsWith('/')) return fallback;
  let url: URL;
  try {
    url = new URL(raw, PLACEHOLDER_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;
  return url.pathname + url.search + url.hash;
}
