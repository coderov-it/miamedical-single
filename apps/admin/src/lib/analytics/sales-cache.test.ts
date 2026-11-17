import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createCache, salesKey } from './sales-cache.ts';

function setup(options = {}) {
  let clock = 0;
  const calls: string[] = [];
  const cache = createCache(
    async (key: string) => {
      calls.push(key);
      return `v:${key}`;
    },
    { now: () => clock, ...options },
  );
  return { cache, calls, advance: (ms: number) => (clock += ms) };
}

test('salesKey joins range and bucket', () => {
  assert.equal(salesKey({ from: 'a', to: 'b' }, 'day'), 'a|b|day');
});

test('a fresh entry is served without a second request, then expires after 60 s', async () => {
  const { cache, calls, advance } = setup();
  await cache.get('k');
  await cache.get('k');
  assert.equal(calls.length, 1);
  advance(60_000);
  await cache.get('k');
  assert.equal(calls.length, 2);
});

test('concurrent get and prefetch share one in-flight request', async () => {
  const { cache, calls } = setup();
  cache.prefetch('k');
  const value = await cache.get('k');
  assert.equal(value, 'v:k');
  assert.equal(calls.length, 1);
});

test('keeps at most max entries, dropping the oldest', async () => {
  const { cache, calls } = setup({ max: 2 });
  await cache.get('a');
  await cache.get('b');
  await cache.get('c');
  await cache.get('b');
  assert.equal(calls.length, 3);
  await cache.get('a');
  assert.equal(calls.length, 4);
});

test('failures are not cached and prefetch swallows them', async () => {
  let fail = true;
  const cache = createCache(async () => {
    if (fail) throw new Error('boom');
    return 'ok';
  });
  cache.prefetch('k');
  await assert.rejects(cache.get('k'));
  fail = false;
  assert.equal(await cache.get('k'), 'ok');
});
