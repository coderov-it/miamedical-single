/**
 * Where a failed field lives on screen. The server names a field by its path
 * (`items.1.startDate`, `delivery.address`); the form needs the DOM id of the
 * control that carries it so the first issue can take focus (lib/form-gate.ts).
 */

import type { GateField } from '~/lib/form-gate';

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

function rank(path: string): number {
  if (path === 'email') return 0;
  if (path in STATIC_IDS && !path.startsWith('delivery') && path !== 'items') {
    return path === 'amount' || path.startsWith('discount') || path === 'reason' ? 3 : 1;
  }
  if (path.startsWith('items')) return 2;
  if (path.startsWith('delivery') || path === 'shippingTotal') return 4;
  return 5;
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
