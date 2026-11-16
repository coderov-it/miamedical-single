import { endOf } from './item-draft';
import type { ContractForm } from './contract-form.svelte';

/** The body `POST /api/admin/contracts/manual` takes, from the trimmed form. */
export function buildPayload(form: ContractForm) {
  return {
    customerType: form.customerType,
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    codiceFiscale: form.codiceFiscale.trim() ? form.codiceFiscale.trim() : null,
    partitaIva: form.partitaIva.trim() ? form.partitaIva.trim() : null,
    codiceUnivoco: form.codiceUnivoco.trim() ? form.codiceUnivoco.trim() : null,
    hasDepositProduct: form.hasDepositProduct,
    items: form.items.map((item) => ({
      productTitle: item.productTitle.trim(),
      quantity: item.quantity,
      duration: item.duration,
      durationUnit: item.durationUnit,
      unitPrice: item.unitPrice,
      total: item.total,
      startDate: item.startDate,
      endDate: endOf(item)?.endDate ?? null,
    })),
    shippingTotal: form.shippingTotal,
  };
}
