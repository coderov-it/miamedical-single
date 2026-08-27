UPDATE "orders"
SET "payment_status" = 'paid'
WHERE "status" IN ('paid', 'fulfilled')
  AND "payment_status" IN ('unpaid', 'authorized')
  AND "placed_at" IS NOT NULL;
