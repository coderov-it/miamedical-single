/**
 * The interface language — what the admin itself presents in. Global, chosen
 * from the topbar dropdown, persisted. It decides which translation is used
 * where the UI *displays* localized content (list names, row titles), and is
 * the hook UI-string translation will hang off once the chrome is translated.
 *
 * Deliberately NOT the editing language: which side of a bilingual field a
 * form edits is scoped to that form (see content-lang.svelte.ts), so a global
 * control can never silently re-target inputs on a screen you are not on.
 */

export type UiLanguage = 'it' | 'en';

export const UI_LANGUAGES: ReadonlyArray<{ code: UiLanguage; label: string }> = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
];

const STORAGE_KEY = 'mia:ui-lang';

class UiLang {
  #current = $state<UiLanguage>('it');

  constructor() {
    if (typeof localStorage === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'it' || stored === 'en') this.#current = stored;
    this.#apply();
  }

  get current(): UiLanguage {
    return this.#current;
  }

  set(lang: UiLanguage) {
    this.#current = lang;
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
    this.#apply();
  }

  /** Assistive tech and the browser translate prompt both read the tag. */
  #apply() {
    if (typeof document !== 'undefined') document.documentElement.lang = this.#current;
  }
}

export const uiLang = new UiLang();
