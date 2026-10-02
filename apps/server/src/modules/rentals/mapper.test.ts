import assert from 'node:assert/strict';
import { test } from 'node:test';

import { computeRentalStatus } from './mapper.ts';
import type { RentalRow } from './types.ts';

function row(orderStatus: string, rentalEndDate: string): RentalRow {
  return { orderStatus, rentalEndDate } as RentalRow;
}

test('a refunded rental is completed, like a fulfilled or cancelled one', () => {
  assert.equal(computeRentalStatus(row('refunded', '2026-10-15'), '2026-10-02'), 'completed');
  assert.equal(computeRentalStatus(row('fulfilled', '2026-10-15'), '2026-10-02'), 'completed');
});

test('overdue is decided against the Rome date passed in', () => {
  assert.equal(computeRentalStatus(row('paid', '2026-10-12'), '2026-10-13'), 'overdue');
  assert.equal(computeRentalStatus(row('paid', '2026-10-13'), '2026-10-13'), 'active');
});
