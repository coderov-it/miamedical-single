/// <reference types="svelte" />
/**
 * Which account screen is showing, and the History entry that names it.
 *
 * The stateful half of the router; the parsing lives in `account-routes.ts`,
 * which is pure and tested. There is no framework router here on purpose —
 * this is an Astro island, and Astro is already the app framework. Three
 * screens need a `$state`, a `pushState` and a `popstate` listener.
 */
import { tick } from 'svelte';

import {
  accountHref,
  type AccountRoutes,
  type AccountScreen,
  parseAccountPath,
} from './account-routes.ts';

/** What `history.state` carries so Back can restore the scroll offset. */
interface ScrollState {
  accountScrollY?: number;
}

export class AccountRouter {
  #screen: AccountScreen = $state.raw({ name: 'account' });
  readonly #routes: AccountRoutes;

  constructor(routes: AccountRoutes, initial: AccountScreen) {
    this.#routes = routes;
    this.#screen = initial;
  }

  get screen(): AccountScreen {
    return this.#screen;
  }

  href(screen: AccountScreen): string {
    return accountHref(this.#routes, screen);
  }

  /** Navigate, pushing a History entry. */
  go(screen: AccountScreen): void {
    const href = this.href(screen);
    if (href !== window.location.pathname) {
      this.#rememberScroll();
      history.pushState(null, '', href);
    }
    this.#screen = screen;
    /* `behavior: 'instant'` overrides the global `scroll-behavior: smooth` in
       styles/app.css. A screen change is a navigation: the new screen should
       be at the top when it appears, not glide there from wherever the last
       one was scrolled to. */
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /**
   * Take over a click on a real `<a>`.
   *
   * Every internal link stays an anchor with a working `href` — middle-click,
   * ⌘-click and "copy link address" are not ours to break — so this only
   * claims the plain left click the browser would have turned into a document
   * load.
   */
  intercept(event: MouseEvent, screen: AccountScreen): void {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    this.go(screen);
  }

  /** Wire up History. Call from an `$effect`; the return value is the teardown. */
  mount(): () => void {
    /* The browser would otherwise restore a scroll offset against a screen
       that has not fetched yet: the document is short at that moment, the
       offset is clamped to 0, and someone who opened the thirtieth order lands
       at the top of the list on Back. */
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';

    const onPop = () => {
      const screen = parseAccountPath(this.#routes, window.location.pathname);
      if (!screen) {
        /* Not one of ours — something outside the island pushed this entry.
           Reloading is the honest move; painting a screen the URL does not
           describe is not. */
        window.location.reload();
        return;
      }
      this.#screen = screen;

      /* AFTER the DOM catches up. Restoring in this tick scrolls the screen we
         are leaving — a short order detail — so the offset is clamped to its
         height and the customer lands at the top of the list anyway, which is
         the very thing `scrollRestoration = 'manual'` was set to prevent. */
      const stored = (history.state ?? {}) as ScrollState;
      void tick().then(() =>
        window.scrollTo({ top: stored.accountScrollY ?? 0, behavior: 'instant' }),
      );
    };

    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      history.scrollRestoration = previous;
    };
  }

  /** Stamp the current offset onto the entry we are about to leave. */
  #rememberScroll(): void {
    const state = { ...((history.state ?? {}) as ScrollState), accountScrollY: window.scrollY };
    history.replaceState(state, '');
  }
}
