/**
 * The island's shared services, set once at the root.
 *
 * `setContext` rather than prop drilling (a forty-key copy blob threaded
 * through four levels is noise) and rather than a module-level singleton,
 * which in a server-rendered island is one visitor's state visible to the
 * next. Context is scoped to a component tree, so it is safe under SSR.
 * Same arrangement as `apps/admin/src/lib/content-lang.svelte.ts`.
 */
import { getContext, setContext } from 'svelte';

import type { AccountCopy } from './account-page.ts';
import type { AccountRouter } from './account-router.svelte.ts';
import type { AccountSession } from './account-session.svelte.ts';
import type { AccountStore } from './account-state.svelte.ts';

const KEY = Symbol.for('mia.account');

export interface AccountContext {
  /** Server-resolved copy and routes for THIS locale. See lib/account-page.ts. */
  copy: AccountCopy;
  router: AccountRouter;
  session: AccountSession;
  orders: AccountStore;
}

export function setAccountContext(context: AccountContext): AccountContext {
  return setContext(KEY, context);
}

export function accountContext(): AccountContext {
  const context = getContext<AccountContext | undefined>(KEY);
  if (!context) throw new Error('Used outside <AccountApp>');
  return context;
}

/**
 * One message, by full key.
 *
 * Returns `''` for a key the page did not ship rather than the key itself: a
 * blank is a missing label, which reads as a layout bug, while
 * `account.orders.confirm` rendered on a button reads as a broken site. Both
 * are wrong; only one looks wrong to the person who can fix it. The real guard
 * is `ACCOUNT_ISLAND_KEYS`, which is what the shims ship.
 */
export function say(copy: AccountCopy, key: string): string {
  return copy.text[key] ?? '';
}
