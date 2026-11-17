/**
 * The order as the customer's link shows it: lines, money, what is missing, what the
 * token lets them do. Pure; the HTTP edge only fetches the rows. Docs: docs/code/manual-orders.md.
 *
 * ```
 * rental 7-day x1 180.00, discount 20.00, steps sign_pay, codice fiscale missing
 *   → lines [letto, "7 giorni", 2026-12-01 → 2026-12-07], total 160.00,
 *     steps { details, sign, pay }, missingFields ['codiceFiscale'], stage awaiting_signature
 * ```
 */

import type { OrderLinkSteps } from '@mia/validators';

import type { OrderItemConfiguration } from '../orders/resolve.ts';
import type { ManualStage } from '../orders/dto.ts';
import { manualStage } from '../orders/manual/stage.ts';
import { missingCustomerFields } from '../orders/manual/readiness.ts';
import type { OrderItemRow, OrderRow } from '../orders/types.ts';
import { type AllowedSteps, allowedSteps } from './access.ts';

export interface OrderLinkLineDto {
  title: string;
  quantity: number;
  unitPrice: string;
  total: string;
  /** A rented line: its package and period. A sold line has neither. */
  rental: { packageLabel: string | null; startDate: string; endDate: string | null } | null;
  addons: { name: string; quantity: number; total: string }[];
}

export interface OrderLinkSummaryDto {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  /** Where a pending order waits; null once it is paid. */
  stage: ManualStage | null;
  currency: string;
  lines: OrderLinkLineDto[];
  subtotal: string;
  shippingTotal: string;
  discountTotal: string;
  total: string;
  steps: AllowedSteps;
  missingFields: string[];
  contractSigned: boolean;
  hasRental: boolean;
  expiresAt: string;
  customer: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    customerType: OrderRow['customerType'];
    codiceFiscale: string | null;
    partitaIva: string | null;
  };
}

type LineConfig = Partial<OrderItemConfiguration> | null;

export function orderHasRental(items: readonly Pick<OrderItemRow, 'configuration'>[]): boolean {
  return items.some((item) => (item.configuration as LineConfig)?.pricingMode === 'rental');
}

export function toLine(item: OrderItemRow): OrderLinkLineDto {
  const config = item.configuration as LineConfig;
  const rented = config?.pricingMode === 'rental';
  return {
    title: item.productTitle,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.total,
    rental: rented
      ? {
          packageLabel: config?.rentalPackage?.label ?? null,
          startDate: config?.rental?.startDate ?? '',
          endDate: config?.rental?.endDate ?? null,
        }
      : null,
    addons: (config?.addons ?? []).map((addon) => ({
      name: addon.name,
      quantity: addon.quantity,
      total: addon.total,
    })),
  };
}

export function toSummary(input: {
  order: OrderRow & { items: OrderItemRow[] };
  token: { steps: string; includeDetails: boolean; expiresAt: Date };
  contractStatus: string | null;
}): OrderLinkSummaryDto {
  const { order, token } = input;
  const hasRental = orderHasRental(order.items);
  const contractSigned = input.contractStatus === 'signed';
  return {
    orderNumber: order.number,
    status: order.status,
    paymentStatus: order.paymentStatus,
    stage: manualStage({
      source: order.source,
      status: order.status,
      paymentStatus: order.paymentStatus,
      hasRental,
      contractStatus: input.contractStatus,
    }),
    currency: order.currency,
    lines: order.items.map(toLine),
    subtotal: order.subtotal,
    shippingTotal: order.shippingTotal,
    discountTotal: order.discountTotal,
    total: order.total,
    steps: allowedSteps({
      steps: token.steps as OrderLinkSteps,
      includeDetails: token.includeDetails,
      hasRental,
    }),
    missingFields: missingCustomerFields(order),
    contractSigned,
    hasRental,
    expiresAt: token.expiresAt.toISOString(),
    customer: {
      email: order.email,
      firstName: order.firstName,
      lastName: order.lastName,
      phone: order.phone,
      customerType: order.customerType,
      codiceFiscale: order.codiceFiscale,
      partitaIva: order.partitaIva,
    },
  };
}
