/**
 * One-off: moves legacy rental orders to `delivered`.
 *
 * Run ONCE, after `pnpm db:migrate` has applied 0026. Re-running is safe: only
 * orders still `paid` are touched, so a second run moves nothing.
 *
 *   pnpm --filter @mia/server legacy:delivered
 *
 * A `paid` order with a rental line whose booked start date has passed is with
 * the customer, so it becomes `delivered`. Booked dates are not shifted. Each
 * move writes one `order_status_events` row. The move cannot live in 0026
 * because enum values added there cannot be used in that same transaction.
 */
import { createDatabase, sql } from '@mia/db';

import { env } from '../src/config/env.ts';

const db = createDatabase({ url: env.DATABASE_URL, logger: false });

const MOVE_LEGACY_RENTALS = sql`
  WITH moved AS (
    UPDATE "orders" o
    SET "status" = 'delivered'
    WHERE o."status" = 'paid'
      AND EXISTS (
        SELECT 1
        FROM "order_items" oi
        WHERE oi."order_id" = o."id"
          AND oi."configuration"->>'pricingMode' = 'rental'
          AND (oi."configuration"->'rental'->>'startDate')::date
              <= (now() AT TIME ZONE 'Europe/Rome')::date
      )
    RETURNING o."id"
  )
  INSERT INTO "order_status_events" ("order_id", "field", "from_value", "to_value", "note", "actor_admin_user_id")
  SELECT "id", 'status', 'paid', 'delivered',
    'Set by the delivery-flow update: the booked start had already passed.', NULL
  FROM moved
  RETURNING "id"
`;

console.log('Moving legacy rental orders to delivered…');

try {
  const moved = await db.transaction(async (tx) => {
    const rows = await tx.execute(MOVE_LEGACY_RENTALS);
    return rows.length;
  });
  console.log(`  ✓ ${moved} order(s) moved to delivered`);
  process.exit(0);
} catch (error) {
  console.error('Legacy move failed; nothing was changed.', error);
  process.exit(1);
}
