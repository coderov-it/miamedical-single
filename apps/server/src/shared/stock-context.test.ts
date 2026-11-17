import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { SQL, Transaction } from '@mia/db';
import { PgDialect } from 'drizzle-orm/pg-core';

import { setStockContext, stockContextSettings } from './stock-context.ts';

test('absent fields are sent as empty strings so nothing stale survives', () => {
  assert.deepEqual(stockContextSettings({ reason: 'order_paid' }), [
    ['mia.stock_reason', 'order_paid'],
    ['mia.stock_order_id', ''],
    ['mia.stock_actor_id', ''],
    ['mia.stock_note', ''],
  ]);
});

test('one SELECT of four transaction-local set_config calls, values bound as parameters', async () => {
  let captured: SQL | undefined;
  const tx = {
    execute: async (query: SQL) => void (captured = query),
  } as unknown as Transaction;
  await setStockContext(tx, {
    reason: 'manual_adjustment',
    actorAdminUserId: 'a-1',
    note: "x'); DROP TABLE products; --",
  });
  assert.ok(captured);
  const { sql: text, params } = new PgDialect().sqlToQuery(captured);
  assert.equal(text.match(/set_config\(/g)?.length, 4);
  assert.equal(text.match(/, true\)/g)?.length, 4);
  assert.ok(text.startsWith('SELECT '));
  assert.deepEqual(params, [
    'mia.stock_reason',
    'manual_adjustment',
    'mia.stock_order_id',
    '',
    'mia.stock_actor_id',
    'a-1',
    'mia.stock_note',
    "x'); DROP TABLE products; --",
  ]);
});
