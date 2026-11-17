/** Money and dates as this page's language writes them (`<html lang>`), never a literal locale. */
import { documentLocale } from '../locale';

export function money(amount: string, currency: string): string {
  return new Intl.NumberFormat(documentLocale(), { style: 'currency', currency }).format(
    Number(amount),
  );
}

/** `2026-12-01` → "1 dic 2026". Noon, so no timezone moves the day. */
export function day(iso: string): string {
  return new Intl.DateTimeFormat(documentLocale(), { dateStyle: 'medium' }).format(
    new Date(`${iso}T12:00:00`),
  );
}
