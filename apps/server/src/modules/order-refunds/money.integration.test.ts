/**
 * Money invariants against a real Postgres. Skipped unless MIA_DB_TESTS=1.
 *
 *   MIA_DB_TESTS=1 node --test --experimental-strip-types src/modules/order-refunds/money.integration.test.ts
 *
 * Every scenario but the concurrency one runs inside a transaction that is
 * rolled back, so nothing is ever committed. The concurrency scenario needs two
 * real commits; it deletes its throwaway order in a `finally` and then asserts no
 * row of it is left. See /docs/code/order-money.md.
 */

import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';

import { createDatabase, sql } from '@mia/db';

import { recordRefundInTx, refundRemainingInTx } from './write.ts';

try {
  process.loadEnvFile(new URL('../../../../../.env', import.meta.url));
} catch {
  /* DATABASE_URL may come from the shell instead. */
}

const enabled = process.env.MIA_DB_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const db = enabled ? createDatabase({ max: 1 }) : undefined;
type Tx = Parameters<Parameters<NonNullable<typeof db>['transaction']>[0]>[0];

const ROLLBACK = Symbol('rollback');

/** Runs `body` in a transaction and always rolls it back. */
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

async function createOrder(tx: Tx, total = '100.00', paymentStatus = 'paid'): Promise<string> {
  const rows = await tx.execute<{ id: string }>(sql`
    INSERT INTO orders (number, email, subtotal, total, status, payment_status)
    VALUES (${`TEST-${crypto.randomUUID()}`}, 'money-test@example.invalid', ${total}, ${total},
            'paid', ${paymentStatus})
    RETURNING id`);
  return rows[0]!.id;
}

async function createExtension(tx: Tx, orderId: string, amount: string, paid = false) {
  const rows = await tx.execute<{ id: string }>(sql`
    INSERT INTO rental_extensions (order_id, from_date, to_date, days, amount, line_amounts, paid_at)
    VALUES (${orderId}, '2030-01-01', '2030-01-08', 7, ${amount}, '{}'::jsonb,
            ${paid ? sql`now()` : sql`NULL`})
    RETURNING id`);
  return rows[0]!.id;
}

async function money(tx: Tx, orderId: string) {
  const rows = await tx.execute<{
    extension_total: string;
    refunded_total: string;
    net_total: string;
    payment_status: string;
  }>(
    sql`SELECT extension_total, refunded_total, net_total, payment_status FROM orders WHERE id = ${orderId}`,
  );
  return rows[0]!;
}

const insertRefund = (tx: Tx, orderId: string, amount: string) =>
  tx.execute(
    sql`INSERT INTO order_refunds (order_id, amount, reason) VALUES (${orderId}, ${amount}, 'test')`,
  );

/** Expect `statement` to fail with SQLSTATE `code`, without poisoning the outer transaction. */
async function expectDbError(tx: Tx, code: string, statement: () => Promise<unknown>) {
  await assert.rejects(
    tx.transaction(async (inner) => {
      void inner;
      await statement();
    }),
    (error: unknown) => {
      const e = error as { code?: string; cause?: { code?: string } };
      return (e.cause?.code ?? e.code) === code;
    },
  );
}

describe(
  'order money (database)',
  { skip: !enabled && 'set MIA_DB_TESTS=1 and DATABASE_URL' },
  () => {
    after(async () => {
      await (db?.$client as { end?: () => Promise<void> } | undefined)?.end?.();
    });

    test('partial refund lowers the net', () =>
      rolledBack(async (tx) => {
        const id = await createOrder(tx, '100.00');
        await insertRefund(tx, id, '12.50');
        const m = await money(tx, id);
        assert.deepEqual([m.refunded_total, m.net_total], ['12.50', '87.50']);
      }));

    test('refunding down to exactly zero is allowed', () =>
      rolledBack(async (tx) => {
        const id = await createOrder(tx, '100.00');
        await insertRefund(tx, id, '60.00');
        await insertRefund(tx, id, '40.00');
        assert.equal((await money(tx, id)).net_total, '0.00');
      }));

    test('the database rejects an over-refund', () =>
      rolledBack(async (tx) => {
        const id = await createOrder(tx, '100.00');
        await insertRefund(tx, id, '100.00');
        await expectDbError(tx, '23514', () => insertRefund(tx, id, '0.01'));
      }));

    test('a refund row cannot be edited, but can be re-pointed by set null', () =>
      rolledBack(async (tx) => {
        const id = await createOrder(tx, '100.00');
        await insertRefund(tx, id, '10.00');
        await expectDbError(tx, '23001', () =>
          tx.execute(sql`UPDATE order_refunds SET amount = '1.00' WHERE order_id = ${id}`),
        );
        await expectDbError(tx, '23001', () =>
          tx.execute(sql`UPDATE order_refunds SET reason = 'other' WHERE order_id = ${id}`),
        );
        await expectDbError(tx, '23514', () =>
          tx.execute(
            sql`INSERT INTO order_refunds (order_id, amount, reason) VALUES (${id}, '0.00', 'x')`,
          ),
        );
      }));

    test('a paid extension raises the net; an unpaid one does not', () =>
      rolledBack(async (tx) => {
        const id = await createOrder(tx, '100.00');
        const ext = await createExtension(tx, id, '30.00');
        assert.equal((await money(tx, id)).net_total, '100.00');
        await tx.execute(sql`UPDATE rental_extensions SET paid_at = now() WHERE id = ${ext}`);
        const m = await money(tx, id);
        assert.deepEqual([m.extension_total, m.net_total], ['30.00', '130.00']);
      }));

    test('a paid extension that is cancelled keeps counting', () =>
      rolledBack(async (tx) => {
        const id = await createOrder(tx, '100.00');
        const ext = await createExtension(tx, id, '30.00', true);
        await tx.execute(
          sql`UPDATE rental_extensions SET status = 'cancelled', cancelled_at = now() WHERE id = ${ext}`,
        );
        assert.equal((await money(tx, id)).net_total, '130.00');
        await insertRefund(tx, id, '30.00');
        assert.equal((await money(tx, id)).net_total, '100.00');
      }));

    test('changing a paid extension amount recomputes the totals', () =>
      rolledBack(async (tx) => {
        const id = await createOrder(tx, '100.00');
        const ext = await createExtension(tx, id, '30.00', true);
        await tx.execute(sql`UPDATE rental_extensions SET amount = '45.00' WHERE id = ${ext}`);
        assert.equal((await money(tx, id)).extension_total, '45.00');
        await tx.execute(sql`DELETE FROM rental_extensions WHERE id = ${ext}`);
        assert.equal((await money(tx, id)).extension_total, '0.00');
      }));

    test('lowering a paid extension below the refunds already given is refused', () =>
      rolledBack(async (tx) => {
        const id = await createOrder(tx, '100.00');
        const ext = await createExtension(tx, id, '30.00', true);
        await insertRefund(tx, id, '120.00');
        await expectDbError(tx, '23514', () =>
          tx.execute(sql`UPDATE rental_extensions SET amount = '10.00' WHERE id = ${ext}`),
        );
      }));

    test('deleting the order cascades cleanly', () =>
      rolledBack(async (tx) => {
        const id = await createOrder(tx, '100.00');
        await createExtension(tx, id, '30.00', true);
        await insertRefund(tx, id, '10.00');
        await tx.execute(sql`DELETE FROM orders WHERE id = ${id}`);
        for (const table of ['order_refunds', 'rental_extensions']) {
          const rows = await tx.execute<{ n: number }>(
            sql`SELECT count(*)::int AS n FROM ${sql.identifier(table)} WHERE order_id = ${id}`,
          );
          assert.equal(rows[0]!.n, 0, table);
        }
      }));

    test('recordRefundInTx: partial then full moves the payment status and writes the timeline', () =>
      rolledBack(async (tx) => {
        const id = await createOrder(tx, '100.00');
        await recordRefundInTx(tx, {
          orderId: id,
          amount: '40.00',
          reason: 'Primo rimborso',
          actorAdminUserId: null,
        });
        assert.equal((await money(tx, id)).payment_status, 'partially_refunded');
        await recordRefundInTx(tx, {
          orderId: id,
          amount: '10.00',
          reason: 'Secondo rimborso',
          actorAdminUserId: null,
        });
        assert.equal((await money(tx, id)).payment_status, 'partially_refunded');
        await recordRefundInTx(tx, {
          orderId: id,
          amount: '50.00',
          reason: 'Saldo',
          actorAdminUserId: null,
        });
        const m = await money(tx, id);
        assert.deepEqual([m.net_total, m.payment_status], ['0.00', 'refunded']);
        const events = await tx.execute<{ note: string }>(
          sql`SELECT note FROM order_status_events WHERE order_id = ${id} AND field = 'paymentStatus'`,
        );
        assert.deepEqual(
          // One transaction, one now(): the rows share a created_at, so compare as a set.
          events.map((e) => e.note).sort(),
          [
            'Refund 10,00 € — Secondo rimborso',
            'Refund 40,00 € — Primo rimborso',
            'Refund 50,00 € — Saldo',
          ],
        );
      }));

    test('recordRefundInTx: over-refund is a 422 on amount; an unpaid order is a 409', () =>
      rolledBack(async (tx) => {
        const id = await createOrder(tx, '100.00');
        await assert.rejects(
          recordRefundInTx(tx, {
            orderId: id,
            amount: '100.01',
            reason: 'troppo',
            actorAdminUserId: null,
          }),
          (e: { status?: number }) => e.status === 422,
        );
      }));

    test('recordRefundInTx on an unpaid order is refused', () =>
      rolledBack(async (tx) => {
        const id = await createOrder(tx, '100.00', 'unpaid');
        await assert.rejects(
          recordRefundInTx(tx, {
            orderId: id,
            amount: '1.00',
            reason: 'mai pagato',
            actorAdminUserId: null,
          }),
          (e: { status?: number }) => e.status === 409,
        );
      }));

    test('refundRemainingInTx gives back exactly the rest, extensions included', () =>
      rolledBack(async (tx) => {
        const id = await createOrder(tx, '100.00');
        await createExtension(tx, id, '30.00', true);
        await recordRefundInTx(tx, {
          orderId: id,
          amount: '25.50',
          reason: 'parziale',
          actorAdminUserId: null,
        });
        await refundRemainingInTx(tx, id, null, null);
        const m = await money(tx, id);
        assert.deepEqual(
          [m.refunded_total, m.net_total, m.payment_status],
          ['130.00', '0.00', 'refunded'],
        );
        await refundRemainingInTx(tx, id, null, null); // nothing left: a no-op, not an error
      }));

    test('concurrent extension payment and refund both land in the totals', async () => {
      assert.ok(db);
      const dbA = createDatabase({ max: 1 });
      const dbB = createDatabase({ max: 1 });
      let orderId: string | undefined;
      try {
        let ext = '';
        await db.transaction(async (tx) => {
          orderId = await createOrder(tx, '100.00');
          ext = await createExtension(tx, orderId, '30.00');
        });
        const id = orderId!;

        let releaseA: () => void = () => {};
        const holdA = new Promise<void>((resolve) => (releaseA = resolve));
        let aWrote: () => void = () => {};
        const aHasWritten = new Promise<void>((resolve) => (aWrote = resolve));

        // A pays the extension and keeps its transaction open.
        const a = dbA.transaction(async (tx) => {
          await tx.execute(sql`UPDATE rental_extensions SET paid_at = now() WHERE id = ${ext}`);
          aWrote();
          await holdA;
        });
        await aHasWritten;

        /* B refunds 110: only valid once A's 30 is counted (100 + 30 >= 110). Its
         statement must block on the order lock until A commits. */
        const b = dbB.transaction(async (tx) => {
          await insertRefund(tx, id, '110.00');
        });

        // Barrier: wait until B is genuinely queued behind A on a lock.
        let blocked = false;
        for (let i = 0; i < 100 && !blocked; i += 1) {
          const rows = await db.execute<{ n: number }>(
            sql`SELECT count(*)::int AS n FROM pg_stat_activity
              WHERE wait_event_type = 'Lock' AND datname = current_database()`,
          );
          blocked = rows[0]!.n > 0;
          if (!blocked) await new Promise((r) => setTimeout(r, 20));
        }
        assert.ok(blocked, 'B never queued behind A');

        releaseA();
        await Promise.all([a, b]);

        const rows = await db.execute<{ e: string; r: string; n: string }>(sql`
        SELECT o.extension_total AS e, o.refunded_total AS r, o.net_total AS n,
          (SELECT COALESCE(SUM(amount), 0) FROM rental_extensions WHERE order_id = o.id AND paid_at IS NOT NULL) AS true_e,
          (SELECT COALESCE(SUM(amount), 0) FROM order_refunds WHERE order_id = o.id) AS true_r
        FROM orders o WHERE o.id = ${id}`);
        const row = rows[0] as unknown as Record<string, string>;
        assert.equal(row.e, '30.00');
        assert.equal(row.r, '110.00');
        assert.equal(row.n, '20.00');
        assert.equal(row.e, row.true_e);
        assert.equal(row.r, row.true_r);
      } finally {
        if (orderId) await db.execute(sql`DELETE FROM orders WHERE id = ${orderId}`);
        const left = await db.execute<{ n: number }>(sql`
        SELECT ((SELECT count(*) FROM orders WHERE id = ${orderId ?? null})
              + (SELECT count(*) FROM rental_extensions WHERE order_id = ${orderId ?? null})
              + (SELECT count(*) FROM order_refunds WHERE order_id = ${orderId ?? null}))::int AS n`);
        await (dbA.$client as { end: () => Promise<void> }).end();
        await (dbB.$client as { end: () => Promise<void> }).end();
        assert.equal(left[0]!.n, 0, 'the throwaway order left rows behind');
      }
    });
  },
);
