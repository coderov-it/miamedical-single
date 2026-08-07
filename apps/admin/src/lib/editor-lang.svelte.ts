/**
 * The persistent IT/EN switch in the editor header. Every `Translated*` field
 * reads it, so an editor can sweep a whole product in one language instead of
 * toggling field by field. Italian is the default and the only mandatory one.
 */

export type EditorLanguage = 'it' | 'en';

class EditorLang {
  #current = $state<EditorLanguage>('it');

  get current(): EditorLanguage {
    return this.#current;
  }

  set(lang: EditorLanguage) {
    this.#current = lang;
  }

  toggle() {
    this.#current = this.#current === 'it' ? 'en' : 'it';
  }
}

export const editorLang = new EditorLang();
