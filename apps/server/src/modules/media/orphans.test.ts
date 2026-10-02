import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { FileUploader, StoredObject } from '@mia/media';

import { FINAL_GRACE_MS, reclaimFinalObjects } from './orphans.ts';

/**
 * The final-object sweep deletes from a bucket that serves the live site, so
 * every reason it has to keep an object is asserted, not only the deletion.
 */

const NOW = Date.parse('2026-10-02T12:00:00Z');
const OLD = new Date(NOW - FINAL_GRACE_MS - 60_000);
const YOUNG = new Date(NOW - 60_000);

class FakeBucket implements FileUploader {
  readonly deleted: string[] = [];
  readonly objects: StoredObject[];
  constructor(objects: StoredObject[]) {
    this.objects = objects;
  }

  async list(prefix: string): Promise<StoredObject[]> {
    return this.objects.filter((object) => object.key.startsWith(prefix));
  }
  async delete(key: string): Promise<void> {
    this.deleted.push(key);
  }
  async upload(): Promise<void> {}
  async head(): Promise<null> {
    return null;
  }
  async probeImage(): Promise<null> {
    return null;
  }
  async move(): Promise<void> {}
}

const object = (key: string, lastModified = OLD): StoredObject => ({ key, size: 1, lastModified });

const run = (bucket: FakeBucket, references: string[], dryRun = false) =>
  reclaimFinalObjects(bucket, async () => references, { dryRun, now: NOW });

describe('reclaimFinalObjects', () => {
  it('deletes an old object no reference names', async () => {
    const bucket = new FakeBucket([
      object('products/p1/aaaaaaaa-live.webp'),
      object('products/p1/bbbbbbbb-replaced.webp'),
    ]);
    const result = await run(bucket, ['products/p1/aaaaaaaa-live.webp']);
    assert.deepEqual(bucket.deleted, ['products/p1/bbbbbbbb-replaced.webp']);
    assert.equal(result.deleted, 1);
  });

  it('keeps anything younger than the grace period — a save may be committing it', async () => {
    const bucket = new FakeBucket([
      object('products/p1/aaaaaaaa-live.webp'),
      object('products/p1/cccccccc-new.webp', YOUNG),
    ]);
    await run(bucket, ['products/p1/aaaaaaaa-live.webp']);
    assert.deepEqual(bucket.deleted, []);
  });

  it('keeps a key that only appears inside a longer string', async () => {
    const bucket = new FakeBucket([
      object('products/p1/aaaaaaaa-live.webp'),
      object('products/p1/dddddddd-manual.pdf'),
    ]);
    await run(bucket, [
      'products/p1/aaaaaaaa-live.webp',
      '<p><a href="https://cdn.example.com/products/p1/dddddddd-manual.pdf">PDF</a></p>',
    ]);
    assert.deepEqual(bucket.deleted, []);
  });

  it('never looks outside the final prefixes', async () => {
    const bucket = new FakeBucket([object('contracts/x.pdf'), object('_staging/u/file.webp')]);
    const result = await run(bucket, ['anything']);
    assert.equal(result.scanned, 0);
    assert.deepEqual(bucket.deleted, []);
  });

  it('keeps an object whose timestamp is unknown', async () => {
    const bucket = new FakeBucket([object('products/p1/eeeeeeee-x.webp', new Date(0))]);
    await run(bucket, ['unrelated']);
    assert.deepEqual(bucket.deleted, []);
  });

  it('reports but deletes nothing in a dry run', async () => {
    const bucket = new FakeBucket([object('products/p1/a.webp'), object('products/p1/b.webp')]);
    const result = await run(bucket, ['products/p1/a.webp'], true);
    assert.deepEqual(result.orphans, ['products/p1/b.webp']);
    assert.deepEqual(bucket.deleted, []);
  });

  it('refuses when the database returned no references at all', async () => {
    const bucket = new FakeBucket([object('products/p1/a.webp')]);
    const result = await run(bucket, []);
    assert.equal(result.skipped, 'no_references');
    assert.deepEqual(bucket.deleted, []);
  });

  it('trips the breaker when most of a real bucket looks unreferenced', async () => {
    const keys = Array.from({ length: 30 }, (_, index) => `products/p${index}/a.webp`);
    const bucket = new FakeBucket(keys.map((key) => object(key)));
    // A database that knows 5 of 30 objects — the wrong database, not 25 orphans.
    const result = await run(bucket, keys.slice(0, 5));
    assert.equal(result.skipped, 'breaker');
    assert.deepEqual(bucket.deleted, []);
  });
});
