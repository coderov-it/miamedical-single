import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEDUPE_WINDOW_MS,
  isAutomated,
  isOutsideWindow,
  parseSentAt,
  storageKey,
} from './view-beacon-rules.ts';

describe('view beacon rules', () => {
  const now = 1_000_000_000;

  it('sends when nothing was sent before', () => {
    assert.equal(isOutsideWindow(null, now), true);
  });

  it('does not send again inside 30 minutes', () => {
    assert.equal(isOutsideWindow(now - 60_000, now), false);
    assert.equal(isOutsideWindow(now - DEDUPE_WINDOW_MS + 1, now), false);
  });

  it('sends again once the window has passed', () => {
    assert.equal(isOutsideWindow(now - DEDUPE_WINDOW_MS, now), true);
  });

  it('ignores a timestamp from the future', () => {
    assert.equal(isOutsideWindow(now + 5_000, now), true);
  });

  it('treats garbage storage as never sent', () => {
    assert.equal(parseSentAt(null), null);
    assert.equal(parseSentAt('nope'), null);
    assert.equal(parseSentAt('123'), 123);
  });

  it('keys per product and skips automated browsers', () => {
    assert.notEqual(storageKey('a'), storageKey('b'));
    assert.equal(isAutomated(true), true);
    assert.equal(isAutomated(false), false);
    assert.equal(isAutomated(undefined), false);
  });
});
