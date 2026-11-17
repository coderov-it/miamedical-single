import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createViewBuffer } from './buffer.ts';
import { createViewCounter, type ViewRow } from './flush.ts';

test('buffer counts per key and refuses new keys past the cap', () => {
  const b = createViewBuffer(2);
  b.record('d|a');
  b.record('d|a');
  b.record('d|b');
  b.record('d|c');
  const { counts, dropped } = b.take();
  assert.deepEqual(
    [...counts],
    [
      ['d|a', 2],
      ['d|b', 1],
    ],
  );
  assert.equal(dropped, 1);
  assert.equal(b.size(), 0);
});

test('an existing key still counts when the buffer is full', () => {
  const b = createViewBuffer(1);
  b.record('d|a');
  b.record('d|a');
  assert.equal(b.take().counts.get('d|a'), 2);
});

test('flush writes the swapped counts; views during the write go to the next flush', async () => {
  const written: ViewRow[][] = [];
  const c = createViewCounter(10, async (rows) => {
    c.record('2026-11-17', 'p1'); // arrives mid-flush
    written.push(rows);
  });
  c.record('2026-11-17', 'p1');
  c.record('2026-11-17', 'p1');
  await c.flush();
  assert.deepEqual(written[0], [{ day: '2026-11-17', productId: 'p1', views: 2 }]);
  await c.flush();
  assert.deepEqual(written[1], [{ day: '2026-11-17', productId: 'p1', views: 1 }]);
  assert.notEqual(c.flushedAt(), null);
});

test('a failing write merges the counts back, added to newer ones', async () => {
  let fail = true;
  const written: ViewRow[][] = [];
  const c = createViewCounter(10, async (rows) => {
    if (fail) {
      c.record('2026-11-17', 'p1');
      throw new Error('db down');
    }
    written.push(rows);
  });
  const log = console.error;
  console.error = () => {};
  c.record('2026-11-17', 'p1');
  await c.flush();
  console.error = log;
  assert.equal(c.flushedAt(), null);
  fail = false;
  await c.flush();
  assert.deepEqual(written[0], [{ day: '2026-11-17', productId: 'p1', views: 2 }]);
});

test('merge-back respects the cap', async () => {
  const c = createViewCounter(1, async () => {
    c.record('d', 'new'); // takes the only slot while the write is failing
    throw new Error('db down');
  });
  const log = console.error;
  console.error = () => {};
  c.record('d', 'old');
  await c.flush();
  console.error = log;
  assert.equal(c.pending(), 1);
});
