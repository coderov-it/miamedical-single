import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as v from 'valibot';
import { OrderLinkDetailsSchema } from '@mia/validators';

import {
  allowedSteps,
  assertCanPay,
  assertCanSign,
  assertDetailsComplete,
  assertSameTotal,
  linkRefusal,
} from './access.ts';
import { detailsPatch } from './details.ts';
import { orderHasRental } from './summary.ts';

const NOW = new Date('2026-12-01T10:00:00Z');
const FUTURE = new Date('2026-12-20T10:00:00Z');
const live = { revokedAt: null, expiresAt: FUTURE };
const pending = { status: 'pending', paymentStatus: 'unpaid' };

async function refusal(
  fn: () => unknown,
): Promise<{ status: number; body: Record<string, unknown> }> {
  try {
    fn();
  } catch (error) {
    const res = (error as { res: Response }).res;
    const json = (await res.json()) as { error: Record<string, unknown> };
    return { status: res.status, body: json.error };
  }
  assert.fail('expected a refusal');
}

test('a live token on a pending order is open', () => {
  assert.equal(linkRefusal(live, pending, NOW), null);
});

test('revoked, expired, paid and cancelled each give their own reason', () => {
  assert.equal(linkRefusal({ ...live, revokedAt: NOW }, pending, NOW), 'revoked');
  assert.equal(linkRefusal({ revokedAt: null, expiresAt: NOW }, pending, NOW), 'expired');
  assert.equal(linkRefusal(live, { status: 'paid', paymentStatus: 'paid' }, NOW), 'paid');
  assert.equal(linkRefusal(live, { status: 'cancelled', paymentStatus: 'unpaid' }, NOW), 'closed');
});

test('a replaced link says revoked even when it has also expired', () => {
  assert.equal(linkRefusal({ revokedAt: NOW, expiresAt: NOW }, pending, NOW), 'revoked');
});

test('steps follow the token: pay-only shows no signing, sign-only no payment', () => {
  const base = { includeDetails: true, hasRental: true };
  assert.deepEqual(allowedSteps({ ...base, steps: 'sign_pay' }), {
    details: true,
    sign: true,
    pay: true,
  });
  assert.deepEqual(allowedSteps({ ...base, steps: 'pay' }), {
    details: true,
    sign: false,
    pay: true,
  });
  assert.deepEqual(allowedSteps({ ...base, steps: 'sign' }), {
    details: true,
    sign: true,
    pay: false,
  });
  assert.equal(
    allowedSteps({ steps: 'sign_pay', includeDetails: false, hasRental: false }).sign,
    false,
  );
});

test('payment: refused without the pay step, and on a rental until it is signed', async () => {
  const both = allowedSteps({ steps: 'sign_pay', includeDetails: false, hasRental: true });
  const signOnly = allowedSteps({ steps: 'sign', includeDetails: false, hasRental: true });
  assert.equal(
    (
      await refusal(() =>
        assertCanPay({ allowed: signOnly, hasRental: true, contractSigned: true }),
      )
    ).status,
    403,
  );
  const unsigned = await refusal(() =>
    assertCanPay({ allowed: both, hasRental: true, contractSigned: false }),
  );
  assert.equal(unsigned.status, 409);
  assert.equal(unsigned.body.message, 'Sign the contract first.');
  assert.doesNotThrow(() => assertCanPay({ allowed: both, hasRental: true, contractSigned: true }));
  assert.doesNotThrow(() =>
    assertCanPay({ allowed: both, hasRental: false, contractSigned: false }),
  );
});

test('signing: refused when the link has no sign step or the contract is already signed', async () => {
  const pay = allowedSteps({ steps: 'pay', includeDetails: false, hasRental: true });
  const both = allowedSteps({ steps: 'sign_pay', includeDetails: false, hasRental: true });
  assert.equal(
    (await refusal(() => assertCanSign({ allowed: pay, contractSigned: false }))).status,
    403,
  );
  assert.equal(
    (await refusal(() => assertCanSign({ allowed: both, contractSigned: true }))).status,
    409,
  );
  assert.doesNotThrow(() => assertCanSign({ allowed: both, contractSigned: false }));
});

test('signing needs complete details and lists every missing field', async () => {
  const empty = {
    firstName: null,
    lastName: null,
    phone: null,
    customerType: null,
    codiceFiscale: null,
    partitaIva: null,
  };
  const result = await refusal(() => assertDetailsComplete(empty));
  assert.equal(result.status, 409);
  assert.deepEqual(Object.keys(result.body.fields as object), [
    'firstName',
    'lastName',
    'phone',
    'customerType',
  ]);
});

test('a total that moved since the preview is refused, an equal one passes', async () => {
  assert.doesNotThrow(() => assertSameTotal('160.00', '160.0'));
  assert.equal((await refusal(() => assertSameTotal('160.00', '150.00'))).status, 409);
});

test('details use the checkout rules: company needs a partita IVA, tourist needs no codice fiscale', () => {
  const base = { firstName: 'Anna', lastName: 'Rossi', phone: '+39 333 1234567' };
  const company = v.safeParse(OrderLinkDetailsSchema, {
    ...base,
    customerType: 'company',
    codiceFiscale: '01234567890',
  });
  assert.equal(company.success, false);
  assert.equal(
    v.safeParse(OrderLinkDetailsSchema, { ...base, customerType: 'tourist' }).success,
    true,
  );
  assert.equal(
    v.safeParse(OrderLinkDetailsSchema, { ...base, customerType: 'private' }).success,
    false,
  );
});

test('a stored fiscal field the customer type does not use is cleared', () => {
  const tourist = detailsPatch({
    firstName: 'A',
    lastName: 'B',
    phone: '+39 333 1234567',
    customerType: 'tourist',
    codiceFiscale: 'X',
    partitaIva: 'Y',
  });
  assert.equal(tourist.codiceFiscale, null);
  assert.equal(tourist.partitaIva, null);
  const priv = detailsPatch({
    firstName: 'A',
    lastName: 'B',
    phone: '+39 333 1234567',
    customerType: 'private',
    codiceFiscale: 'RSS',
    partitaIva: 'Y',
  });
  assert.equal(priv.partitaIva, null);
  assert.equal(priv.codiceFiscale, 'RSS');
});

test('a rented line makes the order a rental', () => {
  assert.equal(orderHasRental([{ configuration: { pricingMode: 'rental' } }]), true);
  assert.equal(
    orderHasRental([{ configuration: { pricingMode: 'fixed' } }, { configuration: null }]),
    false,
  );
});
