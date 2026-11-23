import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { Readable } from 'node:stream';

import { P } from '@mia/permissions';
import { ManualBackupSchema, UuidSchema } from '@mia/validators';
import { Hono } from 'hono';
import * as v from 'valibot';

import { FEATURES } from '../../config/features.ts';
import { backupUploader } from '../../infra/backup-storage.ts';
import { currentUser, requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { conflict, notFound } from '../../shared/http/errors.ts';
import { validate } from '../../shared/http/validate.ts';
import { startManualBackup } from './manual.ts';
import { nextSlotStart } from './naming.ts';
import type { BackupRow } from './repo.ts';
import { findById, listRecent } from './repo.ts';

const BackupIdParamSchema = v.object({ id: UuidSchema });

/** A log row as the admin sees it: no server path, plus whether the file can still be downloaded. */
function toRun(row: BackupRow, downloadable: boolean) {
  const { localPath: _localPath, ...rest } = row;
  return { ...rest, downloadable };
}

const fileExists = (file: string) =>
  access(file).then(
    () => true,
    () => false,
  );

/**
 * Database backups, mounted at /api/admin/backups.
 * The log, a manual run, and the download of a file still on the server's disk.
 * Not in any permission bundle: a backup holds every customer's data.
 */
export const backupAdminRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/admin/backups (setting:backup_read)
  Whether backups are on, and this instance's recent backup log, newest first.
  -------------------------------------------------------------------------- **/
  .get('/', requirePermission(P.BACKUP_READ), async (c) => {
    const rows = FEATURES.backup ? await listRecent(c.get('db'), FEATURES.backup.folder) : [];
    const runs = await Promise.all(
      rows.map(async (row) =>
        toRun(row, row.status === 'succeeded' && (await fileExists(row.localPath))),
      ),
    );
    return c.json({
      data: {
        enabled: FEATURES.backup !== null,
        folder: FEATURES.backup?.folder ?? null,
        bucket: FEATURES.backup?.storage.bucket ?? null,
        nextScheduledAt: FEATURES.backup ? nextSlotStart(new Date()).toISOString() : null,
        runs,
      },
    });
  })
  /** --------------------------------------------------------------------------
  POST /api/admin/backups (setting:backup_create)
  Starts a manual backup under the given name and returns its running log row.
  -------------------------------------------------------------------------- **/
  .post(
    '/',
    requirePermission(P.BACKUP_CREATE),
    validate('json', ManualBackupSchema),
    async (c) => {
      if (!FEATURES.backup || !backupUploader) throw conflict('Backups are off on this server.');
      const row = await startManualBackup(
        c.get('db'),
        backupUploader,
        FEATURES.backup,
        c.req.valid('json').name,
        currentUser(c).id,
      );
      return c.json({ data: toRun(row, false) }, 202);
    },
  )
  /** --------------------------------------------------------------------------
  GET /api/admin/backups/:id/download (setting:backup_read)
  Streams the backup file from the server's disk.
  -------------------------------------------------------------------------- **/
  .get(
    '/:id/download',
    requirePermission(P.BACKUP_READ),
    validate('param', BackupIdParamSchema),
    async (c) => {
      const row = await findById(c.get('db'), c.req.valid('param').id);
      if (!row || row.folder !== FEATURES.backup?.folder || row.status !== 'succeeded') {
        throw notFound('Backup');
      }
      const size = await stat(row.localPath).then(
        (info) => info.size,
        () => null,
      );
      if (size === null) throw notFound('Backup');
      return new Response(Readable.toWeb(createReadStream(row.localPath)) as ReadableStream, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(size),
          'Content-Disposition': `attachment; filename="${row.fileName}"`,
        },
      });
    },
  );
