import assert from 'node:assert/strict';
import { test } from 'node:test';

import { draftContract, contractTotals } from './draft.ts';
import { TEMPLATE_MAP } from './render.ts';
import type { ContractTerms } from './draft.ts';

const items = [
  {
    productTitle: 'Letto',
    quantity: 1,
    unitPrice: '180.00',
    total: '180.00',
    startDate: '2026-12-01',
    endDate: '2026-12-07',
    duration: 7,
    durationUnit: 'day' as const,
  },
];

test('the contract total takes the order discount off, so the signed amount is the charged one', () => {
  assert.deepEqual(contractTotals(items, '0.00', '20.00'), { subtotal: '180.00', total: '160.00' });
  assert.deepEqual(contractTotals(items, '15.00'), { subtotal: '180.00', total: '195.00' });
});

test('a discount larger than the rented rows leaves 0.00, never a negative', () => {
  assert.equal(contractTotals(items, '0.00', '500.00').total, '0.00');
});

const terms: ContractTerms = {
  orderNumber: 'MIA-2026-001050',
  customerType: 'private',
  customerName: 'Anna Rossi',
  email: 'anna@example.invalid',
  phone: '+39 333 1234567',
  address: '',
  codiceFiscale: 'RSSNNA80A41H501Z',
  partitaIva: null,
  items,
  subtotal: '180.00',
  shippingTotal: '0.00',
  total: '160.00',
  currency: 'EUR',
  hasDepositProduct: false,
};

/* `renderDraft` itself lives in checkout.ts, which reads the server env; these are its two lines. */
const renderDraft = (t: ContractTerms) => {
  const { variant, data } = draftContract(t, null);
  return TEMPLATE_MAP[variant.variant](data);
};

test('the rendered contract shows a discount row only when the order has one', () => {
  assert.match(renderDraft({ ...terms, discountTotal: '20.00' }), /Sconto[\s\S]*20\.00/);
  assert.doesNotMatch(renderDraft(terms), /Sconto/);
  assert.equal(draftContract(terms, null).data.discountTotal, undefined);
  assert.equal(
    draftContract({ ...terms, discountTotal: '20.00' }, null).data.discountTotal,
    '20.00',
  );
});
