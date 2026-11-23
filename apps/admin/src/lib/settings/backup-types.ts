/** One row of the backup log as `GET /api/admin/backups` returns it (dates are ISO strings). */
export interface BackupRun {
  id: string;
  kind: 'scheduled' | 'manual';
  folder: string;
  name: string | null;
  fileName: string;
  r2Key: string;
  sizeBytes: number | null;
  status: 'running' | 'succeeded' | 'failed';
  error: string | null;
  attempts: number;
  startedAt: string;
  finishedAt: string | null;
  uploadedAt: string | null;
  downloadable: boolean;
}

export interface BackupOverview {
  enabled: boolean;
  folder: string | null;
  bucket: string | null;
  /** ISO start of the next scheduled slot; null while backups are off. */
  nextScheduledAt: string | null;
  runs: BackupRun[];
}

/** Same rule as the server's `ManualBackupSchema`. */
export const BACKUP_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,59}$/;

/** One calendar day inside a folder: scheduled runs, plus the manual ones kept in `manual_<day>/`. */
export interface BackupDay {
  day: string;
  scheduled: BackupRun[];
  manual: BackupRun[];
  totalBytes: number;
}

export type BackupDisplayState = 'dumping' | 'uploading' | 'done' | 'notInBucket' | 'failed';

/**
 * What a file row shows. The job marks a row `succeeded` when the dump is done
 * and sets `uploadedAt` a moment later, so `succeeded` alone still means "uploading".
 *
 *   running                          -> dumping
 *   succeeded, uploadedAt            -> done
 *   succeeded, no uploadedAt, error  -> notInBucket (the upload failed)
 *   succeeded, no uploadedAt         -> uploading
 */
export function displayState(run: BackupRun): BackupDisplayState {
  if (run.status === 'running') return 'dumping';
  if (run.status === 'failed') return 'failed';
  if (run.uploadedAt) return 'done';
  if (run.error) return 'notInBucket';
  return 'uploading';
}

/** True while the dump runs or the upload to R2 is still pending. */
export const isInFlight = (run: BackupRun) => {
  const state = displayState(run);
  return state === 'dumping' || state === 'uploading';
};

/**
 * Groups this instance's log by `r2Key`, which is always `<folder>/<dayFolder>/<fileName>`
 * with `dayFolder` = `YYYY-MM-DD` or `manual_YYYY-MM-DD`.
 *
 *   miamedical/2026-11-23/a.dump         -> day 2026-11-23, scheduled
 *   miamedical/manual_2026-11-23/b.dump  -> day 2026-11-23, manual
 *
 * Days newest first and runs newest first inside each list.
 */
export function buildBackupDays(runs: BackupRun[]): BackupDay[] {
  const days = new Map<string, BackupDay>();
  for (const run of runs) {
    const dayFolder = run.r2Key.split('/')[1];
    if (!dayFolder) continue;
    const isManual = dayFolder.startsWith('manual_');
    const day = isManual ? dayFolder.slice('manual_'.length) : dayFolder;
    const entry = days.get(day) ?? { day, scheduled: [], manual: [], totalBytes: 0 };
    (isManual ? entry.manual : entry.scheduled).push(run);
    entry.totalBytes += run.sizeBytes ?? 0;
    days.set(day, entry);
  }
  const newestFirst = (a: BackupRun, b: BackupRun) => b.startedAt.localeCompare(a.startedAt);
  return [...days.values()]
    .map((d) => ({
      ...d,
      scheduled: d.scheduled.sort(newestFirst),
      manual: d.manual.sort(newestFirst),
    }))
    .sort((a, b) => b.day.localeCompare(a.day));
}
