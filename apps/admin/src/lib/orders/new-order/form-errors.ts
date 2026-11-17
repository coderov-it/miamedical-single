/**
 * Where a failed field lives on screen. The server names a field by its path
 * (`items.1.startDate`, `delivery.address`); the form needs the DOM id of the
 * control that carries it so the first issue can take focus (lib/form-gate.ts),
 * and the wizard step that shows it so the page can go there first.
 */

import type { GateField } from '~/lib/form-gate';

import type { StepId } from './types';

const STATIC_IDS: Record<string, string> = {
  email: 'no-email',
  firstName: 'no-first-name',
  lastName: 'no-last-name',
  phone: 'no-phone',
  codiceFiscale: 'no-codice-fiscale',
  partitaIva: 'no-partita-iva',
  items: 'no-product-search',
  amount: 'no-discount-amount',
  'discount.amount': 'no-discount-amount',
  reason: 'no-discount-reason',
  'discount.reason': 'no-discount-reason',
  shippingTotal: 'no-shipping',
  'delivery.address': 'no-address',
  'delivery.pickupCity': 'no-pickup',
  'delivery.returnAddress': 'no-return-address',
  notes: 'no-notes',
};

const LINE_FIELD_IDS: Record<string, string> = {
  rentalPackageCode: 'package',
  startDate: 'date',
  startTime: 'time',
  quantity: 'quantity',
  addons: 'addons',
};

/** The control id for a field path, or null when nothing on screen carries it. */
export function controlId(path: string): string | null {
  const fixed = STATIC_IDS[path];
  if (fixed) return fixed;
  const line = /^items\.(\d+)\.(.+)$/.exec(path);
  if (!line) return null;
  const [, index, rest = ''] = line;
  const answer = /^answers\.(.+)$/.exec(rest);
  if (answer) return `no-line-${index}-answer-${answer[1]}`;
  const suffix = LINE_FIELD_IDS[rest];
  return suffix ? `no-line-${index}-${suffix}` : `no-line-${index}-package`;
}

/** The step that shows a field. An unknown path lands on the last step. */
export function stepOf(path: string): StepId {
  if (path === 'items') return 'products';
  if (path.startsWith('items.')) return 'packages';
  if (path.startsWith('discount.') || path === 'amount' || path === 'reason') return 'review';
  return 'customer';
}

const STEP_ORDER: StepId[] = ['products', 'packages', 'customer', 'review'];

/** Order on screen: by step, then by where the field sits in it. */
function rank(path: string): number {
  const base = STEP_ORDER.indexOf(stepOf(path)) * 10;
  if (path === 'email') return base;
  if (path.startsWith('delivery') || path === 'shippingTotal') return base + 2;
  if (path === 'notes') return base + 3;
  return base + 1;
}

/** Fields in the order they appear on screen, so focus lands on the topmost one. */
export function gateFields(issues: Record<string, string>): GateField[] {
  return Object.keys(issues)
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, undefined, { numeric: true }))
    .flatMap((key) => {
      const id = controlId(key);
      return id ? [{ key, id }] : [];
    });
}
