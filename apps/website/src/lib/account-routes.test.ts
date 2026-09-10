/**
 * The router's path table, in all four languages.
 *
 * This exists because every failure here is silent and locale-shaped. A path
 * that parses to `null` does not throw — it makes the back button reload the
 * document — and it would do so only in the language nobody develops in. The
 * Italian storefront would look perfect throughout.
 *
 * The fixtures are written out rather than imported from `lib/routes.ts`, for
 * two reasons. `node --test` cannot resolve that module (it reaches
 * `lib/i18n.ts`, which imports four JSON files through the `~/` alias), and a
 * test that derived its expectations from the registry would follow a bad
 * rename instead of catching it. If a slug in `routes.ts` changes, this file
 * is meant to fail.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { accountHref, type AccountRoutes, parseAccountPath } from './account-routes.ts';

/** Only the four fields the router reads. Mirrors `routePaths` per locale. */
function routesFor(account: string, orders: string): AccountRoutes {
  return {
    home: '/',
    login: '/accedi/',
    account,
    accountOrders: orders,
    catalog: '/catalogo/',
    orderDetail: `${orders}{number}/`,
  };
}

const LOCALES = {
  it: routesFor('/area-clienti/', '/area-clienti/ordini/'),
  en: routesFor('/en/customer-area/', '/en/customer-area/orders/'),
  fr: routesFor('/fr/espace-client/', '/fr/espace-client/commandes/'),
  de: routesFor('/de/kundenbereich/', '/de/kundenbereich/bestellungen/'),
} satisfies Record<string, AccountRoutes>;

const NUMBER = 'MIA-2026-001000';

describe('parseAccountPath', () => {
  for (const [code, routes] of Object.entries(LOCALES)) {
    describe(code, () => {
      it('reads the three screens', () => {
        assert.deepEqual(parseAccountPath(routes, routes.account), { name: 'account' });
        assert.deepEqual(parseAccountPath(routes, routes.accountOrders), { name: 'orders' });
        assert.deepEqual(parseAccountPath(routes, `${routes.accountOrders}${NUMBER}/`), {
          name: 'orderDetail',
          number: NUMBER,
        });
      });

      it('accepts a path with no trailing slash', () => {
        assert.deepEqual(parseAccountPath(routes, routes.accountOrders.replace(/\/$/, '')), {
          name: 'orders',
        });
      });

      it('round-trips every screen through accountHref', () => {
        for (const screen of [
          { name: 'account' },
          { name: 'orders' },
          { name: 'orderDetail', number: NUMBER },
        ] as const) {
          assert.deepEqual(parseAccountPath(routes, accountHref(routes, screen)), screen);
        }
      });

      it('does not read the orders list as an order', () => {
        // `account` is a prefix of `accountOrders`, which is the detail prefix.
        assert.deepEqual(parseAccountPath(routes, routes.accountOrders), { name: 'orders' });
      });

      it('rejects what is not ours', () => {
        for (const path of ['/', '/catalogo/', `${routes.accountOrders}a/b/`]) {
          assert.equal(parseAccountPath(routes, path), null, path);
        }
      });

      it('survives a malformed escape rather than throwing', () => {
        assert.equal(parseAccountPath(routes, `${routes.accountOrders}%/`), null);
      });
    });
  }

  it('does not match another language of the same site', () => {
    // The blob only ever carries one locale's table, so this can only happen
    // if a customer hand-edits the URL. It must not resolve.
    assert.equal(parseAccountPath(LOCALES.it, LOCALES.de.accountOrders), null);
    assert.equal(parseAccountPath(LOCALES.de, LOCALES.fr.account), null);
  });
});

describe('accountHref', () => {
  it('encodes the number, matching accountOrderPath on the server', () => {
    const href = accountHref(LOCALES.it, { name: 'orderDetail', number: 'a/b' });
    assert.equal(href, '/area-clienti/ordini/a%2Fb/');
    assert.deepEqual(parseAccountPath(LOCALES.it, href), {
      name: 'orderDetail',
      number: 'a/b',
    });
  });

  it('falls back to the list when the template has lost its slot', () => {
    // The `%7Bnumber%7D` bug, as a regression test: an unfillable template must
    // never produce a link to a literal order named `{number}`.
    const broken: AccountRoutes = {
      ...LOCALES.it,
      orderDetail: '/area-clienti/ordini/%7Bnumber%7D/',
    };
    assert.equal(
      accountHref(broken, { name: 'orderDetail', number: NUMBER }),
      '/area-clienti/ordini/',
    );
  });
});
