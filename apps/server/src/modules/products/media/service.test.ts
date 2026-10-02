import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { MediaItem, ProductMedia } from '@mia/db/schema';
import type { FileUploader, ObjectStat, StoredObject } from '@mia/media';

import { commitIcon, commitProductMedia, withMediaRollback } from './service.ts';

/**
 * The failure the ordering exists for: the media commits, then the DB write
 * throws. The row still points at the old objects, so they must survive; the
 * objects this attempt committed are referenced by nothing and must go.
 */

class FakeStorage implements FileUploader {
  readonly objects = new Map<string, ObjectStat>();
  readonly deleted: string[] = [];

  put(key: string, contentType = 'image/svg+xml'): void {
    this.objects.set(key, { size: 100, contentType });
  }
  async upload(key: string, _bytes: Uint8Array, contentType: string): Promise<void> {
    this.put(key, contentType);
  }
  async delete(key: string): Promise<void> {
    this.deleted.push(key);
    this.objects.delete(key);
  }
  async head(key: string): Promise<ObjectStat | null> {
    return this.objects.get(key) ?? null;
  }
  async probeImage(): Promise<null> {
    return null;
  }
  async move(fromKey: string, toKey: string): Promise<void> {
    const stat = this.objects.get(fromKey);
    if (!stat) throw new Error(`no object at ${fromKey}`);
    this.objects.set(toKey, stat);
    this.objects.delete(fromKey);
  }
  async list(): Promise<StoredObject[]> {
    return [];
  }
}

const item = (path: string): MediaItem => ({ path, mimeType: 'image/svg+xml' });

const media = (overrides: Partial<ProductMedia>): ProductMedia => ({
  thumbnail: null,
  cleanPng: null,
  gallery: [],
  videos: [],
  documents: [],
  ...overrides,
});

const OLD_THUMB = 'products/p1/aaaaaaaa-old.svg';
const OLD_GALLERY = 'products/p1/bbbbbbbb-dropped.svg';
const NEW_THUMB_STAGING = '_staging/11111111-2222-3333-4444-555555555555/new.svg';
const NEW_THUMB_FINAL = 'products/p1/11111111-new.svg';

function seeded(): { storage: FakeStorage; stored: ProductMedia; incoming: ProductMedia } {
  const storage = new FakeStorage();
  storage.put(OLD_THUMB);
  storage.put(OLD_GALLERY);
  storage.put(NEW_THUMB_STAGING);
  return {
    storage,
    stored: media({ thumbnail: item(OLD_THUMB), gallery: [item(OLD_GALLERY)] }),
    // Replace the thumbnail, drop the gallery photo.
    incoming: media({ thumbnail: item(NEW_THUMB_STAGING), gallery: [] }),
  };
}

describe('commitProductMedia inside withMediaRollback', () => {
  it('deletes only what this save committed when the DB write fails', async () => {
    const { storage, stored, incoming } = seeded();

    await assert.rejects(
      withMediaRollback(storage, async (committed) => {
        await commitProductMedia(storage, 'p1', stored, incoming, committed);
        throw new Error('db down');
      }),
      /db down/,
    );

    assert.deepEqual(storage.deleted, [NEW_THUMB_FINAL]);
    assert.ok(storage.objects.has(OLD_THUMB), 'the live thumbnail survives');
    assert.ok(storage.objects.has(OLD_GALLERY), 'the live gallery photo survives');
  });

  it('deletes nothing on success — replaced objects are left for the sweep', async () => {
    const { storage, stored, incoming } = seeded();

    const result = await withMediaRollback(storage, (committed) =>
      commitProductMedia(storage, 'p1', stored, incoming, committed),
    );

    assert.equal(result.thumbnail?.path, NEW_THUMB_FINAL);
    assert.deepEqual(storage.deleted, []);
    assert.ok(storage.objects.has(OLD_THUMB));
    assert.ok(storage.objects.has(OLD_GALLERY));
  });

  it('rolls back a sibling commit when a later item is rejected', async () => {
    const { storage, stored } = seeded();
    const incoming = media({
      thumbnail: item(OLD_THUMB),
      gallery: [item(NEW_THUMB_STAGING), item('_staging/99999999-0000/missing.svg')],
    });

    await assert.rejects(
      withMediaRollback(storage, (committed) =>
        commitProductMedia(storage, 'p1', stored, incoming, committed),
      ),
      (error: { status?: number }) => error.status === 422,
    );

    assert.deepEqual(storage.deleted, [NEW_THUMB_FINAL]);
    assert.ok(storage.objects.has(OLD_THUMB));
  });
});

describe('commitIcon inside withMediaRollback', () => {
  const OLD_ICON = 'categories/c1/aaaaaaaa-old.svg';
  const NEW_ICON_STAGING = '_staging/22222222-3333/icon.svg';
  const NEW_ICON_FINAL = 'categories/c1/22222222-icon.svg';

  it('keeps the replaced icon and removes the new one when the write fails', async () => {
    const storage = new FakeStorage();
    storage.put(OLD_ICON);
    storage.put(NEW_ICON_STAGING);

    await assert.rejects(
      withMediaRollback(storage, async (committed) => {
        await commitIcon(
          storage,
          'categories/c1',
          OLD_ICON,
          NEW_ICON_STAGING,
          'icon_256',
          committed,
        );
        throw new Error('db down');
      }),
    );

    assert.deepEqual(storage.deleted, [NEW_ICON_FINAL]);
    assert.ok(storage.objects.has(OLD_ICON));
  });

  it('leaves the replaced icon in place on success', async () => {
    const storage = new FakeStorage();
    storage.put(OLD_ICON);
    storage.put(NEW_ICON_STAGING);

    const icon = await withMediaRollback(storage, (committed) =>
      commitIcon(storage, 'categories/c1', OLD_ICON, NEW_ICON_STAGING, 'icon_256', committed),
    );

    assert.equal(icon, NEW_ICON_FINAL);
    assert.deepEqual(storage.deleted, []);
    assert.ok(storage.objects.has(OLD_ICON));
  });
});
