import path from 'node:path';

/**
 * Where a backup lives (local disk, and the dedicated R2 bucket) and which day folders are old. Pure; no I/O.
 * Walkthrough: docs/code/db-backup.md.
 *
 *   scheduled  folder miamedical-prod, now 2026-11-23T06:30Z → slot 04:00Z
 *              miamedical-prod/2026-11-23/miamedical-prod_2026-11-23_04-00Z.dump
 *   manual     name before-price-update, now 2026-11-23T14:32:10Z
 *              miamedical-prod/manual_2026-11-23/before-price-update_2026-11-23_14-32Z.dump
 */
export const SLOT_HOURS = 4;
export const KEEP_DAYS = 10;

/** One backup file: its name, where it sits on disk, and its key in the bucket. */
export interface BackupTarget {
  fileName: string;
  localPath: string;
  r2Key: string;
}

type Where = { localDir: string; folder: string };

/** UTC hour floored to a multiple of SLOT_HOURS. */
export function slotStart(now: Date): Date {
  const hour = now.getUTCHours() - (now.getUTCHours() % SLOT_HOURS);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour));
}

/** The start of the slot after the one `now` is in: when the next scheduled backup runs. */
export function nextSlotStart(now: Date): Date {
  return new Date(slotStart(now).getTime() + SLOT_HOURS * 3_600_000);
}

export function dayName(slot: Date): string {
  return slot.toISOString().slice(0, 10);
}

export function fileName(folder: string, slot: Date): string {
  const hour = String(slot.getUTCHours()).padStart(2, '0');
  return `${folder}_${dayName(slot)}_${hour}-00Z.dump`;
}

export function localPath({ localDir, folder }: Where, slot: Date): string {
  return path.join(localDir, folder, dayName(slot), fileName(folder, slot));
}

export function r2Key(folder: string, slot: Date): string {
  return `${folder}/${dayName(slot)}/${fileName(folder, slot)}`;
}

export function scheduledTarget(backup: Where, slot: Date): BackupTarget {
  return {
    fileName: fileName(backup.folder, slot),
    localPath: localPath(backup, slot),
    r2Key: r2Key(backup.folder, slot),
  };
}

/** A manual backup: its own `manual_<day>` folder, which pruning never touches. */
export function manualTarget(backup: Where, name: string, now: Date): BackupTarget {
  const time = now.toISOString().slice(11, 16).replace(':', '-');
  const file = `${name}_${dayName(now)}_${time}Z.dump`;
  const day = `manual_${dayName(now)}`;
  return {
    fileName: file,
    localPath: path.join(backup.localDir, backup.folder, day, file),
    r2Key: `${backup.folder}/${day}/${file}`,
  };
}

/** Day folders strictly older than the oldest kept day; anything not YYYY-MM-DD (manual_ included) is ignored. */
export function expiredDays(names: string[], now: Date): string[] {
  const oldestKept = dayName(new Date(now.getTime() - (KEEP_DAYS - 1) * 86_400_000));
  return names.filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name) && name < oldestKept);
}
