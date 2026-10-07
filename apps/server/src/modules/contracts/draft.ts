import type { RentalPeriod } from '@mia/pricing';
import type { ContractData, ContractLanguage } from '@mia/templates';

import { defaultDamages } from './render.ts';
import { resolveVariant, type VariantResult } from './variant.ts';

/**
 * What a contract says, before it has a number. One shape for every way a
 * contract comes to exist — the checkout's preview, the signed contract placement
 * writes, the admin's "Generate contract", a renewal and a manual contract — so
 * none of them can disagree about what goes on the paper.
 */
export interface ContractTerms {
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
}

/** The number a preview prints where an issued contract prints `CTR-…`. */
const DRAFT_NUMBER: Record<ContractLanguage, string> = { it: 'BOZZA', en: 'DRAFT' };

/** The variant the terms select, and the snapshot that variant renders. */
export function draftContract(
  terms: ContractTerms,
  contractNumber: string | null,
): { variant: VariantResult; data: ContractData } {
  const variant = resolveVariant(terms.customerType, terms.hasDepositProduct);
  const data: ContractData = {
    contractNumber: contractNumber ?? DRAFT_NUMBER[variant.language],
    orderNumber: terms.orderNumber,
    customer: {
      fullName: terms.customerName,
      email: terms.email,
      phone: terms.phone,
      address: terms.address,
      codiceFiscale: terms.codiceFiscale,
      partitaIva: terms.partitaIva,
      codiceUnivoco: terms.codiceUnivoco ?? null,
      customerType: terms.customerType,
    },
    items: terms.items,
    subtotal: terms.subtotal,
    shippingTotal: terms.shippingTotal,
    total: terms.total,
    currency: terms.currency,
    requiresDeposit: variant.requiresDeposit,
    depositAmount: variant.depositAmount,
    damages: terms.damages ?? defaultDamages(variant.language),
    generatedAt: new Date().toISOString().slice(0, 10),
  };
  return { variant, data };
}

/** An order line as both a stored `order_items` row and a resolved checkout line carry it. */
export interface ContractLine {
  productTitle: string;
  quantity: number;
  unitPrice: string;
  total: string;
  configuration: unknown;
}

/** The rented lines as contract rows. A sold line has nothing to sign and is left out. */
export function rentalItems(lines: ContractLine[]): ContractData['items'] {
  const items: ContractData['items'] = [];
  for (const line of lines) {
    const config = line.configuration as Record<string, unknown> | null;
    if (config?.pricingMode !== 'rental') continue;
    const rental = (config.rental as RentalPeriod | undefined) ?? null;
    items.push({
      productTitle: line.productTitle,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
      startDate: rental?.startDate ?? '',
      endDate: rental?.endDate ?? null,
      duration: rental?.duration ?? 1,
      durationUnit: (rental?.unit as 'hour' | 'day' | undefined) ?? 'day',
    });
  }
  return items;
}

/**
 * Summed over the contract's own rows. On a mixed order the contract covers the
 * rented aids, and quoting the whole order's total against them would hold the
 * customer to a figure the contract's own table does not add up to.
 */
export function contractTotals(
  items: ContractData['items'],
  shippingTotal: string,
): { subtotal: string; total: string } {
  const cents = items.reduce((sum, item) => sum + toCents(item.total), 0);
  return { subtotal: fromCents(cents), total: fromCents(cents + toCents(shippingTotal)) };
}

/** `"line1, postalCode city"` from an address snapshot, missing parts dropped; '' for none. */
export function addressLine(address: Record<string, unknown> | null): string {
  if (!address) return '';
  return [address.line1, [address.postalCode, address.city].filter(Boolean).join(' ')]
    .filter((part) => typeof part === 'string' && part !== '')
    .join(', ');
}

/** Cents-based decimal math — money strings are never fed to float arithmetic. */
export function toCents(amount: string): number {
  const [whole = '0', frac = ''] = amount.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0').slice(0, 2));
}

export function fromCents(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}
