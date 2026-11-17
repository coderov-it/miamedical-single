/**
 * An agent creates an order for a customer who phoned or wrote. Docs:
 * docs/code/manual-orders.md. The online counterpart is `orders/placement.ts`;
 * the two share line resolution, snapshots and `insertOrder`, not the request shape.
 *
 * ```
 * email rossi@x.it, letto-degenza 7-day (180.00), discount 20.00 "cliente storico"
 *   → MIA-2026-001050 pending/unpaid, source manual, total 160.00, stock taken,
 *     payment_due_at NULL, timeline: status null→pending, discount 0.00→20.00
 * ```
 */

import type { Database } from '@mia/db';
import { NO_DELIVERY_FEE, isNegative, isZero } from '@mia/pricing';
import type { PlaceOrderInput } from '@mia/validators';
import type { LanguageCode } from '@mia/validators/language';

import type { SessionUser } from '../../../shared/http/context.ts';
import { resolveForManualOrder } from '../../customer-auth/order-account.ts';
import { addressSnapshot, deliverySnapshot, resolveLines } from '../placement-input.ts';
import * as repo from '../repo.ts';
import { sumLines } from '../resolve.ts';
import { orderTotal } from '../totals.ts';
import { invalid, priceDiscount } from './pricing.ts';
import * as manualRepo from './repo.ts';

export interface ManualOrderInput {
  email: string;
  /** An existing account the agent picked; absent for an email-only customer. */
  customerAccountId?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  phone?: string | null | undefined;
  customerType?: 'private' | 'company' | 'tourist' | null | undefined;
  codiceFiscale?: string | null | undefined;
  partitaIva?: string | null | undefined;
  language?: LanguageCode | undefined;
  items: PlaceOrderInput['items'];
  delivery: PlaceOrderInput['delivery'];
  /** The agreed delivery fee; absent means none. */
  shippingTotal?: string | undefined;
  discount?: { amount: string; reason?: string | null | undefined } | null | undefined;
  notes?: string | null | undefined;
}

export interface ManualOrderCreated {
  id: string;
  number: string;
  placedAt: Date;
  subtotal: string;
  shippingTotal: string;
  discountTotal: string;
  total: string;
  currency: string;
}

const clean = (value: string | null | undefined): string | null => value?.trim() || null;

export async function createManualOrder(
  db: Database,
  input: ManualOrderInput,
  agent: SessionUser,
): Promise<ManualOrderCreated> {
  const { lines, currency } = await resolveLines(db, input.items);
  const subtotal = sumLines(lines);
  const shippingTotal = input.shippingTotal ?? NO_DELIVERY_FEE;

  /* Priced before anything is written, so a refused discount creates no account either. */
  const discount = priceDiscount({ subtotal, shippingTotal }, input.discount ?? { amount: '0.00' });
  const total = orderTotal(subtotal, shippingTotal, discount.discountTotal);
  if (isNegative(total) || isZero(total)) {
    throw invalid('items', 'The order total must be above 0.00.');
  }

  const { block, shipTo } = deliverySnapshot(input.delivery);
  const snapshot = addressSnapshot(input, shipTo);

  const account = await resolveForManualOrder(
    db,
    {
      email: input.email,
      firstName: clean(input.firstName) ?? '',
      lastName: clean(input.lastName) ?? '',
      phone: clean(input.phone),
      ...(input.language ? { language: input.language } : {}),
    },
    input.customerAccountId ?? null,
  );

  const hasDiscount = !isZero(discount.discountTotal);
  const created = await repo.insertOrder(
    db,
    {
      customerAccountId: account.customerAccountId,
      customerLinkStatus: account.customerLinkStatus,
      firstName: clean(input.firstName),
      lastName: clean(input.lastName),
      email: account.email,
      phone: clean(input.phone),
      customerType: input.customerType ?? null,
      codiceFiscale: clean(input.codiceFiscale),
      partitaIva: clean(input.partitaIva),
      currency,
      subtotal,
      shippingTotal,
      discountTotal: discount.discountTotal,
      discountReason: discount.discountReason,
      total,
      shippingAddress: snapshot,
      billingAddress: snapshot,
      delivery: block,
      notes: clean(input.notes),
      /* No deadline: the sweep never cancels a manual order. */
      paymentDueAt: null,
      source: 'manual',
      createdByAdminUserId: agent.id,
      openingNote: `Created by ${agent.fullName ?? agent.email} for a phone order.`,
      items: lines.map((line) => ({
        productId: line.productId,
        productTitle: line.productTitle,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: line.total,
        configuration: line.configuration as unknown as Record<string, unknown>,
      })),
    },
    async (tx, order) => {
      if (!hasDiscount) return;
      await manualRepo.insertDiscountEvent(tx, {
        orderId: order.id,
        fromValue: '0.00',
        toValue: discount.discountTotal,
        reason: discount.discountReason,
        actorAdminUserId: agent.id,
      });
    },
  );

  return {
    ...created,
    subtotal,
    shippingTotal,
    discountTotal: discount.discountTotal,
    total,
    currency,
  };
}
