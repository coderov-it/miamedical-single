/**
 * The customer's side of a manual order link against a real Postgres: details, sign,
 * the freeze that follows, and the order-row lock between payment and discount.
 * Skipped unless MIA_DB_TESTS=1 and 0025 is applied; run it on a throwaway database:
 *
 *   MIA_DB_TESTS=1 node --test --experimental-strip-types \
 *     src/modules/order-links/pay-flow.integration.test.ts
 *
 * The scenarios inside `rolledBack` commit nothing. The last one needs two connections to
 * show a real wait, so it commits its own rows and deletes them in `finally`.
 */

import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';

import { createDatabase, sql } from '@mia/db';
import type { Database } from '@mia/db';

import type { SessionUser } from '../../shared/http/context.ts';
import { hashToken } from './token.ts';

try {
  process.loadEnvFile(new URL('../../../../../.env', import.meta.url));
} catch {
  /* DATABASE_URL may come from the shell instead. */
}

const enabled = process.env.MIA_DB_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const db = enabled ? createDatabase({ max: 1 }) : undefined;
const second = enabled ? createDatabase({ max: 2 }) : undefined;

const { signFromLink } = enabled ? await import('./sign.ts') : ({} as typeof import('./sign.ts'));
const { saveDetails } = enabled
  ? await import('./details.ts')
  : ({} as typeof import('./details.ts'));
const { readSummary } = enabled ? await import('./read.ts') : ({} as typeof import('./read.ts'));
const { setDiscount } = enabled
  ? await import('../orders/manual/discount.ts')
  : ({} as typeof import('../orders/manual/discount.ts'));
const { lockOrder } = enabled
  ? await import('../contracts/repo.ts')
  : ({} as typeof import('../contracts/repo.ts'));

type Tx = Parameters<Parameters<NonNullable<typeof db>['transaction']>[0]>[0];
const ROLLBACK = Symbol('rollback');
const asDb = (tx: Tx) => tx as unknown as Database;

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

const status = (error: unknown) => (error as { res: Response }).res.status;

interface Seed {
  agent: SessionUser;
  orderId: string;
  raw: string;
}

/** A pending manual rental, 180.00 less 20.00, with a live sign_pay link. */
async function seed(
  tx: Tx | NonNullable<typeof db>,
  options: { complete?: boolean } = {},
): Promise<Seed> {
  const email = `link-${crypto.randomUUID()}@example.invalid`;
  const admin = await tx.execute<{ id: string }>(
    sql`INSERT INTO admin_users (email, is_superuser) VALUES (${email}, false) RETURNING id`,
  );
  const agentId = admin[0]!.id;
  const full = options.complete ?? true;
  const order = await tx.execute<{ id: string }>(sql`
    INSERT INTO orders (number, email, source, created_by_admin_user_id, customer_type, codice_fiscale,
      first_name, last_name, phone, subtotal, discount_total, discount_reason, total)
    VALUES (${`TEST-${crypto.randomUUID()}`}, ${email}, 'manual', ${agentId},
      ${full ? 'private' : null}::customer_type, ${full ? 'RSSNNA80A41H501Z' : null},
      ${full ? 'Anna' : null}, ${full ? 'Rossi' : null}, ${full ? '+39 333 1234567' : null},
      '180.00', '20.00', 'cliente storico', '160.00')
    RETURNING id`);
  const orderId = order[0]!.id;
  await tx.execute(sql`
    INSERT INTO order_items (order_id, product_title, quantity, unit_price, total, configuration)
    VALUES (${orderId}, 'Letto', 1, '180.00', '180.00',
      '{"pricingMode":"rental","rental":{"startDate":"2026-12-01","endDate":"2026-12-07","duration":7,"unit":"day"}}'::jsonb)`);
  const raw = `raw-${crypto.randomUUID()}-${crypto.randomUUID()}`;
  await tx.execute(sql`
    INSERT INTO order_link_tokens (id, order_id, steps, include_details, expires_at, created_by_admin_user_id)
    VALUES (${hashToken(raw)}, ${orderId}, 'sign_pay', true, now() + interval '30 days', ${agentId})`);
  return {
    agent: { id: agentId, email, fullName: 'Agent', isSuperuser: false, permissions: [] },
    orderId,
    raw,
  };
}

const signature = (total: string) => ({
  signatureDataUrl: 'data:image/png;base64,AAAA',
  consent: true as const,
  expectedTotal: total,
});
const ctx = { ipAddress: '203.0.113.9', userAgent: 'test' };

describe(
  'order link: customer side (database)',
  { skip: !enabled && 'set MIA_DB_TESTS=1 and DATABASE_URL' },
  () => {
    after(async () => {
      await (db?.$client as { end?: () => Promise<void> } | undefined)?.end?.();
      await (second?.$client as { end?: () => Promise<void> } | undefined)?.end?.();
    });

    test('sign: contract is born signed, the agent is told, and the page freezes', () =>
      rolledBack(async (tx) => {
        const { agent, orderId, raw } = await seed(tx);
        const before = await readSummary(asDb(tx), raw);
        assert.equal(before.stage, 'awaiting_signature');
        assert.equal(before.total, '160.00');
        assert.deepEqual(before.missingFields, []);

        await signFromLink(asDb(tx), raw, signature('160.00'), ctx);

        const contracts = await tx.execute<{ status: string; total: string }>(
          sql`SELECT status, contract_data->>'total' AS total FROM contracts WHERE order_id = ${orderId}`,
        );
        assert.equal(contracts.length, 1);
        assert.equal(contracts[0]!.status, 'signed');
        assert.equal(contracts[0]!.total, '160.00');

        const notices = await tx.execute<{ n: number }>(sql`
          SELECT count(*)::int AS n FROM notifications
          WHERE admin_user_id = ${agent.id} AND type = 'contract.signed' AND order_id = ${orderId}`);
        assert.equal(notices[0]!.n, 1);

        assert.equal((await readSummary(asDb(tx), raw)).stage, 'awaiting_payment');
        const details = {
          firstName: 'Anna',
          lastName: 'Bianchi',
          phone: '+39 333 1234567',
          customerType: 'private' as const,
          codiceFiscale: 'RSSNNA80A41H501Z',
        };
        await assert.rejects(saveDetails(asDb(tx), raw, details), (e) => status(e) === 409);
        await assert.rejects(
          signFromLink(asDb(tx), raw, signature('160.00'), ctx),
          (e) => status(e) === 409,
        );
        await assert.rejects(
          setDiscount(asDb(tx), orderId, { amount: '10.00', reason: 'x' }, agent),
          (e) => status(e) === 409,
        );
      }));

    test('sign is refused until the details are complete, and a changed total is refused', () =>
      rolledBack(async (tx) => {
        const incomplete = await seed(tx, { complete: false });
        await assert.rejects(
          signFromLink(asDb(tx), incomplete.raw, signature('160.00'), ctx),
          (e) => status(e) === 409,
        );
        const { raw } = await seed(tx);
        await assert.rejects(
          signFromLink(asDb(tx), raw, signature('180.00'), ctx),
          (e) => status(e) === 409,
        );
      }));

    test('details save fills the missing fields; a revoked link answers 410', () =>
      rolledBack(async (tx) => {
        const { orderId, raw } = await seed(tx, { complete: false });
        const saved = await saveDetails(asDb(tx), raw, {
          firstName: 'Anna',
          lastName: 'Rossi',
          phone: '+39 333 1234567',
          customerType: 'tourist',
        });
        assert.deepEqual(saved.missingFields, []);
        await tx.execute(
          sql`UPDATE order_link_tokens SET revoked_at = now() WHERE order_id = ${orderId}`,
        );
        await assert.rejects(readSummary(asDb(tx), raw), (e) => status(e) === 410);
      }));

    test('an open payment attempt blocks the discount (409); without one it applies', () =>
      rolledBack(async (tx) => {
        const { agent, orderId } = await seed(tx);
        const applied = await setDiscount(
          asDb(tx),
          orderId,
          { amount: '30.00', reason: 'accordo' },
          agent,
        );
        assert.equal(applied.total, '150.00');
        await tx.execute(sql`
          INSERT INTO payment_attempts (order_id, provider, provider_reference, access_token, amount)
          VALUES (${orderId}, 'nexi', ${`REF${Date.now()}`}, ${crypto.randomUUID()}, '150.00')`);
        await assert.rejects(
          setDiscount(asDb(tx), orderId, { amount: '10.00', reason: 'x' }, agent),
          (e) => status(e) === 409,
        );
      }));

    test('race: a discount edit waits for the lock the payment holds, then sees its attempt', async () => {
      assert.ok(db && second);
      const { agent, orderId } = await seed(db);
      try {
        let edit: Promise<unknown> = Promise.resolve();
        let settled = false;
        await db.transaction(async (payment) => {
          await lockOrder(payment, orderId);
          edit = setDiscount(
            second as unknown as Database,
            orderId,
            { amount: '10.00', reason: 'late' },
            agent,
          ).then(
            () => {
              settled = true;
            },
            () => {
              settled = true;
            },
          );
          await new Promise((resolve) => setTimeout(resolve, 400));
          assert.equal(settled, false, 'the edit must wait while the payment holds the order row');
          await payment.execute(sql`
            INSERT INTO payment_attempts (order_id, provider, provider_reference, access_token, amount)
            VALUES (${orderId}, 'nexi', ${`REF${Date.now()}`}, ${crypto.randomUUID()}, '160.00')`);
        });
        await edit;
        const total = await db.execute<{ total: string }>(
          sql`SELECT total FROM orders WHERE id = ${orderId}`,
        );
        assert.equal(
          total[0]!.total,
          '160.00',
          'the open attempt fixed the amount; the late edit changed nothing',
        );
      } finally {
        await db.execute(sql`DELETE FROM orders WHERE id = ${orderId}`);
        await db.execute(sql`DELETE FROM notifications WHERE admin_user_id = ${agent.id}`);
        await db.execute(sql`DELETE FROM admin_users WHERE id = ${agent.id}`);
      }
    });
  },
);
