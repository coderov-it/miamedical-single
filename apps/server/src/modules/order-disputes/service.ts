import type { Database } from '@mia/db';
import { and, count, desc, eq } from '@mia/db';
import { customerAccounts, orderDisputes, orders } from '@mia/db/schema';
import type { CreateOrderDisputeInput, UpdateOrderDisputeInput } from '@mia/validators';

import { hashToken } from '../../shared/auth/customer-session.ts';
import { httpError, notFound } from '../../shared/http/errors.ts';
import * as customerAuthRepo from '../customer-auth/repo.ts';
import * as notifications from '../notifications/service.ts';

/**
 * "I did not place this order" reports.
 *
 * Flat like `modules/terms` and `modules/settings`: one table, a handful of
 * queries, and one real rule — the emailed token is the authorisation.
 *
 * That rule is why nothing here takes an order id. The reporter is, by definition,
 * somebody who may not own the account the order was attached to; the only thing
 * they can prove is that they received the email, and the token is that proof. It
 * carries the order id itself, so no id ever travels in a URL where it could be
 * guessed at or enumerated.
 */

export interface DisputeMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

const invalidToken = () => httpError(400, 'This link is no longer valid.', 'invalid_token');

/**
 * Files a report. Consuming the token is what makes it single-use: one link, one
 * report, so the same email cannot be replayed into a flood of them.
 */
export async function create(
  db: Database,
  input: CreateOrderDisputeInput,
  meta: DisputeMeta,
): Promise<{ id: string }> {
  const token = await customerAuthRepo.consumeAuthToken(db, await hashToken(input.token), [
    'order_report',
  ]);
  if (!token || !token.orderId) throw invalidToken();

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, token.orderId),
    columns: { id: true, number: true, email: true, total: true, currency: true },
  });
  // The token's FK is `set null` on order delete, so a missing order means the
  // order is gone — there is nothing left to dispute.
  if (!order) throw invalidToken();

  const [row] = await db
    .insert(orderDisputes)
    .values({
      orderId: order.id,
      customerAccountId: token.customerAccountId,
      reportedPhone: input.reportedPhone,
      message: input.message,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    })
    .returning({ id: orderDisputes.id });

  if (!row) throw new Error('order dispute insert returned no row');

  /*
    Alerting is best-effort by design — see notifications/service.ts. The report is
    already stored and already visible in the admin panel, so a mail outage must not
    turn a filed report into an error the reporter sees and possibly re-submits
    against a token that is now spent.
  */
  await notifications.sendDisputeAlert(db, {
    disputeId: row.id,
    order: { number: order.number, total: order.total, currency: order.currency },
    orderEmail: order.email,
    reportedPhone: input.reportedPhone,
    message: input.message,
  });

  return { id: row.id };
}

// --- back office ------------------------------------------------------------

type DisputeStatus = (typeof orderDisputes.$inferSelect)['status'];

export async function list(
  db: Database,
  filters: { page: number; perPage: number; status: DisputeStatus | undefined },
) {
  const where = filters.status ? eq(orderDisputes.status, filters.status) : undefined;

  const [rows, totals, openCount] = await Promise.all([
    db
      .select({
        dispute: orderDisputes,
        orderNumber: orders.number,
        orderEmail: orders.email,
        accountEmail: customerAccounts.email,
      })
      .from(orderDisputes)
      .innerJoin(orders, eq(orders.id, orderDisputes.orderId))
      .leftJoin(customerAccounts, eq(customerAccounts.id, orderDisputes.customerAccountId))
      .where(where)
      .orderBy(desc(orderDisputes.createdAt))
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db.select({ value: count() }).from(orderDisputes).where(where),
    db.select({ value: count() }).from(orderDisputes).where(eq(orderDisputes.status, 'open')),
  ]);

  return {
    rows,
    total: totals[0]?.value ?? 0,
    // Drives the sidebar badge. Always the unfiltered count, so filtering the
    // list does not make the outstanding work look smaller than it is.
    openCount: openCount[0]?.value ?? 0,
  };
}

export async function findById(db: Database, id: string) {
  const [row] = await db
    .select({
      dispute: orderDisputes,
      orderNumber: orders.number,
      orderEmail: orders.email,
      orderPhone: orders.phone,
      orderTotal: orders.total,
      orderCurrency: orders.currency,
      accountEmail: customerAccounts.email,
    })
    .from(orderDisputes)
    .innerJoin(orders, eq(orders.id, orderDisputes.orderId))
    .leftJoin(customerAccounts, eq(customerAccounts.id, orderDisputes.customerAccountId))
    .where(eq(orderDisputes.id, id))
    .limit(1);

  if (!row) throw notFound('Dispute');
  return row;
}

export async function update(
  db: Database,
  id: string,
  input: UpdateOrderDisputeInput,
  adminUserId: string,
) {
  // `resolvedAt` and the operator who got it there are recorded together, and only
  // for the two statuses that actually end the matter.
  const isClosed = input.status === 'resolved' || input.status === 'confirmed_fraud';

  await db
    .update(orderDisputes)
    .set({
      status: input.status,
      adminNotes: input.adminNotes ?? null,
      resolvedAt: isClosed ? new Date() : null,
      resolvedByAdminUserId: isClosed ? adminUserId : null,
    })
    .where(and(eq(orderDisputes.id, id)));

  return findById(db, id);
}
