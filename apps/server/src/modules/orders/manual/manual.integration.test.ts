/**
 * Manual-order rules against a real Postgres. Skipped unless MIA_DB_TESTS=1, and
 * needs the 0025 migration applied to that database. Run against a throwaway or
 * local database, never a shared one:
 *
 *   MIA_DB_TESTS=1 node --test --experimental-strip-types \
 *     src/modules/orders/manual/manual.integration.test.ts
 *
 * Every scenario runs inside a transaction that is rolled back, so nothing is
 * committed. Services receive the transaction as their `db` (nested transactions
 * become savepoints).
 */

import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';

import { createDatabase, sql } from '@mia/db';
import type { Database } from '@mia/db';

import type { SessionUser } from '../../../shared/http/context.ts';
import { orderTotal } from '../totals.ts';

try {
  process.loadEnvFile(new URL('../../../../../../.env', import.meta.url));
} catch {
  /* DATABASE_URL may come from the shell instead. */
}

const enabled = process.env.MIA_DB_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const db = enabled ? createDatabase({ max: 1 }) : undefined;

/* Loaded only when enabled: these modules read the whole server environment at import. */
const { findOverdueOrders } = enabled
  ? await import('../../payments/attempt-repo.ts')
  : ({} as typeof import('../../payments/attempt-repo.ts'));
const { setDiscount } = enabled
  ? await import('./discount.ts')
  : ({} as typeof import('./discount.ts'));
const { update: updateOrder } = enabled
  ? await import('../service.ts')
  : ({} as typeof import('../service.ts'));
const { recordPayment } = enabled
  ? await import('./payment.ts')
  : ({} as typeof import('./payment.ts'));
type Tx = Parameters<Parameters<NonNullable<typeof db>['transaction']>[0]>[0];

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

async function createAdmin(tx: Tx): Promise<SessionUser> {
  const email = `manual-${crypto.randomUUID()}@example.invalid`;
  const rows = await tx.execute<{ id: string }>(
    sql`INSERT INTO admin_users (email, is_superuser) VALUES (${email}, true) RETURNING id`,
  );
  return { id: rows[0]!.id, email, fullName: 'Agent', isSuperuser: true, permissions: [] };
}

interface OrderOptions {
  source?: 'online' | 'manual';
  adminId?: string | null;
  customerType?: 'private' | 'company' | null;
  codiceFiscale?: string | null;
  subtotal?: string;
  shipping?: string;
  discount?: string;
  rental?: boolean;
  dueAt?: string | null;
  fullDetails?: boolean;
}

async function createOrder(tx: Tx, o: OrderOptions = {}): Promise<string> {
  const subtotal = o.subtotal ?? '180.00';
  const shipping = o.shipping ?? '0.00';
  const discount = o.discount ?? '0.00';
  const total = orderTotal(subtotal, shipping, discount);
  const full = o.fullDetails ?? false;
  const rows = await tx.execute<{ id: string }>(sql`
    INSERT INTO orders (number, email, source, created_by_admin_user_id, customer_type,
      codice_fiscale, first_name, last_name, phone, subtotal, shipping_total, discount_total,
      total, payment_due_at)
    VALUES (${`TEST-${crypto.randomUUID()}`}, 'manual-test@example.invalid',
      ${o.source ?? 'manual'}::order_source, ${o.adminId ?? null}, ${o.customerType ?? null}::customer_type,
      ${o.codiceFiscale ?? null}, ${full ? 'Anna' : null}, ${full ? 'Rossi' : null},
      ${full ? '+39 333 1234567' : null}, ${subtotal}, ${shipping}, ${discount}, ${total},
      ${o.dueAt ?? null}::timestamptz)
    RETURNING id`);
  const id = rows[0]!.id;
  if (o.rental) {
    await tx.execute(sql`
      INSERT INTO order_items (order_id, product_title, quantity, unit_price, total, configuration)
      VALUES (${id}, 'Letto', 1, ${subtotal}, ${subtotal}, '{"pricingMode":"rental"}'::jsonb)`);
  }
  return id;
}

/** Expect `statement` to fail with SQLSTATE `code`, without poisoning the outer transaction. */
async function expectDbError(tx: Tx, code: string, statement: () => Promise<unknown>) {
  await assert.rejects(
    tx.transaction(async () => {
      await statement();
    }),
    (error: unknown) => {
      const e = error as { code?: string; cause?: { code?: string } };
      return (e.cause?.code ?? e.code) === code;
    },
  );
}

const asDb = (tx: Tx) => tx as unknown as Database;

describe(
  'manual orders (database)',
  { skip: !enabled && 'set MIA_DB_TESTS=1 and DATABASE_URL' },
  () => {
    after(async () => {
      await (db?.$client as { end?: () => Promise<void> } | undefined)?.end?.();
    });

    test('a manual order with only an email passes the database', () =>
      rolledBack(async (tx) => {
        const agent = await createAdmin(tx);
        await createOrder(tx, { adminId: agent.id });
      }));

    test('an online order with private and no codice fiscale is still refused', () =>
      rolledBack(async (tx) => {
        await expectDbError(tx, '23514', () =>
          createOrder(tx, { source: 'online', customerType: 'private' }),
        );
      }));

    test('a manual order must name its agent', () =>
      rolledBack(async (tx) => {
        await expectDbError(tx, '23514', () => createOrder(tx, { adminId: null }));
      }));

    test('the discount stays between 0 and subtotal plus shipping', () =>
      rolledBack(async (tx) => {
        const agent = await createAdmin(tx);
        await expectDbError(tx, '23514', () =>
          tx.execute(sql`INSERT INTO orders (number, email, subtotal, total, discount_total)
            VALUES (${`TEST-${crypto.randomUUID()}`}, 'x@example.invalid', '10.00', '0.00', '10.01')`),
        );
        await expectDbError(tx, '23514', () =>
          tx.execute(sql`INSERT INTO orders (number, email, subtotal, total, discount_total)
            VALUES (${`TEST-${crypto.randomUUID()}`}, 'x@example.invalid', '10.00', '11.00', '-1.00')`),
        );
        await createOrder(tx, { adminId: agent.id, subtotal: '10.00', discount: '9.99' });
      }));

    test('the sweep leaves a manual order pending past any time', () =>
      rolledBack(async (tx) => {
        const agent = await createAdmin(tx);
        const past = '2000-01-01T00:00:00Z';
        const manual = await createOrder(tx, { adminId: agent.id, dueAt: past });
        const online = await createOrder(tx, {
          source: 'online',
          customerType: 'private',
          codiceFiscale: 'RSSNNA80A41H501Z',
          dueAt: past,
        });
        const overdue = (await findOverdueOrders(asDb(tx), new Date())).map((row) => row.id);
        assert.equal(overdue.includes(online), true);
        assert.equal(overdue.includes(manual), false);
      }));

    test('changing the delivery fee keeps the stored discount in the total', () =>
      rolledBack(async (tx) => {
        const agent = await createAdmin(tx);
        const id = await createOrder(tx, { adminId: agent.id, discount: '20.00' });
        const updated = await updateOrder(asDb(tx), id, { shippingTotal: '15.00' });
        assert.equal(updated.total, '175.00');
      }));

    test('recordPayment refuses incomplete details', () =>
      rolledBack(async (tx) => {
        const agent = await createAdmin(tx);
        const id = await createOrder(tx, { adminId: agent.id });
        await assert.rejects(
          recordPayment(asDb(tx), id, { method: 'bank_transfer' }, agent),
          (error: unknown) => (error as { res: Response }).res.status === 409,
        );
      }));

    test('recordPayment refuses an unsigned rental', () =>
      rolledBack(async (tx) => {
        const agent = await createAdmin(tx);
        const id = await createOrder(tx, {
          adminId: agent.id,
          customerType: 'private',
          codiceFiscale: 'RSSNNA80A41H501Z',
          fullDetails: true,
          rental: true,
        });
        await assert.rejects(
          recordPayment(asDb(tx), id, { method: 'cash' }, agent),
          (error: unknown) => (error as { res: Response }).res.status === 409,
        );
      }));

    test('recordPayment on a complete sale writes both events with the note', () =>
      rolledBack(async (tx) => {
        const agent = await createAdmin(tx);
        const id = await createOrder(tx, {
          adminId: agent.id,
          customerType: 'private',
          codiceFiscale: 'RSSNNA80A41H501Z',
          fullDetails: true,
        });
        const paid = await recordPayment(
          asDb(tx),
          id,
          { method: 'bank_transfer', reference: 'CRO 1234' },
          agent,
        );
        assert.deepEqual([paid.status, paid.paymentStatus], ['paid', 'paid']);
        const fields = paid.events.filter((e) => e.toValue === 'paid').map((e) => e.field);
        assert.deepEqual(fields.sort(), ['paymentStatus', 'status']);
        assert.equal(
          paid.events.every((e) => e.toValue !== 'paid' || e.note?.includes('CRO 1234')),
          true,
        );
      }));

    test('the discount changes the total until a payment attempt is open', () =>
      rolledBack(async (tx) => {
        const agent = await createAdmin(tx);
        const id = await createOrder(tx, { adminId: agent.id });
        const changed = await setDiscount(
          asDb(tx),
          id,
          { amount: '20.00', reason: 'cliente storico' },
          agent,
        );
        assert.equal(changed.total, '160.00');
        assert.equal(changed.events.at(-1)?.field, 'discount');
        await tx.execute(sql`INSERT INTO payment_attempts
          (order_id, provider, provider_reference, access_token, amount)
          VALUES (${id}, 'nexi', ${`T${crypto.randomUUID()}`}, ${crypto.randomUUID()}, '160.00')`);
        await assert.rejects(
          setDiscount(asDb(tx), id, { amount: '30.00', reason: 'x' }, agent),
          (error: unknown) => (error as { res: Response }).res.status === 409,
        );
      }));
  },
);
