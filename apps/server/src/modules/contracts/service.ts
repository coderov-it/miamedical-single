import { createHash, randomBytes } from 'node:crypto';

import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import { orders } from '@mia/db/schema';
import type { RentalPeriod } from '@mia/pricing';
import type { ContractData } from '@mia/templates';
import {
  carrozzInaItalian,
  carrozzinaTourist,
  scooterItalian,
  scooterTourist,
} from '@mia/templates';
import type { ContractVariant, ManualContractInput } from '@mia/validators';

import { conflict, httpError, notFound } from '../../shared/http/errors.ts';
import * as links from '../notifications/links.ts';
import * as notifications from '../notifications/service.ts';
/* One-way dependencies: the orders repo knows nothing about contracts (the
   event writer lives there because the timeline is the orders module's
   artefact), and the rentals repo only touches order rows. */
import { insertContractEvent } from '../orders/repo.ts';
import { updateRentalPeriods } from '../rentals/repo.ts';
import * as repo from './repo.ts';
import type { ContractDetailRow, ContractListFilters, ContractSummaryRow } from './repo.ts';
import { resolveVariant } from './variant.ts';

const TOKEN_EXPIRY_DAYS = 30;

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  return { raw, hash: hashToken(raw) };
}

const TEMPLATE_MAP: Record<ContractVariant, (data: ContractData) => string> = {
  carrozzina_italian: carrozzInaItalian,
  carrozzina_tourist: carrozzinaTourist,
  scooter_italian: scooterItalian,
  scooter_tourist: scooterTourist,
};

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

interface IssueContractInput {
  orderId: string | null;
  orderNumber: string | null;
  customerType: 'private' | 'company' | 'tourist';
  customerName: string;
  email: string;
  phone: string;
  address: string;
  codiceFiscale: string | null;
  partitaIva: string | null;
  /** SDI e-invoice code — collected on manual company contracts only. */
  codiceUnivoco?: string | null;
  items: ContractData['items'];
  subtotal: string;
  shippingTotal: string;
  total: string;
  currency: string;
  hasDepositProduct: boolean;
  damages?: ContractData['damages'];
  /** A renewal is a new contract for a new period on the same order. */
  kind?: 'initial' | 'renewal';
  /** The operator who triggered it, for the order timeline. Null = system. */
  actorAdminUserId?: string | null;
}

export interface GenerateFromOrderOptions {
  kind?: 'initial' | 'renewal';
  actorAdminUserId?: string | null;
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

  /* One live contract at a time. A signed one may be followed (that is what a
     renewal is); an unsigned one still out for signature must be resent or
     voided, not silently duplicated. */
  const latest = await repo.findLatestActiveByOrderId(db, orderId);
  if (latest && latest.status !== 'signed') {
    throw conflict(
      `Contract ${latest.number} is still awaiting signature. Resend it, or void it before issuing a new one.`,
    );
  }

  const address = order.shippingAddress as Record<string, unknown> | null;
  const addressStr = address
    ? [address.line1, [address.postalCode, address.city].filter(Boolean).join(' ')]
        .filter((part) => typeof part === 'string' && part !== '')
        .join(', ')
    : '';

  const rentalCents = items.reduce((sum, item) => sum + toCents(item.total), 0);

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
    shippingTotal: order.shippingTotal,
    total: fromCents(rentalCents + toCents(order.shippingTotal)),
    currency: order.currency,
    hasDepositProduct: await repo.orderRequiresDeposit(db, orderId),
    kind: options.kind ?? 'initial',
    actorAdminUserId: options.actorAdminUserId ?? null,
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

async function issueContract(
  db: Database,
  input: IssueContractInput,
): Promise<{ id: string; number: string }> {
  const { variant, language, requiresDeposit, depositAmount } = resolveVariant(
    input.customerType,
    input.hasDepositProduct,
  );

  const contractData: ContractData = {
    contractNumber: '',
    orderNumber: input.orderNumber,
    customer: {
      fullName: input.customerName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      codiceFiscale: input.codiceFiscale,
      partitaIva: input.partitaIva,
      codiceUnivoco: input.codiceUnivoco ?? null,
      customerType: input.customerType,
    },
    items: input.items,
    subtotal: input.subtotal,
    shippingTotal: input.shippingTotal,
    total: input.total,
    currency: input.currency,
    requiresDeposit,
    depositAmount,
    damages: input.damages ?? defaultDamages(language),
    generatedAt: new Date().toISOString().slice(0, 10),
  };

  const contract = await repo.create(db, {
    orderId: input.orderId,
    variant,
    language,
    requiresDeposit,
    depositAmount,
    contractData: { ...contractData, contractNumber: '' },
  });

  contractData.contractNumber = contract.number;
  await repo.updateStatus(db, contract.id, 'generated', {
    contractData: contractData as unknown as Record<string, unknown>,
  });

  const token = generateToken();
  await repo.createSigningToken(db, {
    id: token.hash,
    contractId: contract.id,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
  });

  await notifications.sendContractReady({
    email: input.email,
    customerName: input.customerName,
    contractNumber: contract.number,
    orderNumber: input.orderNumber,
    signingToken: token.raw,
    language,
  });

  await repo.updateStatus(db, contract.id, 'sent', { sentAt: new Date() });

  if (input.orderId) {
    const first = input.items[0];
    const note =
      input.kind === 'renewal'
        ? `Renewal contract ${contract.number} sent for signing (${first?.startDate ?? '?'} → ${first?.endDate ?? '?'}).`
        : `Contract ${contract.number} sent to ${input.email} for signing.`;
    await insertContractEvent(db, {
      orderId: input.orderId,
      fromValue: null,
      toValue: 'sent',
      note,
      actorAdminUserId: input.actorAdminUserId ?? null,
    });
  }

  return contract;
}

export async function resend(db: Database, id: string): Promise<void> {
  const contract = await getById(db, id);
  if (contract.status === 'signed') throw conflict('Contract is already signed.');
  if (contract.status === 'voided') throw conflict('Contract is voided.');

  const token = generateToken();
  await repo.createSigningToken(db, {
    id: token.hash,
    contractId: contract.id,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
  });

  const data = contract.contractData as unknown as ContractData;
  await notifications.sendContractReady({
    email: data.customer.email,
    customerName: data.customer.fullName,
    contractNumber: contract.number,
    orderNumber: contract.orderNumber,
    signingToken: token.raw,
    language: contract.language as 'it' | 'en',
  });

  await repo.updateStatus(db, id, 'sent', { sentAt: new Date() });
}

export async function getSigningLink(db: Database, id: string): Promise<string> {
  const contract = await getById(db, id);
  if (contract.status === 'signed') throw conflict('Contract is already signed.');
  if (contract.status === 'voided') throw conflict('Contract is voided.');

  const token = generateToken();
  await repo.createSigningToken(db, {
    id: token.hash,
    contractId: contract.id,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
  });

  return links.contractSigningUrl(token.raw);
}

export async function updatePeriodAndResend(
  db: Database,
  id: string,
  from: string,
  to: string,
): Promise<ContractDetailRow> {
  const contract = await getById(db, id);
  if (contract.status === 'signed') throw conflict('Contract is already signed.');
  if (contract.status === 'voided') throw conflict('Contract is voided.');

  /* Duration moves with the dates: the contract prints both, and a 30-day span
     beside "3 days" would be a document contradicting itself. */
  const durationDays = periodDays(from, to);
  const data = { ...(contract.contractData as Record<string, unknown>) } as unknown as ContractData;
  data.items = data.items.map((item) => ({
    ...item,
    startDate: from,
    endDate: to,
    duration: durationDays,
    durationUnit: 'day' as const,
  }));

  await repo.updateStatus(db, id, contract.status, {
    contractData: data as unknown as Record<string, unknown>,
  });

  /* The order is the source the rentals page and reminder emails read, so its
     lines follow the contract — otherwise the customer signs one period while
     Rent Management chases another. */
  if (contract.orderId) {
    await updateRentalPeriods(db, contract.orderId, from, to, durationDays);
    await insertContractEvent(db, {
      orderId: contract.orderId,
      fromValue: contract.status,
      toValue: 'sent',
      note: `Contract ${contract.number} period updated to ${from} → ${to} and resent.`,
    });
  }

  await resend(db, id);
  return getById(db, id);
}

/** Whole days between two YYYY-MM-DD dates — the rental industry's count. */
function periodDays(from: string, to: string): number {
  return Math.max(
    1,
    Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000),
  );
}

export async function voidContract(
  db: Database,
  id: string,
  reason: string,
  adminUserId: string,
): Promise<ContractDetailRow> {
  const contract = await getById(db, id);
  if (contract.status === 'signed') throw conflict('Cannot void a signed contract.');
  if (contract.status === 'voided') throw conflict('Contract is already voided.');

  await repo.updateStatus(db, id, 'voided', {
    voidedAt: new Date(),
    voidedByAdminUserId: adminUserId,
    voidReason: reason,
  });

  if (contract.orderId) {
    await insertContractEvent(db, {
      orderId: contract.orderId,
      fromValue: contract.status,
      toValue: 'voided',
      note: `Contract ${contract.number} voided: ${reason}`,
      actorAdminUserId: adminUserId,
    });
  }

  return getById(db, id);
}

export async function loadForSigning(
  db: Database,
  rawToken: string,
): Promise<{ contract: ContractDetailRow; html: string }> {
  const hash = hashToken(rawToken);
  const result = await repo.findSigningToken(db, hash);
  if (!result) throw notFound('Signing token');

  const { token, contract } = result;
  if (token.consumedAt) throw httpError(410, 'This signing link has already been used.');
  if (token.expiresAt < new Date()) throw httpError(410, 'This signing link has expired.');
  if (contract.status === 'signed') throw conflict('Contract is already signed.');
  if (contract.status === 'voided') throw conflict('Contract has been voided.');

  if (!contract.viewedAt) {
    await repo.updateStatus(db, contract.id, 'viewed', { viewedAt: new Date() });
  }

  const render = TEMPLATE_MAP[contract.variant];
  const html = render(contract.contractData as unknown as ContractData);

  return { contract, html };
}

export async function sign(
  db: Database,
  rawToken: string,
  signatureDataUrl: string,
  ipAddress: string,
  userAgent: string,
): Promise<ContractDetailRow> {
  const hash = hashToken(rawToken);
  const result = await repo.findSigningToken(db, hash);
  if (!result) throw notFound('Signing token');

  const { token, contract } = result;
  if (token.consumedAt) throw httpError(410, 'This signing link has already been used.');
  if (token.expiresAt < new Date()) throw httpError(410, 'This signing link has expired.');
  if (contract.status === 'signed') throw conflict('Contract is already signed.');
  if (contract.status === 'voided') throw conflict('Contract has been voided.');

  await repo.consumeSigningToken(db, hash);
  await repo.updateStatus(db, contract.id, 'signed', {
    signedAt: new Date(),
    signatureData: { imageDataUrl: signatureDataUrl, ipAddress, userAgent },
  });

  const data = contract.contractData as unknown as ContractData;
  await notifications.sendContractSigned({
    email: data.customer.email,
    customerName: data.customer.fullName,
    contractNumber: contract.number,
    orderNumber: contract.orderNumber,
    language: contract.language as 'it' | 'en',
  });

  // The signature lands on the order's timeline, where the operator reads it.
  if (contract.orderId) {
    await insertContractEvent(db, {
      orderId: contract.orderId,
      fromValue: contract.status,
      toValue: 'signed',
      note: `Contract ${contract.number} signed by the customer.`,
    });
  }

  return getById(db, contract.id);
}

function defaultDamages(language: 'it' | 'en'): ContractData['damages'] {
  if (language === 'en') {
    return [
      { description: 'Scratches or cosmetic damage', amount: '50.00' },
      { description: 'Damaged wheels or tires', amount: '80.00' },
      { description: 'Bent or broken frame', amount: '200.00' },
      { description: 'Missing accessories (basket, cushion)', amount: '30.00' },
      { description: 'Electronic/motor damage (electric models)', amount: '350.00' },
      { description: 'Battery damage or loss (electric models)', amount: '250.00' },
      { description: 'Total loss or theft', amount: 'Full replacement value' },
    ];
  }
  return [
    { description: 'Graffi o danni estetici', amount: '50.00' },
    { description: 'Ruote o pneumatici danneggiati', amount: '80.00' },
    { description: 'Telaio piegato o rotto', amount: '200.00' },
    { description: 'Accessori mancanti (cestino, cuscino)', amount: '30.00' },
    { description: 'Danni al motore/elettronica (modelli elettrici)', amount: '350.00' },
    { description: 'Danno o smarrimento batteria (modelli elettrici)', amount: '250.00' },
    { description: 'Perdita totale o furto', amount: 'Valore integrale di sostituzione' },
  ];
}
