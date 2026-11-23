import { readFile } from 'node:fs/promises';

import type { FileUploader } from '@mia/media';

import { expiredDays } from './naming.ts';

/** Keys known to be in R2 for this process, so a quiet tick costs no request. */
const uploaded = new Set<string>();

/** Puts the local dump at `key` as-is, unless the bucket already holds it. */
export async function ensureUploaded(
  uploader: FileUploader,
  key: string,
  file: string,
): Promise<void> {
  if (uploaded.has(key)) return;
  if ((await uploader.head(key)) === null) {
    await uploader.upload(key, await readFile(file), 'application/octet-stream');
    console.log(`[backup] uploaded ${key}`);
  }
  uploaded.add(key);
}

/** Deletes R2 backups whose day folder is older than KEEP_DAYS. Only called after a successful upload. */
export async function pruneRemote(
  uploader: FileUploader,
  folder: string,
  now: Date,
): Promise<number> {
  const prefix = `${folder}/`;
  const objects = await uploader.list(prefix);
  const dayOf = (key: string) => key.slice(prefix.length).split('/')[0] ?? '';
  const expired = new Set(
    expiredDays([...new Set(objects.map((object) => dayOf(object.key)))], now),
  );
  let deleted = 0;
  for (const object of objects) {
    if (!expired.has(dayOf(object.key))) continue;
    await uploader.delete(object.key);
    deleted += 1;
  }
  return deleted;
}
