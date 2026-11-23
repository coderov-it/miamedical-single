import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { FileUploader, ObjectStat, StoredObject } from '@mia/media';

import { pruneRemote } from './upload.ts';

const NOW = new Date('2026-11-23T06:30:00Z');

function fakeUploader(keys: string[]) {
  const objects = new Map<string, StoredObject>(
    keys.map((key) => [key, { key, size: 1, lastModified: NOW }]),
  );
  const unused = (): never => {
    throw new Error('not used by pruneRemote');
  };
  const uploader: FileUploader = {
    upload: unused,
    head: async (): Promise<ObjectStat | null> => unused(),
    probeImage: unused,
    move: unused,
    list: async (prefix) => [...objects.values()].filter((object) => object.key.startsWith(prefix)),
    delete: async (key) => {
      objects.delete(key);
    },
  };
  return { uploader, remaining: () => [...objects.keys()].sort() };
}

test('pruneRemote deletes only day folders older than KEEP_DAYS', async () => {
  const { uploader, remaining } = fakeUploader([
    'production/2026-11-13/x.dump',
    'production/2026-11-14/y.dump',
    'production/2026-11-23/z.dump',
  ]);
  const deleted = await pruneRemote(uploader, 'production', NOW);
  assert.equal(deleted, 1);
  assert.deepEqual(remaining(), ['production/2026-11-14/y.dump', 'production/2026-11-23/z.dump']);
});
