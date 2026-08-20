/**
 * The product page's rental arithmetic, in the browser.
 *
 * THIS DUPLICATES `resolvePeriod` AND `convertDuration` FROM `@mia/pricing`, and
 * that is the one reason it exists: those run on the server and this runs in the
 * page. Keep the two identical — UTC epoch milliseconds throughout, so a rental
 * that crosses a DST boundary is still exactly N days and the return date the
 * customer reads matches the one the order records.
 *
 * Nothing here is authoritative. `/checkout/` and `/carrello/` both re-resolve
 * the request against the catalogue, and the phone call settles the real price.
 */

const HOUR = 3_600_000;
const DAY = 86_400_000;

/** A rental package as the buy box's radio carries it. */
export interface ChosenPackage {
  label: string;
  detail: string;
  price: number;
  duration: number;
  unit: string;
}

export interface DerivedPeriod {
  endDate: string;
  endTime: string;
  duration: number;
  unit: string;
}

/**
 * The package the customer picked, or null.
 *
 * Read from the DOM on every call rather than cached: the estimate, the calendar
 * and the form gate all ask independently, and a stale answer between them would
 * show a return date for a package nobody has chosen any more.
 */
export function checkedPackageInput(form: HTMLFormElement): HTMLInputElement | null {
  return form.querySelector<HTMLInputElement>('[data-est-kind="package"]:checked');
}

export function readChosenPackage(form: HTMLFormElement): ChosenPackage | null {
  const input = checkedPackageInput(form);
  if (!input) return null;
  return {
    label: input.dataset.estLabel ?? '',
    detail: input.dataset.estDetail ?? '',
    price: Number(input.dataset.estPrice ?? '0'),
    duration: Number(input.dataset.estDuration ?? '0'),
    unit: input.dataset.estUnit ?? 'day',
  };
}

/**
 * Where the rental ends: the start plus the package's duration.
 *
 * Null whenever the pair is incomplete — no date, no package, or an hourly
 * package with no time of day. The callers all treat null as "nothing to show
 * yet" rather than as an error, because that is what it is.
 */
export function derivePeriod(
  startDate: string,
  startTime: string,
  unit: string,
  duration: number,
): DerivedPeriod | null {
  if (!startDate || !duration) return null;

  const [year, month, day] = startDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  const midnight = Date.UTC(year, month - 1, day);

  if (unit !== 'hour') {
    return {
      endDate: new Date(midnight + duration * DAY).toISOString().slice(0, 10),
      endTime: '',
      duration,
      unit,
    };
  }

  if (!startTime) return null;
  const [hours, minutes] = startTime.split(':').map(Number);
  if (hours === undefined || minutes === undefined) return null;

  const iso = new Date(midnight + hours * HOUR + minutes * 60_000 + duration * HOUR).toISOString();
  return { endDate: iso.slice(0, 10), endTime: iso.slice(11, 16), duration, unit };
}

/** A package duration read in another unit, rounded up — mirrors `convertDuration`. */
export function convertDuration(duration: number, from: string, to: string): number {
  if (from === to) return duration;
  if (from === 'hour') return Math.ceil(duration / 24);
  return duration * 24;
}

/**
 * Dates are handled as local Y-M-D triples, never through `Date.parse`.
 *
 * Parsing "YYYY-MM-DD" yields UTC midnight, which in Rome's summer offset is the
 * previous day locally — enough to land the calendar's range highlight one cell
 * to the left of where the customer clicked.
 */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}
