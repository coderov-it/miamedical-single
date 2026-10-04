// Regression: CART-004 — checkout accepted "@" and "qa@example" as an email; the API refused them only at the final submit
// Found by /qa on 2026-10-04
// Report: ~/.gstack/projects/coderov-it-miamedical-single/qa-reports/run-20261004T080925Z/

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as v from 'valibot';

import { EmailSchema } from './common.ts';
import { isPlausibleEmail } from './contact.ts';

describe('isPlausibleEmail', () => {
  for (const email of ['qa+checkout@example.com', 'mario.rossi@libero.it', ' a@b.co ']) {
    it(`accepts ${JSON.stringify(email)}`, () => assert.equal(isPlausibleEmail(email), true));
  }

  for (const email of ['@', 'qa+checkout@example', 'no-at-sign.it', 'a b@c.it', '']) {
    it(`refuses ${JSON.stringify(email)}`, () => assert.equal(isPlausibleEmail(email), false));
  }

  /* The point of the browser check is to fail early on what the server will
     fail later, so it must never pass something EmailSchema refuses. */
  it('never passes what the server refuses', () => {
    for (const email of ['@', 'qa+checkout@example', 'a b@c.it', 'x@', '@y.it']) {
      if (isPlausibleEmail(email)) assert.equal(v.safeParse(EmailSchema, email).success, true, email);
    }
  });
});
