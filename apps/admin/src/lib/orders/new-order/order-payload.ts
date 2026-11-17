/**
 * The request body for `POST /api/admin/orders/manual`: choices only, no
 * amount a customer is charged — the server prices the lines itself.
 */

import { toWireItem } from './line-draft';
import type { OrderForm } from './order-form.svelte';
import { ZERO, blank } from './step-issues';

/** A typed field is sent; a blank one is left out so the server never stores "". */
const text = <K extends string>(key: K, value: string): { [P in K]?: string } =>
  blank(value) ? {} : ({ [key]: value.trim() } as { [P in K]?: string });

export function buildPayload(form: OrderForm) {
  const home = form.deliveryMethod === 'homeDelivery';
  return {
    email: form.email.trim(),
    ...(form.accountId ? { customerAccountId: form.accountId } : {}),
    ...text('firstName', form.firstName),
    ...text('lastName', form.lastName),
    ...text('phone', form.phone),
    ...(form.customerType ? { customerType: form.customerType } : {}),
    ...text('codiceFiscale', form.codiceFiscale),
    ...text('partitaIva', form.partitaIva),
    items: form.lines.map(toWireItem),
    delivery: {
      method: form.deliveryMethod,
      ...(home ? { address: { line1: form.address.trim() } } : {}),
      ...(home || !form.pickupCity ? {} : { pickupCity: form.pickupCity }),
      returnToSameAddress: form.returnToSameAddress,
      ...(form.returnToSameAddress ? {} : { returnAddress: form.returnAddress.trim() }),
    },
    shippingTotal: form.shippingTotal,
    ...(form.discountAmount === ZERO
      ? {}
      : { discount: { amount: form.discountAmount, reason: form.discountReason.trim() } }),
    ...text('notes', form.notes),
  };
}
