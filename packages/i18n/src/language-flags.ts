/**
 * Each language's flag as SVG parts — `viewBox` plus the markup inside `<svg>`.
 * The storefront's `LanguageFlag.astro` and the back office's
 * `language-flag.svelte` both draw from this, so the two never disagree.
 *
 * Not the regional-indicator emoji the registry used to carry: Windows ships no
 * flag glyphs, so 🇬🇧 renders there as the two letters "GB" — beside a label
 * that already says EN. SVG draws the same on every platform.
 *
 * `Record<LanguageCode, …>`, so a new language fails `pnpm check` until it has a
 * flag. The Union Jack's counterchanged red diagonals are four polygons rather
 * than a clipPath, because a clipPath needs an id and a flag renders several
 * times per page.
 */
import type { LanguageCode } from '@mia/validators';

export interface LanguageFlag {
  viewBox: string;
  body: string;
}

export const LANGUAGE_FLAGS: Record<LanguageCode, LanguageFlag> = {
  it: {
    viewBox: '0 0 3 2',
    body: '<path fill="#009246" d="M0 0h1v2H0z"/><path fill="#fff" d="M1 0h1v2H1z"/><path fill="#ce2b37" d="M2 0h1v2H2z"/>',
  },
  en: {
    viewBox: '0 0 60 30',
    body:
      '<path fill="#012169" d="M0 0h60v30H0z"/>' +
      '<path stroke="#fff" stroke-width="6" d="M0 0l60 30M60 0L0 30"/>' +
      '<path fill="#c8102e" d="M0 0l30 15-.89 1.79L-.89 1.79zM60 30L30 15l.89-1.79 30 15zM60 0L30 15l-.89-1.79 30-15zM0 30l30-15 .89 1.79-30 15z"/>' +
      '<path stroke="#fff" stroke-width="10" d="M30 0v30M0 15h60"/>' +
      '<path stroke="#c8102e" stroke-width="6" d="M30 0v30M0 15h60"/>',
  },
  fr: {
    viewBox: '0 0 3 2',
    body: '<path fill="#0055a4" d="M0 0h1v2H0z"/><path fill="#fff" d="M1 0h1v2H1z"/><path fill="#ef4135" d="M2 0h1v2H2z"/>',
  },
  de: {
    viewBox: '0 0 5 3',
    body: '<path fill="#000" d="M0 0h5v1H0z"/><path fill="#d00" d="M0 1h5v1H0z"/><path fill="#ffce00" d="M0 2h5v1H0z"/>',
  },
};
