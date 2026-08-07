/**
 * Per-section unsaved-changes tracking for the product editor, where each tab
 * saves independently.
 *
 * Two separate jobs, deliberately not merged: the tab strip shows a dot on
 * every section with unsaved work, and `UnsavedChangesGuard` blocks navigation
 * *away from the page*. Switching tabs is not blocked — the panels stay
 * mounted, so nothing is lost, and a confirm dialog between tabs would be a
 * prompt about a danger that no longer exists.
 */

export class DirtyState {
  #sections = $state<Record<string, boolean>>({});

  /** Usually `dirty.set(tab, !equal(draft, saved))` from a `$derived`. */
  set(section: string, value: boolean): void {
    if (this.#sections[section] === value) return;
    this.#sections[section] = value;
  }

  mark(section: string): void {
    this.set(section, true);
  }

  clear(section: string): void {
    this.set(section, false);
  }

  /** After a save-everything, or when discarding on the way out. */
  clearAll(): void {
    this.#sections = {};
  }

  has(section: string): boolean {
    return this.#sections[section] === true;
  }

  get any(): boolean {
    return Object.values(this.#sections).some(Boolean);
  }

  /** For naming what would be lost, rather than a bare "you have changes". */
  get sections(): string[] {
    return Object.keys(this.#sections).filter((key) => this.#sections[key]);
  }
}
