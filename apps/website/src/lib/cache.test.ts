/**
 * The four branches of `cached()`, on tiny policies.
 *
 * These exist because every one of them is a decision about what a visitor
 * sees when the API is slow, stale or gone — and three of the four only happen
 * on a timer nobody exercises by clicking around.
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { cached, invalidate, type CachePolicy } from './cache.ts';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 40 ms fresh, 80 ms more of stale-while-revalidate. */
const SHORT: CachePolicy = { fresh: 0.04, stale: 0.08 };

let calls = 0;
let nextValue: string;
let failing: boolean;

function read(): Promise<string> {
  calls += 1;
  if (failing) return Promise.reject(new Error('API down'));
  return Promise.resolve(nextValue);
}

describe('cached', () => {
  beforeEach(() => {
    invalidate();
    calls = 0;
    nextValue = 'first';
    failing = false;
  });

  it('reads once and serves the stored value while it is fresh', async () => {
    assert.equal(await cached('k', read, SHORT), 'first');
    nextValue = 'second';
    assert.equal(await cached('k', read, SHORT), 'first');
    assert.equal(calls, 1);
  });

  it('makes one API call for a burst of concurrent cold requests', async () => {
    const answers = await Promise.all(Array.from({ length: 20 }, () => cached('k', read, SHORT)));
    assert.deepEqual(new Set(answers), new Set(['first']));
    assert.equal(calls, 1);
  });

  it('serves the stale value immediately and refills behind it', async () => {
    await cached('k', read, SHORT);
    nextValue = 'second';
    await sleep(60);

    // Still the old value — this request does not wait for the refresh.
    assert.equal(await cached('k', read, SHORT), 'first');
    await sleep(20);
    assert.equal(await cached('k', read, SHORT), 'second');
    assert.equal(calls, 2);
  });

  it('keeps the stored value when a background refresh fails', async () => {
    await cached('k', read, SHORT);
    failing = true;
    await sleep(60);

    assert.equal(await cached('k', read, SHORT), 'first');
    await sleep(20);
    assert.equal(await cached('k', read, SHORT), 'first');
  });

  it('serves a value past its stale window rather than nothing when the read fails', async () => {
    await cached('k', read, SHORT);
    failing = true;
    await sleep(140); // past fresh + stale

    assert.equal(await cached('k', read, SHORT), 'first');
  });

  it('throws on a cold read so the caller can decide what an empty page looks like', async () => {
    failing = true;
    await assert.rejects(() => cached('k', read, SHORT), /API down/);
  });

  it('forgets one key without touching the others', async () => {
    await cached('a', read, SHORT);
    await cached('b', read, SHORT);
    nextValue = 'second';

    invalidate('a');
    assert.equal(await cached('a', read, SHORT), 'second');
    assert.equal(await cached('b', read, SHORT), 'first');
  });
});
