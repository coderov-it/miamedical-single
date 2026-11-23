import * as v from 'valibot';

import { env } from './env.ts';

/**
 * The database backup's environment variables, parsed apart from `env.ts` so
 * that file stays one screen of shared settings. Same rule: a typo fails at
 * boot naming the variable. Walkthrough: docs/code/db-backup.md.
 *
 *   DB_BACKUP=off                        → no dumps are taken
 *   DB_BACKUP=on, folder + bucket + creds → dump every 4h UTC, local + private R2 bucket copy
 *   DB_BACKUP=on, bucket = R2_BUCKET     → refuse to start (the media bucket is public)
 *   DB_BACKUP=on, anything missing       → refuse to start (any NODE_ENV)
 *
 * Credentials: the DB_BACKUP_R2_* pair if set, else the R2_* pair; both or neither.
 */
const BackupEnvSchema = v.object({
  DB_BACKUP: v.optional(v.picklist(['off', 'on']), 'off'),
  /** Names the folder and the files: "miamedical-prod", "miamedical-dev". */
  DB_BACKUP_FOLDER: v.optional(v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/))),
  /** Default `~/.local/data/backups`, resolved in `features.ts`. */
  DB_BACKUP_LOCAL_DIR: v.optional(v.string()),
  /** A dedicated private bucket; must not be the public media bucket. */
  DB_BACKUP_R2_BUCKET: v.optional(v.string()),
  /** Optional token scoped to the backup bucket; unset → the R2_* keys are used. */
  DB_BACKUP_R2_ACCESS_KEY_ID: v.optional(v.string()),
  DB_BACKUP_R2_SECRET_ACCESS_KEY: v.optional(v.string()),
});

const parsed = v.safeParse(BackupEnvSchema, process.env);

if (!parsed.success) {
  const issues = parsed.issues
    .map((issue) => `  - ${v.getDotPath(issue) ?? '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid backup configuration:\n${issues}`);
}

export const backupEnv = parsed.output;

if (backupEnv.DB_BACKUP === 'on') {
  if (!backupEnv.DB_BACKUP_FOLDER) {
    throw new Error(
      'DB_BACKUP_FOLDER is required when DB_BACKUP is "on" (e.g. "miamedical-prod", "miamedical-dev").',
    );
  }
  if (!backupEnv.DB_BACKUP_R2_BUCKET) {
    throw new Error(
      'DB_BACKUP_R2_BUCKET is required when DB_BACKUP is "on" (a private bucket, never the public media bucket).',
    );
  }
  if (backupEnv.DB_BACKUP_R2_BUCKET === env.R2_BUCKET) {
    throw new Error('DB_BACKUP_R2_BUCKET must differ from R2_BUCKET: the media bucket is public.');
  }
  if (!backupEnv.DB_BACKUP_R2_ACCESS_KEY_ID !== !backupEnv.DB_BACKUP_R2_SECRET_ACCESS_KEY) {
    throw new Error(
      'Set both DB_BACKUP_R2_ACCESS_KEY_ID and DB_BACKUP_R2_SECRET_ACCESS_KEY, or neither to reuse the R2_* keys.',
    );
  }
  const missing = (
    [
      ['R2_ACCOUNT_ID', env.R2_ACCOUNT_ID],
      [
        backupEnv.DB_BACKUP_R2_ACCESS_KEY_ID ? 'DB_BACKUP_R2_ACCESS_KEY_ID' : 'R2_ACCESS_KEY_ID',
        backupEnv.DB_BACKUP_R2_ACCESS_KEY_ID ?? env.R2_ACCESS_KEY_ID,
      ],
      [
        backupEnv.DB_BACKUP_R2_SECRET_ACCESS_KEY
          ? 'DB_BACKUP_R2_SECRET_ACCESS_KEY'
          : 'R2_SECRET_ACCESS_KEY',
        backupEnv.DB_BACKUP_R2_SECRET_ACCESS_KEY ?? env.R2_SECRET_ACCESS_KEY,
      ],
    ] as const
  )
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`${missing.join(', ')} required when DB_BACKUP is "on".`);
  }
}
