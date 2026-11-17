import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as v from 'valibot';
import { ManualOrderQuoteSchema, SendOrderLinkSchema } from '@mia/validators';

import { type LinkOrder, assertLinkable, linkNote } from './validation.ts';

const complete = {
  firstName: 'Anna',
  lastName: 'Rossi',
  phone: '+39 333 1234567',
  customerType: 'private' as const,
  codiceFiscale: 'RSSNNA80A41H501Z',
  partitaIva: null,
};
const rental: LinkOrder = {
  ...complete,
  source: 'manual',
  status: 'pending',
  hasRental: true,
  contractStatus: null,
};

async function refusal(fn: () => unknown): Promise<{ status: number; fields: object }> {
  try {
    fn();
  } catch (error) {
    const res = (error as { res: Response }).res;
    const body = (await res.json()) as { error: { fields: object } };
    return { status: res.status, fields: body.error.fields };
  }
  assert.fail('expected a refusal');
}

test('a rental accepts sign_pay and sign, and refuses pay until the contract is signed', async () => {
  assert.doesNotThrow(() => assertLinkable(rental, { steps: 'sign_pay', includeDetails: false }));
  assert.doesNotThrow(() => assertLinkable(rental, { steps: 'sign', includeDetails: false }));
  const pay = await refusal(() => assertLinkable(rental, { steps: 'pay', includeDetails: false }));
  assert.equal(pay.status, 422);
  assert.deepEqual(pay.fields, { steps: 'Contract signing required for payment.' });
  const signed = { ...rental, contractStatus: 'signed' };
  assert.doesNotThrow(() => assertLinkable(signed, { steps: 'pay', includeDetails: false }));
});

test('a sale has nothing to sign', async () => {
  const sale = { ...rental, hasRental: false };
  assert.doesNotThrow(() => assertLinkable(sale, { steps: 'pay', includeDetails: false }));
  for (const steps of ['sign', 'sign_pay'] as const) {
    assert.equal(
      (await refusal(() => assertLinkable(sale, { steps, includeDetails: false }))).status,
      422,
    );
  }
});

test('missing details need the details form, and every missing field is listed', async () => {
  const gaps = { ...rental, codiceFiscale: null, phone: null };
  const refused = await refusal(() =>
    assertLinkable(gaps, { steps: 'sign_pay', includeDetails: false }),
  );
  assert.deepEqual(Object.keys(refused.fields).sort(), ['codiceFiscale', 'phone']);
  assert.doesNotThrow(() => assertLinkable(gaps, { steps: 'sign_pay', includeDetails: true }));
});

test('only a pending manual order takes a link', async () => {
  const input = { steps: 'sign_pay', includeDetails: true } as const;
  assert.equal(
    (await refusal(() => assertLinkable({ ...rental, status: 'paid' }, input))).status,
    409,
  );
  assert.equal(
    (await refusal(() => assertLinkable({ ...rental, source: 'online' }, input))).status,
    409,
  );
});

test('the timeline note says how the link left and what it asks for', () => {
  assert.equal(
    linkNote({ steps: 'sign_pay', includeDetails: true, deliver: 'email' }),
    'Link sent by email (sign and pay, with the details form).',
  );
  assert.equal(
    linkNote({ steps: 'pay', includeDetails: false, deliver: 'copy' }),
    'Link copied (pay only).',
  );
});

test('the wire schemas carry no price and reject an unknown steps value', () => {
  assert.equal(
    v.safeParse(SendOrderLinkSchema, { steps: 'all', includeDetails: true, deliver: 'copy' })
      .success,
    false,
  );
  const priced = { items: [{ productSlug: 'letto', quantity: 1, unitPrice: '1.00' }] };
  assert.equal(v.safeParse(ManualOrderQuoteSchema, priced).success, false);
});
