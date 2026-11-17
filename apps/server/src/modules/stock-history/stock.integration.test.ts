/**
 * Stock history against a real Postgres. Skipped unless MIA_DB_TESTS=1.
 *
 *   MIA_DB_TESTS=1 node --test --experimental-strip-types src/modules/stock-history/stock.integration.test.ts
 *
 * Every scenario but the last runs in a transaction that is rolled back; the
 * concurrency one commits and then deletes everything it made, and asserts that
 * nothing is left. See /docs/code/stock-history.md.
 */

import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';

import { createDatabase, type Database, sql } from '@mia/db';

import { setStockContext } from '../../shared/stock-context.ts';
import { insertOrder, type NewOrderData } from '../orders/repo.ts';
import { stockHistory } from './service.ts';
import { applyStockMoves } from '../orders/stock.ts';
import { applyTransition } from '../orders/transition-repo.ts';
import * as catalogRepo from '../products/catalog/repo.ts';

try {
  process.loadEnvFile(new URL('../../../../../.env', import.meta.url));
} catch {
  /* DATABASE_URL may come from the shell instead. */
}

const enabled = process.env.MIA_DB_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const db = enabled ? createDatabase({ max: 1 }) : undefined;
type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];
const ROLLBACK = Symbol('rollback');

async function rolledBack(body: (tx: Tx) => Promise<void>): Promise<void> {
  assert.ok(db);
  try {
    await db.transaction(async (tx) => {
      await body(tx);
      throw ROLLBACK;
    });
  } catch (error) {
    if (error !== ROLLBACK) throw error;
  }
}

/** A nested `db.transaction` on a Transaction is a savepoint, so the real writers run inside ours. */
const asDb = (tx: Tx) => tx as unknown as Database;

async function createProduct(tx: Tx, stock: number): Promise<string> {
  const rows = await tx.execute<{ id: string }>(sql`
    INSERT INTO products (category_id, status, pricing_mode, base_price, stock)
    VALUES ((SELECT id FROM categories LIMIT 1), 'active', 'fixed', '10.00', ${stock})
    RETURNING id`);
  return rows[0]!.id;
}

async function createOrder(
  tx: Tx,
  productId: string,
  qty: number,
  o: { status: string; payment: string; taken: boolean; mode: 'rental' | 'fixed' },
): Promise<string> {
  const rows = await tx.execute<{ id: string }>(sql`
    INSERT INTO orders (number, email, subtotal, total, status, payment_status, stock_taken)
    VALUES (${`TEST-${crypto.randomUUID()}`}, 'stock-test@example.invalid', '10.00', '10.00',
            ${o.status}, ${o.payment}, ${o.taken}) RETURNING id`);
  const id = rows[0]!.id;
  await tx.execute(sql`
    INSERT INTO order_items (order_id, product_id, product_title, quantity, unit_price, total, configuration)
    VALUES (${id}, ${productId}, 'Test', ${qty}, '10.00', '10.00',
            ${JSON.stringify({ pricingMode: o.mode })}::jsonb)`);
  return id;
}

type Movement = {
  reason: string;
  delta: number;
  stock_after: number;
  order_id: string | null;
  actor_admin_user_id: string | null;
  note: string | null;
};

async function movements(tx: Tx, productId: string): Promise<Movement[]> {
  return [
    ...(await tx.execute<Movement>(sql`
      SELECT reason, delta, stock_after, order_id, actor_admin_user_id, note
      FROM stock_movements WHERE product_id = ${productId} ORDER BY id`)),
  ];
}

/** The ledger rule: stock equals the sum of the deltas, and each row's stock_after follows the last. */
async function assertLedger(tx: Tx, productId: string) {
  const rows = await movements(tx, productId);
  const [product] = await tx.execute<{ stock: number }>(
    sql`SELECT stock FROM products WHERE id = ${productId}`,
  );
  assert.equal(
    rows.reduce((sum, row) => sum + row.delta, 0),
    product!.stock,
  );
  let running = 0;
  for (const row of rows) {
    running += row.delta;
    assert.equal(row.stock_after, running);
  }
}

const transition = (
  tx: Tx,
  orderId: string,
  from: string,
  to: string,
  actor: string | null = null,
) =>
  applyTransition(asDb(tx), {
    orderId,
    field: 'status',
    fromValue: from,
    toValue: to,
    note: null,
    actorAdminUserId: actor,
  });

function placement(productId: string, quantity: number): NewOrderData {
  return {
    customerAccountId: null,
    customerLinkStatus: 'unverified',
    firstName: 'T',
    lastName: 'T',
    email: 'stock-test@example.invalid',
    phone: '1',
    customerType: 'tourist',
    codiceFiscale: null,
    partitaIva: null,
    currency: 'EUR',
    subtotal: '10.00',
    shippingTotal: '0.00',
    total: '10.00',
    shippingAddress: null,
    billingAddress: null,
    delivery: { method: 'storePickup' },
    notes: null,
    paymentDueAt: null,
    items: [
      {
        productId,
        productTitle: 'Test',
        quantity,
        unitPrice: '10.00',
        total: '10.00',
        configuration: { pricingMode: 'fixed' },
      },
    ],
  };
}

describe(
  'stock history (database)',
  { skip: !enabled && 'set MIA_DB_TESTS=1 and DATABASE_URL' },
  () => {
    after(async () => {
      await (db?.$client as { end?: () => Promise<void> } | undefined)?.end?.();
    });

    test('placement writes order_placed with the order id', () =>
      rolledBack(async (tx) => {
        const product = await createProduct(tx, 10);
        const order = await insertOrder(asDb(tx), placement(product, 3));
        const rows = await movements(tx, product);
        assert.equal(rows[0]!.reason, 'product_created');
        assert.deepEqual(
          [rows[1]!.reason, rows[1]!.delta, rows[1]!.stock_after, rows[1]!.order_id],
          ['order_placed', -3, 7, order.id],
        );
        await assertLedger(tx, product);
      }));

    test('cancelling a pending order puts the units back as order_cancelled', () =>
      rolledBack(async (tx) => {
        const product = await createProduct(tx, 10);
        const order = await insertOrder(asDb(tx), placement(product, 3));
        await transition(tx, order.id, 'pending', 'cancelled');
        const last = (await movements(tx, product)).at(-1)!;
        assert.deepEqual(
          [last.reason, last.delta, last.order_id],
          ['order_cancelled', 3, order.id],
        );
        await assertLedger(tx, product);
      }));

    test('paying a legacy order (stock not yet taken) writes order_paid', () =>
      rolledBack(async (tx) => {
        const product = await createProduct(tx, 10);
        const order = await createOrder(tx, product, 2, {
          status: 'pending',
          payment: 'unpaid',
          taken: false,
          mode: 'fixed',
        });
        await transition(tx, order, 'pending', 'paid');
        const last = (await movements(tx, product)).at(-1)!;
        assert.deepEqual([last.reason, last.delta, last.order_id], ['order_paid', -2, order]);
        await assertLedger(tx, product);
      }));

    test('a rental marked fulfilled writes rental_returned', () =>
      rolledBack(async (tx) => {
        const product = await createProduct(tx, 5);
        const order = await createOrder(tx, product, 2, {
          status: 'paid',
          payment: 'paid',
          taken: true,
          mode: 'rental',
        });
        await transition(tx, order, 'paid', 'fulfilled');
        const last = (await movements(tx, product)).at(-1)!;
        assert.deepEqual([last.reason, last.delta, last.order_id], ['rental_returned', 2, order]);
        await assertLedger(tx, product);
      }));

    test('a manual edit records the actor and the note; an unchanged stock writes nothing', () =>
      rolledBack(async (tx) => {
        const [admin] = await tx.execute<{ id: string }>(sql`SELECT id FROM admin_users LIMIT 1`);
        assert.ok(admin, 'needs one admin user in the dev database');
        const product = await createProduct(tx, 10);
        await catalogRepo.update(
          asDb(tx),
          product,
          { stock: 7 },
          { actorAdminUserId: admin.id, note: 'Inventario' },
        );
        const last = (await movements(tx, product)).at(-1)!;
        assert.deepEqual(
          [last.reason, last.delta, last.stock_after, last.actor_admin_user_id, last.note],
          ['manual_adjustment', -3, 7, admin.id, 'Inventario'],
        );
        await tx.execute(sql`UPDATE products SET stock = 7 WHERE id = ${product}`);
        assert.equal((await movements(tx, product)).length, 2);
        await assertLedger(tx, product);
      }));

    test('the context is consumed: a second write that names nothing is unknown', () =>
      rolledBack(async (tx) => {
        const product = await createProduct(tx, 10);
        await setStockContext(tx, { reason: 'manual_adjustment', note: 'first' });
        await tx.execute(sql`UPDATE products SET stock = 9 WHERE id = ${product}`);
        await tx.execute(sql`UPDATE products SET stock = 8 WHERE id = ${product}`);
        const [, first, second] = await movements(tx, product);
        assert.deepEqual([first!.reason, first!.note], ['manual_adjustment', 'first']);
        assert.deepEqual([second!.reason, second!.note], ['unknown', null]);
        await assertLedger(tx, product);
      }));

    test('an out-of-stock placement rolls back and leaves no movement behind', () =>
      rolledBack(async (tx) => {
        const product = await createProduct(tx, 2);
        await assert.rejects(
          asDb(tx).transaction(async (inner) => {
            await insertOrder(inner as unknown as Database, placement(product, 3));
          }),
          (e: { status?: number }) => e.status === 409,
        );
        assert.deepEqual(
          (await movements(tx, product)).map((m) => m.reason),
          ['product_created'],
        );
        await assertLedger(tx, product);
      }));

    test('the read model: closing stock per day, null before the first movement, newest first', () =>
      rolledBack(async (tx) => {
        const product = await createProduct(tx, 10);
        await insertOrder(asDb(tx), placement(product, 3));
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(
          new Date(),
        );
        const result = await stockHistory(asDb(tx), product, {
          from: '2020-01-01',
          to: today,
          page: 1,
        });
        assert.equal(result.series[0]!.stock, null);
        assert.deepEqual(result.series.at(-1), { day: today, stock: 7 });
        assert.deepEqual(
          result.movements.map((m) => [m.reason, m.delta, m.stockAfter]),
          [
            ['order_placed', -3, 7],
            ['product_created', 10, 10],
          ],
        );
        assert.equal(typeof result.movements[0]!.id, 'string');
        assert.ok(result.movements[0]!.order?.number.startsWith('MIA-'));
        assert.equal(result.movementsMeta.total, 2);
        assert.equal(result.product.stock, 7);
      }));

    test('concurrent placement and manual edit: both rows, in order, ledger intact', async () => {
      assert.ok(db);
      const dbA = createDatabase({ max: 1 });
      const dbB = createDatabase({ max: 1 });
      let product: string | undefined;
      let order: string | undefined;
      try {
        await db.transaction(async (tx) => {
          product = await createProduct(tx, 10);
          order = await createOrder(tx, product, 2, {
            status: 'pending',
            payment: 'unpaid',
            taken: true,
            mode: 'fixed',
          });
        });
        const [productId, orderId] = [product!, order!];
        let release: () => void = () => {};
        const hold = new Promise<void>((resolve) => (release = resolve));
        let wrote: () => void = () => {};
        const aWrote = new Promise<void>((resolve) => (wrote = resolve));

        const a = dbA.transaction(async (tx) => {
          await applyStockMoves(
            tx,
            [
              {
                productId,
                productTitle: 'Test',
                quantity: 2,
                configuration: { pricingMode: 'fixed' },
              },
            ],
            null,
            'pending',
            false,
            { orderId, actorAdminUserId: null },
          );
          wrote();
          await hold;
        });
        await aWrote;
        const b = catalogRepo.update(
          dbB,
          productId,
          { stock: 20 },
          { actorAdminUserId: null, note: 'Carico' },
        );

        let blocked = false;
        for (let i = 0; i < 100 && !blocked; i += 1) {
          const rows = await db.execute<{ n: number }>(
            sql`SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND datname = current_database()`,
          );
          blocked = rows[0]!.n > 0;
          if (!blocked) await new Promise((r) => setTimeout(r, 20));
        }
        assert.ok(blocked, 'B never queued behind A');
        release();
        await Promise.all([a, b]);

        await db.transaction(async (tx) => {
          const rows = await movements(tx, productId);
          assert.deepEqual(
            rows.map((m) => [m.reason, m.delta, m.stock_after]),
            [
              ['product_created', 10, 10],
              ['order_placed', -2, 8],
              ['manual_adjustment', 12, 20],
            ],
          );
          await assertLedger(tx, productId);
        });
      } finally {
        if (order) await db.execute(sql`DELETE FROM orders WHERE id = ${order}`);
        if (product) await db.execute(sql`DELETE FROM products WHERE id = ${product}`);
        const left = await db.execute<{ n: number }>(sql`
        SELECT ((SELECT count(*) FROM products WHERE id = ${product ?? null})
              + (SELECT count(*) FROM stock_movements WHERE product_id = ${product ?? null})
              + (SELECT count(*) FROM orders WHERE id = ${order ?? null}))::int AS n`);
        await (dbA.$client as { end: () => Promise<void> }).end();
        await (dbB.$client as { end: () => Promise<void> }).end();
        assert.equal(left[0]!.n, 0, 'the throwaway rows were not cleaned up');
      }
    });
  },
);
