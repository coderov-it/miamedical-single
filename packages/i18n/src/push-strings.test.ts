import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { pushStringEntries, pushStringKey } from './push-strings.ts';

/**
 * The guard on the one failure mode of localized push: a key the installed app
 * does not define renders as the raw key on an iOS lock screen. Every test here
 * is ultimately asserting that we would fall back to a rendered sentence instead.
 */
describe('pushStringKey', () => {
  it('names a per-status key, so the status itself is translatable', () => {
    assert.equal(
      pushStringKey('order.status_changed', {
        orderNumber: 'MIA-2026-001042',
        field: 'status',
        from: 'pending',
        to: 'paid',
      } as never),
      'order_status_changed_status_paid',
    );
  });

  it('keeps order and payment statuses apart when they share a code', () => {
    const order = pushStringKey('order.status_changed', {
      field: 'status',
      to: 'paid',
    } as never);
    const payment = pushStringKey('order.status_changed', {
      field: 'paymentStatus',
      to: 'paid',
    } as never);

    assert.notEqual(order, payment);
    assert.equal(payment, 'order_status_changed_payment_status_paid');
  });

  it('folds the day count into the key, so no plural rule is needed', () => {
    assert.equal(
      pushStringKey('rental.ending_soon', { daysLeft: 3 } as never),
      'rental_ending_soon_3d',
    );
    assert.equal(pushStringKey('order.upcoming', { daysUntil: 2 } as never), 'order_upcoming_2d');
  });

  it('returns null for a threshold the sweep does not fire at', () => {
    // Would otherwise be `rental_ending_soon_5d`, which nothing generated.
    assert.equal(pushStringKey('rental.ending_soon', { daysLeft: 5 } as never), null);
  });

  it('returns null for a status nobody has written copy for', () => {
    assert.equal(
      pushStringKey('order.status_changed', { field: 'status', to: 'teleported' } as never),
      null,
    );
  });

  it('returns null for an event that is not pushable', () => {
    assert.equal(pushStringKey('order.placed', { orderNumber: 'MIA-1' } as never), null);
  });
});

describe('pushStringEntries', () => {
  const entries = pushStringEntries();

  it('generates a unique key per string pair', () => {
    const keys = entries.map((entry) => entry.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  it('answers in every registered language', () => {
    for (const entry of entries) {
      for (const code of ['it', 'en', 'fr', 'de'] as const) {
        assert.ok(entry.title[code], `${entry.key} title/${code}`);
        assert.ok(entry.body[code], `${entry.key} body/${code}`);
      }
    }
  });

  it('leaves no unresolved placeholder except the positional slot', () => {
    // A `{orderNumber}` that survived generation would print literally on a
    // lock screen, because the OS only substitutes its own positional markers.
    for (const entry of entries) {
      for (const text of [...Object.values(entry.title), ...Object.values(entry.body)]) {
        const leftovers = text.match(/\{(\D\w*)\}/g);
        assert.equal(leftovers, null, `${entry.key}: ${String(leftovers)} in ${text}`);
      }
    }
  });

  it('recases a status label for the middle of a sentence', () => {
    const paid = entries.find((entry) => entry.key === 'order_status_changed_status_paid');
    assert.ok(paid);
    assert.match(paid.body.it, /è ora pagato\.$/);
    assert.match(paid.body.de, /ist jetzt bezahlt\.$/);
  });

  it('gives every key both halves the sender asks for', () => {
    // `buildAlert` appends `_title` and `_body`; a pair that existed only as a
    // body would send a title key that resolves to nothing.
    const key = pushStringKey('contract.awaiting_signature', { contractNumber: 'CTR-1' } as never);
    assert.ok(entries.some((entry) => entry.key === key));
  });
});
