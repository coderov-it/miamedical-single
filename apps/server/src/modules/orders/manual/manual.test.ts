import assert from 'node:assert/strict';
import { test } from 'node:test';

import { manualStage } from './stage.ts';
import { orderTotal } from '../totals.ts';
import { paymentNote } from './payment-note.ts';
import { assertDiscountEditable, priceDiscount } from './pricing.ts';
import { assertStartable, missingCustomerFields } from './readiness.ts';

const complete = {
  firstName: 'Anna',
  lastName: 'Rossi',
  phone: '+39 333 1234567',
  customerType: 'private' as const,
  codiceFiscale: 'RSSNNA80A41H501Z',
  partitaIva: null,
};

/** The status and fields of an HTTPException's JSON body, read synchronously from its response. */
async function refusal(fn: () => unknown): Promise<{ status: number; fields?: object }> {
  try {
    fn();
  } catch (error) {
    const res = (error as { res: Response }).res;
    const body = (await res.json()) as { error: { fields?: object } };
    return { status: res.status, ...(body.error.fields ? { fields: body.error.fields } : {}) };
  }
  assert.fail('expected a refusal');
}

test('the total subtracts the discount, and shipping still counts', () => {
  assert.equal(orderTotal('180.00', '0.00', '20.00'), '160.00');
  assert.equal(orderTotal('100.00', '15.00', '0.00'), '115.00');
  assert.equal(orderTotal('100.00', '15.00', '15.00'), '100.00');
});

test('a discount needs a reason and must leave something to pay', async () => {
  const order = { subtotal: '180.00', shippingTotal: '0.00' };
  assert.deepEqual(priceDiscount(order, { amount: '20.00', reason: ' cliente storico ' }), {
    discountTotal: '20.00',
    discountReason: 'cliente storico',
    total: '160.00',
  });
  assert.equal((await refusal(() => priceDiscount(order, { amount: '20.00' }))).status, 422);
  assert.equal(
    (await refusal(() => priceDiscount(order, { amount: '180.00', reason: 'x' }))).status,
    422,
  );
  assert.equal(
    (await refusal(() => priceDiscount(order, { amount: '-1.00', reason: 'x' }))).status,
    422,
  );
});

test('a zero discount clears the discount and its reason', () => {
  const priced = priceDiscount({ subtotal: '180.00', shippingTotal: '0.00' }, { amount: '0.00' });
  assert.deepEqual(priced, { discountTotal: '0.00', discountReason: null, total: '180.00' });
});

test('the discount locks once the contract is signed or a payment is open', async () => {
  const open = {
    source: 'manual',
    status: 'pending',
    contractStatus: null,
    hasPendingAttempt: false,
  } as const;
  assert.doesNotThrow(() => assertDiscountEditable(open));
  assert.doesNotThrow(() => assertDiscountEditable({ ...open, contractStatus: 'generated' }));
  assert.equal(
    (await refusal(() => assertDiscountEditable({ ...open, contractStatus: 'signed' }))).status,
    409,
  );
  assert.equal(
    (await refusal(() => assertDiscountEditable({ ...open, hasPendingAttempt: true }))).status,
    409,
  );
  assert.equal(
    (await refusal(() => assertDiscountEditable({ ...open, status: 'paid' }))).status,
    409,
  );
  assert.equal(
    (await refusal(() => assertDiscountEditable({ ...open, source: 'online' }))).status,
    409,
  );
});

test('readiness lists every missing field, per customer type', () => {
  const empty = {
    ...complete,
    firstName: null,
    lastName: null,
    phone: null,
    customerType: null,
    codiceFiscale: null,
  };
  assert.deepEqual(missingCustomerFields(empty), [
    'firstName',
    'lastName',
    'phone',
    'customerType',
  ]);
  assert.deepEqual(missingCustomerFields(complete), []);
  assert.deepEqual(missingCustomerFields({ ...complete, codiceFiscale: null }), ['codiceFiscale']);
  assert.deepEqual(
    missingCustomerFields({ ...complete, customerType: 'tourist', codiceFiscale: null }),
    [],
  );
  assert.deepEqual(
    missingCustomerFields({ ...complete, customerType: 'company', partitaIva: ' ' }),
    ['partitaIva'],
  );
});

test('an incomplete order is refused with the missing fields named', async () => {
  const result = await refusal(() => assertStartable({ ...complete, codiceFiscale: null }));
  assert.equal(result.status, 409);
  assert.deepEqual(Object.keys(result.fields ?? {}), ['codiceFiscale']);
  assert.doesNotThrow(() => assertStartable(complete));
});

test('the recorded payment note names method and reference', () => {
  assert.equal(
    paymentNote({ method: 'bank_transfer', reference: 'CRO 1234' }),
    'Payment recorded: bank transfer, ref. CRO 1234.',
  );
  assert.equal(paymentNote({ method: 'cash' }), 'Payment recorded: cash.');
});

test('the manual stage follows the contract and the payment', () => {
  const base = {
    source: 'manual',
    status: 'pending',
    paymentStatus: 'unpaid',
    hasRental: true,
    contractStatus: null,
  } as const;
  assert.equal(manualStage(base), 'awaiting_signature');
  assert.equal(manualStage({ ...base, contractStatus: 'generated' }), 'awaiting_signature');
  assert.equal(manualStage({ ...base, contractStatus: 'signed' }), 'awaiting_payment');
  assert.equal(manualStage({ ...base, hasRental: false }), 'awaiting_payment');
  assert.equal(manualStage({ ...base, status: 'paid', paymentStatus: 'paid' }), null);
  assert.equal(manualStage({ ...base, source: 'online' }), null);
});
