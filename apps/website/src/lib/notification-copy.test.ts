/**
 * The payload-to-sentence mapping.
 *
 * This exists because every failure here is silent and looks like copy. A
 * status code that misses its label renders as `cancelled` in the middle of an
 * Italian sentence; a date that misses its formatter renders as `2026-09-17`.
 * Neither throws, neither shows up in a type check, and both shipped once.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { notificationValues } from './notification-copy.ts';

const PRESENTERS = {
  status: { pending: 'In lavorazione', cancelled: 'Annullato', paid: 'Pagato' },
  payment: { paid: 'Pagato (incassato)', refunded: 'Rimborsato' },
  formatDate: (iso: string) => `[${iso}]`,
};

describe('notificationValues', () => {
  it('resolves order statuses to words', () => {
    const values = notificationValues(
      'order.status_changed',
      { orderNumber: 'MIA-1', field: 'status', from: 'pending', to: 'cancelled' },
      PRESENTERS,
    );
    assert.equal(values.to, 'Annullato');
    assert.equal(values.from, 'In lavorazione');
    assert.equal(values.orderNumber, 'MIA-1');
  });

  it('reads payment codes from the payment map, not the order map', () => {
    // `paid` is a member of BOTH enums with different wording. Taking the
    // wrong map produces a plausible sentence that is about the wrong thing.
    const values = notificationValues(
      'order.status_changed',
      { orderNumber: 'MIA-1', field: 'paymentStatus', from: 'unpaid', to: 'paid' },
      PRESENTERS,
    );
    assert.equal(values.to, 'Pagato (incassato)');
  });

  it('leaves a code with no label standing rather than blanking it', () => {
    const values = notificationValues(
      'order.status_changed',
      { orderNumber: 'MIA-1', field: 'status', from: 'paid', to: 'fulfilled' },
      PRESENTERS,
    );
    assert.equal(values.to, 'fulfilled');
  });

  it('formats the date fields each event actually has', () => {
    assert.equal(
      notificationValues('rental.ending_soon', { endsOn: '2026-09-17', daysLeft: 1 }, PRESENTERS)
        .endsOn,
      '[2026-09-17]',
    );
    assert.equal(
      notificationValues('order.upcoming', { startsOn: '2026-09-20' }, PRESENTERS).startsOn,
      '[2026-09-20]',
    );
  });

  it('does not treat `from`/`to` as statuses when they are dates', () => {
    // The same two field names carry order statuses in one event and calendar
    // dates in another. This is the case a name-keyed table gets wrong.
    const values = notificationValues(
      'rental.renewed',
      { orderNumber: 'MIA-1', from: '2026-09-01', to: '2026-10-01' },
      PRESENTERS,
    );
    assert.equal(values.from, '[2026-09-01]');
    assert.equal(values.to, '[2026-10-01]');
  });

  it('keeps numbers as numbers', () => {
    const values = notificationValues(
      'rental.ending_soon',
      { endsOn: '2026-09-17', daysLeft: 3 },
      PRESENTERS,
    );
    assert.equal(values.daysLeft, 3);
  });

  it('passes an unparseable date through rather than printing Invalid Date', () => {
    const values = notificationValues('rental.ending_soon', { endsOn: 'not-a-date' }, PRESENTERS);
    assert.equal(values.endsOn, 'not-a-date');
  });

  it('leaves an unmapped event type untouched', () => {
    const values = notificationValues('order.placed', { orderNumber: 'MIA-1' }, PRESENTERS);
    assert.deepEqual(values, { orderNumber: 'MIA-1' });
  });
});
