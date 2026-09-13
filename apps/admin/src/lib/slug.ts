/**
 * URL slug from human text. Shared because two places need it and they must
 * agree: the create form derives the Italian slug from the title as it is typed,
 * and a translation run derives a target language's slug from its translated
 * title — a product whose `/fr/` slug was built by different rules than its
 * `/it/` one is a second, subtly different URL scheme.
 *
 * Deliberately ASCII-only: accents are folded to their base letter rather than
 * kept, so a slug never depends on percent-encoding to survive a copy-paste.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 120);
}
