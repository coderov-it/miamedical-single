import { toast } from 'svelte-sonner';

import { goto } from '$app/navigation';

import { api } from '~/lib/api';
import { errorMessage, unwrap } from '~/lib/request';
import { routes } from '~/lib/routes';
import { t } from '~/lib/ui-text';
import { blankItem, type ItemDraft } from './item-draft';
import { fromCents, toCents } from './money';
import { buildPayload } from './payload';
import type {
  ContractDataShape,
  ContractDetail,
  CustomerMatches,
  CustomerType,
  ProductList,
} from './types';

/**
 * The manual-contract form's shared state, handed to each section as a prop.
 * Sections own only their own lookup UI (query, open flag); everything that
 * ends up in the payload lives here.
 */
export class ContractForm {
  customerType = $state<CustomerType>('private');
  fullName = $state('');
  email = $state('');
  phone = $state('');
  address = $state('');
  codiceFiscale = $state('');
  partitaIva = $state('');
  codiceUnivoco = $state('');
  hasDepositProduct = $state(false);
  items = $state<ItemDraft[]>([blankItem()]);
  shippingTotal = $state('0.00');
  busy = $state(false);

  subtotal = $derived(fromCents(this.items.reduce((sum, item) => sum + toCents(item.total), 0)));
  total = $derived(fromCents(toCents(this.subtotal) + toCents(this.shippingTotal)));

  // Mirrors the server's variant matrix so the admin sees which of the four
  // contracts will be issued before submitting. The server resolves it again.
  previewVariant = $derived.by(() => {
    const isTourist = this.customerType === 'tourist';
    if (this.hasDepositProduct) return isTourist ? 'scooter_tourist' : 'scooter_italian';
    return isTourist ? 'carrozzina_tourist' : 'carrozzina_italian';
  });

  // Fiscal rules mirror the checkout, and the conditional rules
  // ManualContractSchema enforces server-side: tourists carry no Italian
  // fiscal identifier, a private customer needs a codice fiscale, a company
  // needs partita IVA and the codice univoco (SDI) its invoice is routed to.
  fiscalValid = $derived.by(() => {
    if (this.customerType === 'private') return this.codiceFiscale.trim().length > 0;
    if (this.customerType === 'company') {
      return this.partitaIva.trim().length > 0 && this.codiceUnivoco.trim().length > 0;
    }
    return true;
  });

  formValid = $derived(
    this.fullName.trim().length > 0 &&
      this.email.trim().length > 0 &&
      this.phone.trim().length > 0 &&
      this.address.trim().length > 0 &&
      this.fiscalValid &&
      this.items.length > 0 &&
      this.items.every((item) => item.productTitle.trim().length > 0 && item.startDate.length > 0),
  );

  /**
   * Prefill from an earlier contract: customer and items carry over, the rental
   * dates deliberately do not — a copied contract is a new rental period, and
   * stale dates on a legal document are worse than empty ones.
   */
  applyContract(data: ContractDataShape) {
    this.customerType = data.customer.customerType;
    this.fullName = data.customer.fullName;
    this.email = data.customer.email;
    this.phone = data.customer.phone;
    this.address = data.customer.address;
    this.codiceFiscale = data.customer.codiceFiscale ?? '';
    this.partitaIva = data.customer.partitaIva ?? '';
    this.codiceUnivoco = data.customer.codiceUnivoco ?? '';
    this.hasDepositProduct = data.requiresDeposit;
    this.shippingTotal = data.shippingTotal || '0.00';
    this.items = data.items.map((item) => ({
      productTitle: item.productTitle,
      quantity: item.quantity,
      duration: item.duration,
      durationUnit: item.durationUnit,
      unitPrice: item.unitPrice,
      total: item.total,
      startDate: '',
      startTime: '',
    }));
  }

  applyCustomer(match: CustomerMatches[number]) {
    // Orders that predate the customer-type column carry null — default to private.
    this.customerType = (match.customerType ?? 'private') as CustomerType;
    this.fullName = match.fullName;
    this.email = match.email;
    this.phone = match.phone ?? '';
    this.address = match.address;
    this.codiceFiscale = match.codiceFiscale ?? '';
    this.partitaIva = match.partitaIva ?? '';
  }

  applyProduct(index: number, product: ProductList[number]) {
    const item = this.items[index];
    if (!item) return;
    item.productTitle = product.title;
    /* A starting point for the operator to edit, not a price: a rental has no
       rate of its own, so its marketing headline stands in. */
    item.unitPrice = product.basePrice ?? product.marketingRate ?? '0.00';
    this.recomputeLineTotal(index);
  }

  /** Suggest the line total from price × quantity × days; still editable after. */
  recomputeLineTotal(index: number) {
    const item = this.items[index];
    if (!item) return;
    item.total = fromCents(toCents(item.unitPrice) * item.quantity * item.duration);
  }

  addItem() {
    this.items = [...this.items, blankItem()];
  }

  removeItem(index: number) {
    this.items = this.items.filter((_, i) => i !== index);
  }

  async create() {
    if (!this.formValid) return;
    this.busy = true;
    try {
      const res = await api.api.admin.contracts.manual.$post({ json: buildPayload(this) });
      const created = await unwrap<ContractDetail>(res);
      toast.success(
        t('contracts.toastCreated', { number: created.number, email: this.email.trim() }),
      );
      void goto(routes.contractDetail(created.id));
    } catch (err) {
      toast.error(errorMessage(err));
      this.busy = false;
    }
  }
}
