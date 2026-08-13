import { createHash, randomBytes } from 'node:crypto';

import type { Database } from '@mia/db';
import type { ContractData } from '@mia/templates';
import {
  carrozzInaItalian,
  carrozzinaTourist,
  scooterItalian,
  scooterTourist,
} from '@mia/templates';
import type { ContractVariant, ManualContractInput } from '@mia/validators';

import { conflict, httpError, notFound } from '../../shared/http/errors.ts';
import * as notifications from '../notifications/service.ts';
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

export async function getByOrderId(db: Database, orderId: string): Promise<ContractSummaryRow | undefined> {
  return repo.findByOrderId(db, orderId);
}

export async function renderPreview(db: Database, id: string): Promise<string> {
  const contract = await getById(db, id);
  const render = TEMPLATE_MAP[contract.variant];
  return render(contract.contractData as unknown as ContractData);
}

export interface GenerateForOrderInput {
  orderId: string;
  orderNumber: string;
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
}

interface IssueContractInput extends Omit<GenerateForOrderInput, 'orderId' | 'orderNumber'> {
  orderId: string | null;
  orderNumber: string | null;
}

export async function generateForOrder(
  db: Database,
  input: GenerateForOrderInput,
): Promise<{ id: string; number: string }> {
  return issueContract(db, input);
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
    sku: item.sku ?? '',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.total,
    startDate: item.startDate,
    endDate: item.endDate ?? null,
    rentalDays: item.rentalDays,
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
