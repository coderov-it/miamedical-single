/**
 * The three names a screen has, in one place.
 *
 * They are three because each is read by a different consumer and one of them
 * carries the brand:
 *
 *   documentTitle   the tab, and the label of the History entry a hop pushes.
 *                   `AccountApp` sets it after a client-side navigation, which
 *                   moves no document, so the `*.metaTitle` keys ride in the
 *                   copy blob for exactly this.
 *   pageTitle       the `h1` the shell paints. Shorter by design — the trail
 *                   above it and the customer's own name in the header already
 *                   say where they are.
 *   crumbTrail      the way back up. Empty on the root screen: a trail of one
 *                   is not a trail.
 *
 * All three read the same `AccountScreen`, so a screen cannot appear in the
 * navigation under one name and in the `<title>` under another.
 */
import type { AccountCopy } from '~/lib/account-page';
import { say } from '~/lib/account-context';
import type { AccountScreen } from '~/lib/account-routes';
import { fill } from '~/scripts/account/copy';

export interface Crumb {
  label: string;
  /** Absent on the last crumb — you are already there. */
  to?: AccountScreen;
}

export function documentTitle(copy: AccountCopy, screen: AccountScreen): string {
  if (screen.name === 'orders') return say(copy, 'account.orders.metaTitle');
  if (screen.name === 'orderDetail') {
    return fill(say(copy, 'account.order.metaTitle'), { number: screen.number });
  }
  return say(copy, 'account.metaTitle');
}

export function pageTitle(copy: AccountCopy, screen: AccountScreen): string {
  if (screen.name === 'orders') return say(copy, 'account.myOrders');
  if (screen.name === 'orderDetail') {
    return fill(say(copy, 'account.order.title'), { number: screen.number });
  }
  return say(copy, 'account.title');
}

export function crumbTrail(copy: AccountCopy, screen: AccountScreen): Crumb[] {
  if (screen.name === 'account') return [];
  if (screen.name === 'orders') {
    return [
      { label: say(copy, 'account.title'), to: { name: 'account' } },
      { label: say(copy, 'account.myOrders') },
    ];
  }
  return [
    { label: say(copy, 'account.myOrders'), to: { name: 'orders' } },
    { label: screen.number },
  ];
}
