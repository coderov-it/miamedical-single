/**
 * The content language a *form* is editing — which side of every translated
 * field on it is showing. Deliberately scoped, not global: each editor
 * (product page, category/preset/document sheet) provides its own instance via
 * context, so the switcher at the top of a form governs exactly that form and
 * nothing else. The interface language is separate global state
 * (ui-lang.svelte.ts).
 *
 * Not persisted: every editor opens in the source language, the mandatory one.
 */
import { getContext, setContext } from 'svelte';

import { isLanguageCode, type LanguageCode, SOURCE_LANGUAGE } from '~/lib/i18n';

/**
 * Any registered language. Was `'it' | 'en'`; keeping it an alias rather than
 * deleting it means the editors that name this type keep reading as "the
 * language this form is on" rather than "a language code from anywhere".
 */
export type ContentLanguage = LanguageCode;

export class ContentLang {
  current = $state<ContentLanguage>(SOURCE_LANGUAGE);

  set(lang: ContentLanguage) {
    this.current = lang;
  }

  /** True while the form is editing the language every other one falls back to. */
  get isSource(): boolean {
    return this.current === SOURCE_LANGUAGE;
  }

  reset() {
    this.current = SOURCE_LANGUAGE;
  }
}

const KEY = Symbol('content-lang');

/** Called once, during init, by the editor that owns the switcher. */
export function provideContentLang(): ContentLang {
  return setContext(KEY, new ContentLang());
}

// A field rendered outside any provider stays on the source language — editing
// the mandatory language beats crashing or guessing.
const fallback = new ContentLang();

export function useContentLang(): ContentLang {
  return getContext<ContentLang>(KEY) ?? fallback;
}

export { isLanguageCode, SOURCE_LANGUAGE };
