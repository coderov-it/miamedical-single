/**
 * Turning a notification's payload into the values its sentence wants.
 *
 * A payload carries ids, codes and ISO dates — never words — so that a row
 * written in September still reads in the language the customer is using in
 * March. That is the right storage decision and it leaves exactly one job
 * here: the codes have to become words and the dates have to become dates
 * before they are dropped into a sentence.
 *
 * Without this the feed says "Il tuo ordine MIA-2026-001011 è ora cancelled."
 * and "Il noleggio termina il 2026-09-17" — the payload showing through the
 * copy, in the middle of an otherwise translated sentence.
 *
 * ── Why this is per event type and not per key name ─────────────────────────
 * `from` and `to` mean different things in different events: order statuses in
 * `order.status_changed`, calendar dates in `rental.renewed`. A table keyed by
 * field name would format one of them wrongly, and it would do it silently.
 * So the mapping is stated per type, which is also what makes a new event's
 * omission obvious — it renders raw, in review, rather than subtly wrong.
 *
 * PURE, so `node --test` can execute it: the locale-dependent pieces arrive as
 * arguments rather than being read off the document.
 */

/** What the copy blob already carries, plus the browser's date formatter. */
export interface NotificationPresenters {
  /** `account.status.*` — order statuses, in the storefront's softer wording. */
  status: Record<string, string>;
  /** `account.paymentStatus.*`. */
  payment: Record<string, string>;
  /** Locale-aware. `customer-session.ts` has the storefront's. */
  formatDate: (iso: string) => string;
}

/** Which payload fields are calendar dates, per event type. */
const DATE_FIELDS: Record<string, readonly string[]> = {
  'order.upcoming': ['startsOn'],
  'rental.ending_soon': ['endsOn'],
  'rental.renewed': ['from', 'to'],
  'contract.unsigned_blocking': ['sentOn'],
};

/**
 * The fill values for one row.
 *
 * Unknown keys pass through untouched: a slot the payload does not carry is
 * left standing by `fill()`, and a value with no label is better shown raw
 * than blanked — one is a visible bug, the other is a missing sentence.
 */
export function notificationValues(
  type: string,
  data: Record<string, unknown>,
  presenters: NotificationPresenters,
): Record<string, string | number> {
  const dateFields = DATE_FIELDS[type] ?? [];
  const values: Record<string, string | number> = {};

  for (const [key, raw] of Object.entries(data)) {
    if (typeof raw === 'number') {
      values[key] = raw;
      continue;
    }
    if (typeof raw !== 'string') continue;

    if (dateFields.includes(key)) {
      values[key] = formatMaybeDate(raw, presenters.formatDate);
      continue;
    }

    if (type === 'order.status_changed' && (key === 'from' || key === 'to')) {
      /* `field` says which enum these two came from, and the two enums share
         members — `paid` and `refunded` are in both — so reading the label out
         of the wrong map would produce a plausible, wrong word rather than a
         missing one. */
      const map = data.field === 'paymentStatus' ? presenters.payment : presenters.status;
      values[key] = map[raw] ?? raw;
      continue;
    }

    values[key] = raw;
  }

  return values;
}

/**
 * `Intl` on a valid date, the original string otherwise.
 *
 * A payload written by a newer server, or a date the browser cannot parse,
 * must not become "Invalid Date" in the middle of a sentence — the raw value
 * is at least true.
 */
function formatMaybeDate(value: string, format: (iso: string) => string): string {
  if (Number.isNaN(Date.parse(value))) return value;
  const formatted = format(value);
  return formatted === 'Invalid Date' ? value : formatted;
}
