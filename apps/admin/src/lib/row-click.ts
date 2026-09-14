/**
 * Click handler for a table row that opens something, when the row also holds
 * real links and buttons.
 *
 * The tempting fix — `event.stopPropagation()` on the link inside the row — is
 * a trap: SvelteKit's client router listens for clicks on `<html>`, so an event
 * stopped on the way up never reaches it and the browser falls back to a native
 * navigation, reloading the whole SPA. Guard from the row side instead: a click
 * that landed on something interactive belongs to that control, not to the row.
 */

const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [role="link"]';

export function rowClick(activate: () => void) {
  return (event: MouseEvent) => {
    const target = event.target;
    if (target instanceof Element && target.closest(INTERACTIVE)) return;
    activate();
  };
}
