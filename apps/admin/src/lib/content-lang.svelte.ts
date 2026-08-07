/**
 * The content language a *form* is editing — which side of every bilingual
 * field on it is showing. Deliberately scoped, not global: each editor
 * (product page, category/preset/document sheet) provides its own instance
 * via context, so the tab switcher at the top of a form governs exactly that
 * form and nothing else. The interface language is separate global state
 * (ui-lang.svelte.ts).
 *
 * Not persisted: every editor opens in Italian, the mandatory language.
 */
import { getContext, setContext } from 'svelte';

export type ContentLanguage = 'it' | 'en';

export class ContentLang {
  current = $state<ContentLanguage>('it');

  set(lang: ContentLanguage) {
    this.current = lang;
  }

  reset() {
    this.current = 'it';
  }
}

const KEY = Symbol('content-lang');

/** Called once, during init, by the editor that owns the switcher. */
export function provideContentLang(): ContentLang {
  return setContext(KEY, new ContentLang());
}

// A field rendered outside any provider stays on Italian — editing the
// mandatory language beats crashing or guessing.
const fallback = new ContentLang();

export function useContentLang(): ContentLang {
  return getContext<ContentLang>(KEY) ?? fallback;
}
