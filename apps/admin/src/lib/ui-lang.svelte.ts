/**
 * The interface language — what the admin itself presents in. Global, chosen
 * from the topbar, persisted. It decides which translation is used where the UI
 * *displays* localized content (list names, row titles), and is the hook UI
 * string translation will hang off once the chrome is translated.
 *
 * Deliberately NOT the editing language: which side of a translated field a
 * form edits is scoped to that form (see content-lang.svelte.ts), so a global
 * control can never silently re-target inputs on a screen you are not on.
 */
import { isLanguageCode, LANGUAGES, type LanguageCode, SOURCE_LANGUAGE } from '~/lib/i18n';

export type UiLanguage = LanguageCode;

/** The topbar's options — the registry itself, so a new language appears with no edit here. */
export const UI_LANGUAGES = LANGUAGES;

const STORAGE_KEY = 'mia:ui-lang';

class UiLang {
  #current = $state<UiLanguage>(SOURCE_LANGUAGE);

  constructor() {
    if (typeof localStorage === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    // A code stored before a language was retired must not resurrect it, so the
    // registry — not the stored string — decides what is valid.
    if (isLanguageCode(stored)) this.#current = stored;
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
