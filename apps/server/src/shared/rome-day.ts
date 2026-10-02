import { gte, lt, sql } from '@mia/db';
import type { AnyPgColumn, SQL } from '@mia/db';

/**
 * A `from → to` date filter on a timestamp column, as half-open Rome days.
 *
 * The operator picks calendar days in Italy. Casting the column to a date
 * (`placed_at::date`) answers in the database's day, UTC by default, and hides
 * the column from its index. Comparing the raw column against Rome midnights
 * does neither:
 *
 *   from 2026-10-01, to 2026-10-01 (CEST, UTC+2)
 *   → placed_at >= 2026-09-30 22:00 UTC  AND  placed_at < 2026-10-01 22:00 UTC
 *   order placed 2 Oct 00:30 Rome (1 Oct 22:30 UTC) → outside: it is a 2 Oct order
 *
 * The bounds are constants to the planner, so `orders_placed_at_idx` serves the
 * range. Daylight saving is Postgres's job: `AT TIME ZONE` picks +1 or +2 per day.
 */
export function romeDayRange(column: AnyPgColumn, from?: string, to?: string): SQL[] {
  const clauses: SQL[] = [];
  if (from) clauses.push(gte(column, romeMidnight(sql`${from}::date`)));
  if (to) clauses.push(lt(column, romeMidnight(sql`(${to}::date + 1)`)));
  return clauses;
}

function romeMidnight(day: SQL): SQL {
  return sql`((${day})::timestamp AT TIME ZONE 'Europe/Rome')`;
}
