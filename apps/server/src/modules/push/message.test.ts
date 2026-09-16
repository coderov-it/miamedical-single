import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { atLeastVersion, localizedArgs, tapRoute } from './message.ts';

/**
 * Version comparison decides whether a device is sent a localization key or a
 * rendered sentence. Getting it wrong in the permissive direction puts a raw key
 * on somebody's lock screen, so the bias is asserted, not just the arithmetic.
 */
describe('atLeastVersion', () => {
  it('compares numerically, not as text', () => {
    // The whole reason this function exists: '1.10.0' < '1.9.0' as strings.
    assert.equal(atLeastVersion('1.10.0', '1.9.0'), true);
    assert.equal(atLeastVersion('1.9.0', '1.10.0'), false);
  });

  it('treats an exact match as satisfied', () => {
    assert.equal(atLeastVersion('1.0.0', '1.0.0'), true);
  });

  it('pads missing segments with zero', () => {
    assert.equal(atLeastVersion('2', '1.9.9'), true);
    assert.equal(atLeastVersion('1.2', '1.2.0'), true);
    assert.equal(atLeastVersion('1.2', '1.2.1'), false);
  });

  it('treats anything unparseable as TOO OLD', () => {
    // The safe direction. Guessing "new" would send keys to a build that may not
    // have them, which is the one failure worth engineering around; guessing
    // "old" only costs a rendered sentence on a modern app.
    assert.equal(atLeastVersion('nightly', '1.0.0'), false);
    assert.equal(atLeastVersion('', '1.0.0'), false);
    assert.equal(atLeastVersion('1.0.0-rc1', '1.0.0'), false);
  });
});

describe('localizedArgs', () => {
  it('sends exactly the fields the generated placeholders expect', () => {
    assert.deepEqual(
      localizedArgs('order.status_changed', {
        orderNumber: 'MIA-2026-001042',
        field: 'status',
        from: 'pending',
        to: 'paid',
      } as never),
      ['MIA-2026-001042'],
    );
  });

  it('never passes a status or a date as an argument', () => {
    // Both would be printed verbatim by the OS formatter, in whatever language
    // the server was thinking in, inside a sentence the phone rendered in
    // another. They belong in the key instead.
    const args = localizedArgs('rental.ending_soon', {
      orderNumber: 'MIA-1',
      endsOn: '2026-09-24',
      daysLeft: 3,
      customerName: 'Anna',
    } as never);

    assert.deepEqual(args, ['MIA-1']);
  });

  it('is empty for an event with no phone-ready copy', () => {
    assert.deepEqual(localizedArgs('order.placed', { orderNumber: 'MIA-1' } as never), []);
  });

  it('renders a missing field as empty rather than "undefined"', () => {
    assert.deepEqual(localizedArgs('order.status_changed', {} as never), ['']);
  });
});

describe('tapRoute', () => {
  it('points at the order the notification is about', () => {
    assert.equal(
      tapRoute('order.status_changed', { orderNumber: 'MIA-2026-001042' } as never),
      '/area-clienti/ordini/MIA-2026-001042/',
    );
  });

  it('falls back to the feed when the payload names no order', () => {
    assert.equal(
      tapRoute('contract.awaiting_signature', { contractNumber: 'CTR-1' } as never),
      '/area-clienti/notifiche/',
    );
  });

  it('encodes the number, matching accountHref on the other side', () => {
    assert.equal(
      tapRoute('order.status_changed', { orderNumber: 'MIA 2026/1' } as never),
      '/area-clienti/ordini/MIA%202026%2F1/',
    );
  });
});
