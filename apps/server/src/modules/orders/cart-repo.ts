/** DB queries for the admin's cart views. Plain records out — no auth, no DTOs. */

import type { Database } from '@mia/db';
import { and, asc, count, desc, eq, ilike, lte, or, sql } from '@mia/db';
import { cartItems, carts, customerAccounts, products, productTranslations, SOURCE_LANGUAGE } from '@mia/db/schema';

import { multiply, sumMoney } from './mapper.ts';
import type { CartAggregate, CartItemRecord, CartListFilters, CartSummaryRecord } from './types.ts';

// --- carts -----------------------------------------------------------------

function cartWhere(filters: CartListFilters, now: Date) {
  const clauses = [];

  if (filters.q) clauses.push(ilike(carts.token, `%${filters.q}%`));
  // A cart with no `expiresAt` never expires, so it is never abandoned — and
  // `lte(null)` would be NULL, not false, which is why `active` needs the
  // explicit IS NULL arm.
  if (filters.state === 'abandoned') clauses.push(lte(carts.expiresAt, now));
  if (filters.state === 'active') {
    clauses.push(or(sql`${carts.expiresAt} IS NULL`, sql`${carts.expiresAt} > ${now}`));
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

/**
 * Line count and subtotal come back with the row: a cart is only interesting
 * as "how much is sitting in it", and fetching that per row in the service
 * would be one query per cart.
 */
export async function findCarts(
  db: Database,
  filters: CartListFilters,
  now = new Date(),
): Promise<{ rows: CartSummaryRecord[]; total: number }> {
  const where = cartWhere(filters, now);

  // Aggregated over a join rather than a correlated subquery in `sql`: drizzle
  // renders a bare `${table.column}` UNQUALIFIED when the outer statement has a
  // single table, so a correlated `cart_id = id` would bind inside cart_items.
  // `users.id` joins the GROUP BY so Postgres can carry `users.email` through.
  const subtotal = sql<string>`COALESCE(
    SUM(${cartItems.unitPrice} * ${cartItems.quantity}), 0
  )::numeric(12,2)::text`;

  const [rows, totals] = await Promise.all([
    db
      .select({
        cart: carts,
        itemCount: count(cartItems.id),
        subtotal,
        customerEmail: customerAccounts.email,
      })
      .from(carts)
      .leftJoin(customerAccounts, eq(carts.customerAccountId, customerAccounts.id))
      .leftJoin(cartItems, eq(cartItems.cartId, carts.id))
      .where(where)
      .groupBy(carts.id, customerAccounts.id)
      .orderBy(desc(carts.updatedAt))
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db.select({ value: count() }).from(carts).where(where),
  ]);

  return {
    rows: rows.map((row) => ({
      ...row.cart,
      itemCount: row.itemCount,
      subtotal: row.subtotal,
      customerEmail: row.customerEmail,
    })),
    total: totals[0]?.value ?? 0,
  };
}

export async function findCartById(db: Database, id: string): Promise<CartAggregate | undefined> {
  const cart = await db.query.carts.findFirst({ where: eq(carts.id, id) });
  if (!cart) return undefined;

  const owner = cart.customerAccountId
    ? await db.query.customerAccounts.findFirst({
        where: eq(customerAccounts.id, cart.customerAccountId),
        columns: { email: true },
      })
    : undefined;

  // Unlike an order line, a cart line holds no snapshot — the title has to be
  // read live, through the product, from the Italian translation (the mandatory
  // one). A left join on the translation keeps the line visible even for a
  // product that somehow has none.
  const rows = await db
    .select({
      item: cartItems,
      title: productTranslations.title,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(
      productTranslations,
      and(
        eq(productTranslations.productId, products.id),
        eq(productTranslations.languageCode, SOURCE_LANGUAGE),
      ),
    )
    .where(eq(cartItems.cartId, id))
    .orderBy(asc(cartItems.createdAt));

  /* The Italian row is mandatory on every product, so the fallback is a
     belt-and-braces default rather than a case anyone should see. */
  const items: CartItemRecord[] = rows.map((row) => ({
    ...row.item,
    productTitle: row.title ?? 'Prodotto',
  }));

  return {
    ...cart,
    items,
    itemCount: items.length,
    subtotal: sumMoney(items.map((item) => multiply(item.unitPrice, item.quantity))),
    customerEmail: owner?.email ?? null,
  };
}
