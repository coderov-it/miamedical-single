import { t } from '~/lib/ui-text';

/** `2026-11-23T12:00:00.000Z` -> `2026-11-23 12:00 UTC`. */
export const formatUtc = (iso: string) => `${iso.slice(0, 16).replace('T', ' ')} UTC`;

/** Whole minutes left until `iso`; 0 once under a minute or past. */
export const minutesUntil = (iso: string, now: number) =>
  Math.max(0, Math.floor((new Date(iso).getTime() - now) / 60_000));

/** The duration alone: "1 h 5 min", "5 min" or "less than a minute". */
export function relativeUntil(iso: string, now: number): string {
  const totalMinutes = minutesUntil(iso, now);
  if (totalMinutes < 1) return t('settings.nextInSeconds');
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return t('settings.nextInMinutes', { minutes });
  return t('settings.nextInHoursMinutes', { hours, minutes });
}
