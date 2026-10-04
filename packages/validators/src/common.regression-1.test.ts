// Regression: SYS-002 — an unbounded `page` built an OFFSET Postgres could not read, a 500 on every list
// Found by /qa on 2026-10-04
// Report: ~/.gstack/projects/coderov-it-miamedical-single/qa-reports/run-20261004T080925Z/

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as v from 'valibot';

import { PaginationSchema } from './common.ts';

describe('PaginationSchema — page', () => {
  it('accepts an ordinary page', () => {
    assert.deepEqual(v.parse(PaginationSchema, { page: '3', perPage: '24' }), { page: 3, perPage: 24 });
  });

  for (const page of ['99999999999999999999', '1e300', '10001']) {
    it(`refuses page=${page}`, () => {
      assert.equal(v.safeParse(PaginationSchema, { page }).success, false);
    });
  }
});
