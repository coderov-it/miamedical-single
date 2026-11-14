/**
 * Old private URLs → their new English path, in the language they were written in.
 *
 * Every case here is a link in an email somebody already received, so a miss is
 * a customer clicking "Attiva il tuo account" and landing on a 404. The
 * expectations are written out rather than derived from `routes.ts`: a test that
 * followed the registry would follow a bad rename instead of catching it.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { legacyRedirect } from './legacy-routes.ts';

describe('legacyRedirect · old private paths', () => {
  const cases: [string, string, string][] = [
    ['/carrello/', '', '/cart/'],
    ['/fr/panier/', '?x=1', '/fr/cart/?x=1'],
    ['/attiva-account/', '?token=abc', '/activate-account/?token=abc'],
    ['/de/kasse/', '', '/de/checkout/'],
    ['/accedi/', '', '/sign-in/'],
    ['/area-clienti/', '', '/account/'],
    ['/en/customer-area/notifications/', '', '/en/account/notifications/'],
    ['/fr/signer-le-contrat/', '?token=t', '/fr/sign-contract/?token=t'],
    ['/de/zahlung/', '?token=x', '/de/payment/?token=x'],
    ['/pagamento/', '?token=x', '/payment/?token=x'],
  ];

  for (const [from, search, to] of cases) {
    it(`${from}${search} → ${to}`, () => {
      assert.equal(legacyRedirect(from, search), to);
    });
  }

  it('reads a path with no trailing slash the same way', () => {
    assert.equal(legacyRedirect('/carrello', ''), '/cart/');
  });
});

describe('legacyRedirect · one order by number', () => {
  it('keeps the number, in every language', () => {
    const n = 'MIA-2026-001042';
    assert.equal(legacyRedirect(`/area-clienti/ordini/${n}/`, ''), `/account/orders/${n}/`);
    assert.equal(
      legacyRedirect(`/en/customer-area/orders/${n}/`, '?renew=1'),
      `/en/account/orders/${n}/?renew=1`,
    );
    assert.equal(
      legacyRedirect(`/fr/espace-client/commandes/${n}/`, ''),
      `/fr/account/orders/${n}/`,
    );
    assert.equal(
      legacyRedirect(`/de/kundenbereich/bestellungen/${n}/`, ''),
      `/de/account/orders/${n}/`,
    );
  });

  it('does not take a deeper path for an order number', () => {
    assert.equal(legacyRedirect('/area-clienti/ordini/MIA-1/extra/', ''), null);
  });
});

describe('legacyRedirect · paths that did not change', () => {
  it('returns no redirect for them, so they can never loop', () => {
    for (const path of [
      '/checkout/',
      '/en/checkout/',
      '/en/sign-in/',
      '/en/cart/',
      '/en/activate-account/',
      '/delete-profile/',
      '/fr/delete-profile/',
      '/',
      '/catalogo/',
      '/cart/',
      '/de/account/orders/MIA-1/',
    ]) {
      assert.equal(legacyRedirect(path, ''), null, path);
    }
  });
});
