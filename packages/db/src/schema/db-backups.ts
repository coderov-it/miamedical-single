import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { adminUsers } from './admin-users.ts';
import { backupKind, backupStatus } from './enums.ts';

/**
 * One row per backup file, scheduled or manual: the log the admin Database tab
 * shows. A scheduled slot that fails and retries reuses its row (`attempts`
 * goes up). Rows outlive pruned files — the file is gone, the history stays.
 * Walkthrough: docs/code/db-backup.md.
 *
 * `r2Key` is unique: it is the file's identity, and what makes a double click
 * on "manual backup" in the same minute a conflict instead of two rows.
 * `uploadedAt` null on a succeeded row means the dump exists but is not in R2.
 */
export const dbBackups = pgTable(
  'db_backups',
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: backupKind().notNull(),
    /** DB_BACKUP_FOLDER at the time of the run. */
    folder: text().notNull(),
    /** The operator's custom name; null for scheduled backups. */
    name: text(),
    fileName: text().notNull(),
    localPath: text().notNull(),
    r2Key: text().notNull(),
    sizeBytes: bigint({ mode: 'number' }),
    status: backupStatus().notNull(),
    error: text(),
    attempts: integer().notNull().default(1),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp({ withTimezone: true }),
    uploadedAt: timestamp({ withTimezone: true }),
    triggeredByAdminUserId: uuid().references(() => adminUsers.id, { onDelete: 'set null' }),
  },
  (t) => [
    uniqueIndex('db_backups_r2_key_uq').on(t.r2Key),
    index('db_backups_started_idx').on(t.startedAt),
  ],
);
