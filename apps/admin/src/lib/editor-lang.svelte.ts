/**
 * The persistent IT/EN switch in the admin topbar. Every `Translated*` field
 * reads it, so an editor can sweep a whole product in one language instead of
 * toggling field by field. Italian is the default and the only mandatory one.
 *
 * Persisted to localStorage: an editor working through the English pass should
 * not be dropped back into Italian by a page reload.
 */

export type EditorLanguage = 'it' | 'en';

const STORAGE_KEY = 'mia:editor-lang';

class EditorLang {
  #current = $state<EditorLanguage>('it');

  constructor() {
    if (typeof localStorage === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'it' || stored === 'en') this.#current = stored;
  }

  get current(): EditorLanguage {
    return this.#current;
  }

  set(lang: EditorLanguage) {
    this.#current = lang;
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
  }

  toggle() {
    this.set(this.#current === 'it' ? 'en' : 'it');
  }
}

export const editorLang = new EditorLang();
