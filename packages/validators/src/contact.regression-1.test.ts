// Regression: ACC-005 / CART-004 — "abc", "12" and "hello world" were accepted as a customer phone
// Found by /qa on 2026-10-04
// Report: ~/.gstack/projects/coderov-it-miamedical-single/qa-reports/run-20261004T080925Z/

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as v from 'valibot';

import { CustomerPhoneSchema } from './common.ts';
import { isPlausiblePhone } from './contact.ts';

describe('isPlausiblePhone', () => {
  for (const phone of ['+39 333 1234567', '333-123-4567', '(06) 1234 5678', '+44 20 7946 0958', '0039.333.1234567']) {
    it(`accepts ${JSON.stringify(phone)}`, () => assert.equal(isPlausiblePhone(phone), true));
  }

  for (const phone of ['abc', '12', 'hello world', '333 abc 4567', '+', '', '1234567890123456']) {
    it(`refuses ${JSON.stringify(phone)}`, () => assert.equal(isPlausiblePhone(phone), false));
  }
});

describe('CustomerPhoneSchema', () => {
  it('trims and keeps a real number', () => {
    assert.equal(v.parse(CustomerPhoneSchema, '  +39 333 1234567 '), '+39 333 1234567');
  });

  it('refuses words', () => {
    assert.equal(v.safeParse(CustomerPhoneSchema, 'hello world').success, false);
  });
});
