import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import { orders } from '@mia/db/schema';
import type { RentalPeriod } from '@mia/pricing';
import type { ContractData } from '@mia/templates';
import type { ManualContractInput } from '@mia/validators';

import { conflict, notFound } from '../../shared/http/errors.ts';
import { issueContract } from './issue.ts';
import type { IssueHook } from './issue.ts';
import * as lifecycle from './lifecycle.ts';
import { TEMPLATE_MAP } from './render.ts';
import * as repo from './repo.ts';
import type { ContractDetailRow, ContractListFilters, ContractSummaryRow } from './repo.ts';

/**
 * The contracts module's front door. Issuing lives in `issue.ts`, operator
 * actions on an open contract in `lifecycle.ts`, the customer's signature in
 * `signing.ts`; this file reads, builds a contract from an order or a form,
 * and re-exports the rest so callers import one module.
 */

export { getSigningLink, resend, voidWithin } from './lifecycle.ts';
export { loadForSigning, sign } from './signing.ts';

export async function list(
  db: Database,
  filters: ContractListFilters,
): Promise<{ rows: ContractSummaryRow[]; total: number }> {
  return repo.findMany(db, filters);
}

export async function getById(db: Database, id: string): Promise<ContractDetailRow> {
  const row = await repo.findById(db, id);
  if (!row) throw notFound('Contract');
  return row;
}

export async function listByOrderId(db: Database, orderId: string): Promise<ContractSummaryRow[]> {
  return repo.findAllByOrderId(db, orderId);
}

/**
 * The contract as HTML, with the customer's drawn signature composited in once
 * it exists. The stored `contractData` stays as generated — the signature lives
 * in its own column — so the injection happens at render time, here.
 */
export async function renderPreview(db: Database, id: string): Promise<string> {
  const contract = await getById(db, id);
  const render = TEMPLATE_MAP[contract.variant];
  const data = contract.contractData as unknown as ContractData;

  const imageDataUrl =
    contract.status === 'signed' && contract.signatureData
      ? (contract.signatureData as { imageDataUrl?: string }).imageDataUrl
      : undefined;

  if (!imageDataUrl) return render(data);
  return render({
    ...data,
    signature: {
      imageDataUrl,
      signedAt: contract.signedAt?.toISOString().slice(0, 10) ?? '',
    },
  });
}

export async function updatePeriodAndResend(
  db: Database,
  id: string,
  from: string,
  to: string,
): Promise<ContractDetailRow> {
  await lifecycle.updatePeriodAndResend(db, id, from, to);
  return getById(db, id);
}

export async function voidContract(
  db: Database,
  id: string,
  reason: string,
  adminUserId: string,
): Promise<ContractDetailRow> {
  await lifecycle.voidContract(db, id, reason, adminUserId);
  return getById(db, id);
}

export interface GenerateFromOrderOptions {
  kind?: 'initial' | 'renewal';
  actorAdminUserId?: string | null;
  /**
   * A renewal contract covers the extension alone: its span, and the amounts
   * frozen on the extension row per order item id. Without it, every line is
   * quoted for the period and price it carries.
   */
  extension?: {
    fromDate: string;
    toDate: string;
    days: number;
    lineAmounts: Record<string, { unitPrice: string; total: string }>;
  };
  /** Runs inside the issuing transaction — a renewal links its extension here. */
  onIssued?: IssueHook;
}

/**
 * Issues the contract an order owes, reading everything from the order itself:
 * the customer block, the rental lines, and — through the catalogue — whether
 * any line is from a deposit category (which selects the scooter variants).
 * One path serves storefront placement, the admin's "Generate contract" and
 * rental renewals, so the three can never disagree about what a contract says.
 */
export async function generateFromOrder(
  db: Database,
  orderId: string,
  options: GenerateFromOrderOptions = {},
): Promise<{ id: string; number: string }> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });
  if (!order) throw notFound('Order');

  const items: ContractData['items'] = [];
  for (const item of order.items) {
    const config = item.configuration as Record<string, unknown> | null;
    if (config?.pricingMode !== 'rental') continue;
    const rental = (config.rental as RentalPeriod | undefined) ?? null;
    const extension = options.extension;
    if (extension) {
      const amounts = extension.lineAmounts[item.id] ?? { unitPrice: '0.00', total: '0.00' };
      items.push({
        productTitle: item.productTitle,
        quantity: item.quantity,
        unitPrice: amounts.unitPrice,
        total: amounts.total,
        startDate: extension.fromDate,
        endDate: extension.toDate,
        duration: extension.days,
        durationUnit: 'day',
      });
      continue;
    }
    items.push({
      productTitle: item.productTitle,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      startDate: rental?.startDate ?? '',
      endDate: rental?.endDate ?? null,
      duration: rental?.duration ?? 1,
      durationUnit: (rental?.unit as 'hour' | 'day' | undefined) ?? 'day',
    });
  }

  /* Rental contracts cover rentals. An outright sale has nothing to sign, and
     issuing one anyway would put a rental agreement in a customer's inbox for
     goods they own. */
  if (items.length === 0) {
    throw conflict('This order has no rental lines, so there is no rental contract to issue.');
  }

  const address = order.shippingAddress as Record<string, unknown> | null;
  const addressStr = address
    ? [address.line1, [address.postalCode, address.city].filter(Boolean).join(' ')]
        .filter((part) => typeof part === 'string' && part !== '')
        .join(', ')
    : '';

  const rentalCents = items.reduce((sum, item) => sum + toCents(item.total), 0);
  const shippingTotal = options.extension ? '0.00' : order.shippingTotal;

  return issueContract(db, {
    orderId: order.id,
    orderNumber: order.number,
    /* Orders that predate the customer-type question default to tourist, the
       variant whose contract is at least readable to anyone. */
    customerType: (order.customerType ?? 'tourist') as 'private' | 'company' | 'tourist',
    customerName: `${order.firstName ?? ''} ${order.lastName ?? ''}`.trim(),
    email: order.email,
    phone: order.phone ?? '',
    address: addressStr,
    codiceFiscale: order.codiceFiscale,
    partitaIva: order.partitaIva,
    items,
    /* Summed over the rental lines only: on a mixed order the contract covers
       the rented aids, and quoting the whole order's total against them would
       hold the customer to a figure the contract's own table does not add up to. */
    subtotal: fromCents(rentalCents),
    /* An extension moves no goods, so it owes no delivery. */
    shippingTotal,
    total: fromCents(rentalCents + toCents(shippingTotal)),
    currency: order.currency,
    hasDepositProduct: await repo.orderRequiresDeposit(db, orderId),
    kind: options.kind ?? 'initial',
    actorAdminUserId: options.actorAdminUserId ?? null,
    ...(options.onIssued ? { onIssued: options.onIssued } : {}),
  });
}

/** Cents-based decimal math — money strings are never fed to float arithmetic. */
function toCents(amount: string): number {
  const [whole = '0', frac = ''] = amount.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0').slice(0, 2));
}

function fromCents(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

/**
 * A contract typed in by an admin — walk-in and phone rentals, or a fresh
 * contract for a returning customer. Totals are computed here from the line
 * items rather than trusted from the form.
 */
export async function createManual(
  db: Database,
  input: ManualContractInput,
): Promise<{ id: string; number: string }> {
  const items: ContractData['items'] = input.items.map((item) => ({
    productTitle: item.productTitle,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.total,
    startDate: item.startDate,
    endDate: item.endDate ?? null,
    duration: item.duration,
    durationUnit: item.durationUnit,
  }));

  const subtotalCents = input.items.reduce((sum, item) => sum + toCents(item.total), 0);
  const totalCents = subtotalCents + toCents(input.shippingTotal);

  return issueContract(db, {
    orderId: null,
    orderNumber: null,
    customerType: input.customerType,
    customerName: input.fullName,
    email: input.email,
    phone: input.phone,
    address: input.address,
    codiceFiscale: input.codiceFiscale ?? null,
    partitaIva: input.partitaIva ?? null,
    codiceUnivoco: input.codiceUnivoco ?? null,
    items,
    subtotal: fromCents(subtotalCents),
    shippingTotal: input.shippingTotal,
    total: fromCents(totalCents),
    currency: 'EUR',
    hasDepositProduct: input.hasDepositProduct,
  });
}
