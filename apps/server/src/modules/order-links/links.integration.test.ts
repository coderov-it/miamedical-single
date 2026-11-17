/**
 * Link minting and account search against a real Postgres. Skipped unless
 * MIA_DB_TESTS=1 and 0025 is applied; every scenario is rolled back.
 *
 *   MIA_DB_TESTS=1 node --test --experimental-strip-types \
 *     src/modules/order-links/links.integration.test.ts
 */

import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';

import { createDatabase, sql } from '@mia/db';
import type { Database } from '@mia/db';

try {
  process.loadEnvFile(new URL('../../../../../.env', import.meta.url));
} catch {
  /* DATABASE_URL may come from the shell instead. */
}

const enabled = process.env.MIA_DB_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const db = enabled ? createDatabase({ max: 1 }) : undefined;
const { issueLink } = enabled
  ? await import('./service.ts')
  : ({} as typeof import('./service.ts'));
const { searchAccounts } = enabled
  ? await import('../orders/manual/accounts.ts')
  : ({} as typeof import('../orders/manual/accounts.ts'));

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

describe(
  'order links (database)',
  { skip: !enabled && 'set MIA_DB_TESTS=1 and DATABASE_URL' },
  () => {
    after(async () => {
      await (db?.$client as { end?: () => Promise<void> } | undefined)?.end?.();
    });

    test('minting twice leaves one live token and two link events; copy returns a URL', () =>
      rolledBack(async (tx) => {
        const email = `link-${crypto.randomUUID()}@example.invalid`;
        const admin = await tx.execute<{ id: string }>(
          sql`INSERT INTO admin_users (email, is_superuser) VALUES (${email}, true) RETURNING id`,
        );
        const adminId = admin[0]!.id;
        const order = await tx.execute<{ id: string }>(sql`
        INSERT INTO orders (number, email, source, created_by_admin_user_id, subtotal, total)
        VALUES (${`TEST-${crypto.randomUUID()}`}, ${email}, 'manual', ${adminId}, '50.00', '50.00')
        RETURNING id`);
        const orderId = order[0]!.id;
        const actor = { id: adminId, email, fullName: 'Agent', isSuperuser: true, permissions: [] };
        const input = { steps: 'pay', includeDetails: true, deliver: 'copy' } as const;

        const first = await issueLink(tx as unknown as Database, orderId, input, actor);
        const second = await issueLink(tx as unknown as Database, orderId, input, actor);
        assert.match(first.url, /\/complete-order\/\?token=/);
        assert.notEqual(first.url, second.url);

        const live = await tx.execute<{ n: number }>(
          sql`SELECT count(*)::int AS n FROM order_link_tokens WHERE order_id = ${orderId} AND revoked_at IS NULL`,
        );
        assert.equal(live[0]!.n, 1);
        const events = await tx.execute<{ n: number }>(
          sql`SELECT count(*)::int AS n FROM order_status_events WHERE order_id = ${orderId} AND field = 'link'`,
        );
        assert.equal(events[0]!.n, 2);
      }));

    test('account search ranks email matches before name matches', () =>
      rolledBack(async (tx) => {
        const tag = crypto.randomUUID().slice(0, 8);
        await tx.execute(sql`
        INSERT INTO customer_accounts (email, first_name, last_name) VALUES
          (${`zz-${tag}@example.invalid`}, 'Other', 'Person'),
          (${`aa@example.invalid`}, ${tag}, 'Namematch')`);
        const found = await searchAccounts(tx as unknown as Database, tag);
        assert.equal(found[0]?.email, `zz-${tag}@example.invalid`);
        assert.equal(found.length, 2);
      }));
  },
);
