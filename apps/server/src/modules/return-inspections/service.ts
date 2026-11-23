/**
 * Return inspections: the decision per returned unit, and the attention queue.
 * Spec: /docs/code/order-delivery-and-return.md.
 *
 * Each unit is decided on its own after the order is `received`. Deciding the
 * last one closes the order (`received → fulfilled`) in the same transaction.
 */

import type { Database } from '@mia/db';
import { returnInspections } from '@mia/db/schema';
import { eq } from '@mia/db';

import type { SessionUser } from '../../shared/http/context.ts';
import { conflict, httpError, notFound } from '../../shared/http/errors.ts';
import * as orders from '../orders/service.ts';
import type { AdminOrderAggregate } from '../orders/types.ts';
import { applyTransitionInTx } from '../orders/transition-repo.ts';
import { type PendingUnit, pendingUnits } from './pending-units.ts';
import { findAttentionById, findOpenAttention, type AttentionRecord } from './attention-repo.ts';
import { findPendingLines } from './pending-repo.ts';
import * as repo from './repo.ts';
import type { InspectUnitInput, ResolveAttentionInput } from './validators.ts';

function invalid(field: string, message: string) {
  return httpError(422, message, 'validation_failed', { fields: { [field]: message } });
}

const hasText = (note: string | null | undefined): note is string =>
  typeof note === 'string' && note.trim() !== '';

/** `"Letto": motor noise` — or just the product when there is nothing to add. */
function eventNote(title: string, note: string | null | undefined): string {
  return hasText(note) ? `"${title}": ${note}` : `"${title}"`;
}

export async function inspectUnit(
  db: Database,
  orderId: string,
  input: InspectUnitInput,
  actor: SessionUser | null,
): Promise<AdminOrderAggregate> {
  const actorId = actor?.id ?? null;
  const note = hasText(input.note) ? input.note.trim() : null;

  await db.transaction(async (tx) => {
    const order = await repo.lockOrder(tx, orderId);
    if (!order) throw notFound('Order');
    if (order.status !== 'received') {
      throw conflict(
        `Units are inspected once the order is received. This order is ${order.status}.`,
      );
    }

    const lines = await repo.findLines(tx, orderId);
    const line = lines.find((candidate) => candidate.id === input.orderItemId);
    if (!line) throw notFound('Order line');
    if (line.configuration?.pricingMode !== 'rental') {
      throw invalid('orderItemId', 'Only rented lines are inspected.');
    }

    const decided = await repo.countByItem(tx, orderId);
    if ((decided.get(line.id) ?? 0) >= line.quantity) {
      throw conflict(`Every unit of "${line.productTitle}" is already decided.`);
    }
    if (input.outcome === 'attention' && !note) {
      throw invalid('note', 'Say what needs attention.');
    }

    await tx.insert(returnInspections).values({
      orderId,
      orderItemId: line.id,
      productId: line.productId,
      outcome: input.outcome,
      note,
      inspectedByAdminUserId: actorId,
    });
    if (input.outcome === 'restocked' && line.productId) {
      await repo.putUnitBack(tx, line.productId, {
        reason: 'rental_returned',
        orderId,
        actorAdminUserId: actorId,
        note: line.productTitle,
      });
    }
    await repo.writeInspectionEvent(tx, {
      orderId,
      toValue: input.outcome,
      note: eventNote(line.productTitle, note),
      actorAdminUserId: actorId,
    });

    const rentalUnits = lines
      .filter((candidate) => candidate.configuration?.pricingMode === 'rental')
      .reduce((sum, candidate) => sum + candidate.quantity, 0);
    const decidedUnits = [...(await repo.countByItem(tx, orderId)).values()].reduce(
      (sum, n) => sum + n,
      0,
    );
    if (decidedUnits >= rentalUnits) {
      await applyTransitionInTx(tx, {
        orderId,
        field: 'status',
        fromValue: 'received',
        toValue: 'fulfilled',
        note: 'Every returned unit is decided.',
        actorAdminUserId: actorId,
      });
    }
  });

  return orders.getById(db, orderId);
}

/** Every returned unit nobody has decided yet, oldest received first. */
export async function listPending(db: Database): Promise<PendingUnit[]> {
  return pendingUnits(await findPendingLines(db));
}

export function listAttention(db: Database): Promise<AttentionRecord[]> {
  return findOpenAttention(db);
}

export async function resolveAttention(
  db: Database,
  id: string,
  input: ResolveAttentionInput,
  actor: SessionUser | null,
): Promise<AttentionRecord> {
  const actorId = actor?.id ?? null;
  const note = hasText(input.note) ? input.note.trim() : null;

  return db.transaction(async (tx) => {
    const [locked] = await tx
      .select({ outcome: returnInspections.outcome, resolution: returnInspections.resolution })
      .from(returnInspections)
      .where(eq(returnInspections.id, id))
      .for('update')
      .limit(1);
    if (!locked || locked.outcome !== 'attention') throw notFound('Attention item');
    if (locked.resolution) throw conflict('This unit is already resolved.');
    if (input.resolution === 'written_off' && !note) {
      throw invalid('note', 'Give the reason it is written off.');
    }

    const row = await findAttentionById(tx, id);
    if (!row) throw notFound('Attention item');

    await tx
      .update(returnInspections)
      .set({
        resolution: input.resolution,
        resolutionNote: note,
        resolvedByAdminUserId: actorId,
        resolvedAt: new Date(),
      })
      .where(eq(returnInspections.id, id));
    if (input.resolution === 'repaired' && row.productId) {
      await repo.putUnitBack(tx, row.productId, {
        reason: 'unit_repaired',
        orderId: row.orderId,
        actorAdminUserId: actorId,
        note: row.productTitle,
      });
    }
    await repo.writeInspectionEvent(tx, {
      orderId: row.orderId,
      toValue: input.resolution,
      note: eventNote(row.productTitle, note),
      actorAdminUserId: actorId,
    });

    const updated = await findAttentionById(tx, id);
    if (!updated) throw notFound('Attention item');
    return updated;
  });
}
