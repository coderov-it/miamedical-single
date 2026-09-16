import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { effectivePreferences, mayPush } from './push-preferences.ts';

/**
 * The two gates, and the cases where they disagree. Everything here is about a
 * customer either being interrupted when they asked not to be, or not being
 * interrupted when they are the last person who can unblock an order — so the
 * defaults are asserted explicitly rather than read off the table.
 */
describe('mayPush', () => {
  it('pushes an event that is on by default when nothing is stored', () => {
    assert.equal(mayPush('contract.awaiting_signature', {}), true);
    assert.equal(mayPush('order.status_changed', undefined), true);
    assert.equal(mayPush('rental.ending_soon', null), true);
    assert.equal(mayPush('order.upcoming', {}), true);
  });

  it('never pushes an event we decided is not worth a lock screen', () => {
    // The customer signed it seconds ago and is looking at the result.
    assert.equal(mayPush('contract.signed', {}), false);
    assert.equal(mayPush('rental.renewed', {}), false);
  });

  it('never pushes an operator event, whatever the preferences say', () => {
    assert.equal(mayPush('order.placed', { order: { push: true } }), false);
    assert.equal(mayPush('order.link_disputed', { order: { push: true } }), false);
    assert.equal(mayPush('contract.unsigned_blocking', { contract: { push: true } }), false);
  });

  it('honours an explicit opt-out, by category', () => {
    assert.equal(mayPush('order.status_changed', { order: { push: false } }), false);
    // A different category is untouched by that decision.
    assert.equal(mayPush('rental.ending_soon', { order: { push: false } }), true);
  });

  it('cannot be switched ON for an event that is off by default', () => {
    // The preference mutes; it does not promote. Otherwise a stored `true`
    // written today would keep pushing an event we later judged too noisy.
    assert.equal(mayPush('contract.signed', { contract: { push: true } }), false);
  });

  it('refuses a type written by a newer process', () => {
    // Unclassifiable, so no preference can apply to it. The feed still records
    // it — we simply do not interrupt somebody over a row we cannot bucket.
    assert.equal(mayPush('payment.failed', {}), false);
    assert.equal(mayPush('', {}), false);
  });
});

describe('effectivePreferences', () => {
  it('answers every category, so the UI never applies a default of its own', () => {
    assert.deepEqual(effectivePreferences({}), {
      order: { push: true },
      rental: { push: true },
      contract: { push: true },
    });
  });

  it('treats a missing bag as no deviations rather than as everything off', () => {
    assert.deepEqual(effectivePreferences(null), effectivePreferences({}));
    assert.deepEqual(effectivePreferences(undefined), effectivePreferences({}));
  });

  it('is opt-out: only an explicit false turns a category off', () => {
    assert.equal(effectivePreferences({ order: {} }).order.push, true);
    assert.equal(effectivePreferences({ order: { push: false } }).order.push, false);
  });
});
