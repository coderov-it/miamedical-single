import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { errorText } from './mail-failure.ts';

/** The provider's error lands in an order timeline note, so it must stay readable. */
describe('errorText', () => {
  it('keeps an Error message as it is', () => {
    assert.equal(
      errorText(new Error('DOMAIN_NOT_VERIFIED on from')),
      'DOMAIN_NOT_VERIFIED on from',
    );
  });

  it('stringifies a non-Error rejection', () => {
    assert.equal(errorText('timeout'), 'timeout');
  });

  it('cuts a long provider body to 300 characters plus an ellipsis', () => {
    const text = errorText(new Error('x'.repeat(1000)));
    assert.equal(text.length, 301);
    assert.ok(text.endsWith('…'));
  });
});
