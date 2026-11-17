import { toast } from 'svelte-sonner';

import { goto } from '$app/navigation';

import { api } from '~/lib/api';
import { focusFirstIssue } from '~/lib/form-gate';
import { Resource } from '~/lib/resource.svelte';
import { ApiError, errorFields, errorMessage, unwrap } from '~/lib/request';
import { routes } from '~/lib/routes';
import { t } from '~/lib/ui-text';
import { gateFields } from './form-errors';
import {
  type LineDraft,
  isLineReady,
  isRental,
  needsTime,
  newLine,
  toWireItem,
} from './line-draft';
import type {
  AccountMatch,
  CustomerType,
  DeliveryMethod,
  LineProduct,
  Quote,
  QuoteResult,
} from './types';

const ZERO = '0.00';
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const blank = (value: string) => value.trim() === '';

/**
 * The new-order form's shared state, handed to each section as a prop. Sections
 * own only their lookup UI (query, open flag). Money never comes from here: the
 * totals are whatever the server quoted for the lines as they stand.
 *
 * Validation follows the storefront rule (lib/form-gate.ts): the create button is
 * never disabled; a click marks every offending field, scrolls to the first and
 * focuses it. Client checks and the server's 422 `fields` share one `fields` map.
 */
export class OrderForm {
  // Customer
  accountId = $state<string | null>(null);
  pickedEmail = '';
  email = $state('');
  firstName = $state('');
  lastName = $state('');
  phone = $state('');
  customerType = $state<CustomerType | ''>('');
  codiceFiscale = $state('');
  partitaIva = $state('');

  // Lines, discount, delivery, notes
  lines = $state<LineDraft[]>([]);
  discountAmount = $state(ZERO);
  discountReason = $state('');
  shippingTotal = $state(ZERO);
  deliveryMethod = $state<DeliveryMethod>('homeDelivery');
  address = $state('');
  pickupCity = $state('');
  returnToSameAddress = $state(true);
  returnAddress = $state('');
  notes = $state('');

  fields = $state<Record<string, string>>({});
  busy = $state(false);

  readyItems = $derived(this.lines.filter(isLineReady).map(toWireItem));

  /** Re-priced whenever the lines, the delivery fee or the discount change. */
  quoteResource = new Resource<QuoteResult | null, string>(
    () =>
      JSON.stringify({
        items: this.readyItems,
        shippingTotal: this.shippingTotal,
        discountAmount: this.discountAmount,
      }),
    async (key, signal) => {
      const body = JSON.parse(key) as {
        items: ReturnType<typeof toWireItem>[];
        shippingTotal: string;
        discountAmount: string;
      };
      if (body.items.length === 0) return null;
      try {
        const res = await api.api.admin.orders.manual.quote.$post(
          { json: body },
          { init: { signal } },
        );
        return { quote: await unwrap<Quote>(res) };
      } catch (err) {
        if (err instanceof ApiError) return { message: err.message };
        throw err;
      }
    },
    { debounce: 300 },
  );

  quote = $derived.by(() => {
    const result = this.quoteResource.data;
    return result && 'quote' in result ? result.quote : null;
  });
  quoteProblem = $derived.by(() => {
    const result = this.quoteResource.data;
    return result && 'message' in result ? result.message : null;
  });

  // --- customer ---------------------------------------------------------------

  /** Picking an account fills what the agent would otherwise retype (decision 4). */
  pickAccount(match: AccountMatch) {
    this.accountId = match.id;
    this.pickedEmail = match.email;
    this.email = match.email;
    this.firstName = match.firstName;
    this.lastName = match.lastName;
    this.phone = match.phone ?? '';
    const prefill = match.prefill;
    this.customerType = prefill?.customerType ?? '';
    this.codiceFiscale = prefill?.codiceFiscale ?? '';
    this.partitaIva = prefill?.partitaIva ?? '';
    if (prefill?.address && blank(this.address)) this.address = prefill.address;
  }

  /** Typing a different email means the picked account is no longer the customer. */
  onEmailInput() {
    if (this.accountId && this.email.trim().toLowerCase() !== this.pickedEmail) {
      this.accountId = null;
    }
  }

  // --- lines ---------------------------------------------------------------------

  addLine(product: LineProduct) {
    const line = newLine(product);
    // A single package needs no choice, so it is taken for the agent.
    const only = product.packages.length === 1 ? product.packages[0] : undefined;
    if (only) line.packageCode = only.code;
    this.lines = [...this.lines, line];
  }

  removeLine(index: number) {
    this.lines = this.lines.filter((_, i) => i !== index);
  }

  // --- submit --------------------------------------------------------------------

  /** Everything the client can know is wrong without asking the server. */
  clientIssues(): Record<string, string> {
    const issues: Record<string, string> = {};
    if (!looksLikeEmail(this.email.trim())) issues.email = t('newOrder.errorEmail');
    if (this.lines.length === 0) issues.items = t('newOrder.errorNoLines');
    this.lines.forEach((line, index) => this.#lineIssues(line, index, issues));
    if (this.discountAmount !== ZERO && blank(this.discountReason)) {
      issues.reason = t('newOrder.errorReason');
    }
    if (this.deliveryMethod === 'homeDelivery' && blank(this.address)) {
      issues['delivery.address'] = t('newOrder.errorAddress');
    }
    if (this.deliveryMethod === 'storePickup' && blank(this.pickupCity)) {
      issues['delivery.pickupCity'] = t('newOrder.errorPickup');
    }
    if (!this.returnToSameAddress && blank(this.returnAddress)) {
      issues['delivery.returnAddress'] = t('newOrder.errorReturnAddress');
    }
    return issues;
  }

  #lineIssues(line: LineDraft, index: number, issues: Record<string, string>) {
    const at = `items.${index}`;
    if (!isRental(line)) return;
    if (!line.packageCode) issues[`${at}.rentalPackageCode`] = t('newOrder.errorPackage');
    if (!line.startDate) issues[`${at}.startDate`] = t('newOrder.errorStartDate');
    if (needsTime(line) && !line.startTime)
      issues[`${at}.startTime`] = t('newOrder.errorStartTime');
  }

  #payload() {
    /** A typed field is sent; a blank one is left out so the server never stores "". */
    const text = <K extends string>(key: K, value: string): { [P in K]?: string } =>
      blank(value) ? {} : ({ [key]: value.trim() } as { [P in K]?: string });
    return {
      email: this.email.trim(),
      ...(this.accountId ? { customerAccountId: this.accountId } : {}),
      ...text('firstName', this.firstName),
      ...text('lastName', this.lastName),
      ...text('phone', this.phone),
      ...(this.customerType ? { customerType: this.customerType } : {}),
      ...text('codiceFiscale', this.codiceFiscale),
      ...text('partitaIva', this.partitaIva),
      items: this.lines.map(toWireItem),
      delivery: {
        method: this.deliveryMethod,
        ...(this.deliveryMethod === 'homeDelivery'
          ? { address: { line1: this.address.trim() } }
          : {}),
        ...(this.deliveryMethod === 'storePickup' ? { pickupCity: this.pickupCity.trim() } : {}),
        returnToSameAddress: this.returnToSameAddress,
        ...(this.returnToSameAddress ? {} : { returnAddress: this.returnAddress.trim() }),
      },
      shippingTotal: this.shippingTotal,
      ...(this.discountAmount === ZERO
        ? {}
        : { discount: { amount: this.discountAmount, reason: this.discountReason.trim() } }),
      ...text('notes', this.notes),
    };
  }

  #mark(issues: Record<string, string>) {
    this.fields = issues;
    focusFirstIssue(issues, gateFields(issues));
  }

  async create() {
    const issues = this.clientIssues();
    if (Object.keys(issues).length > 0) {
      this.#mark(issues);
      return;
    }
    this.fields = {};
    this.busy = true;
    try {
      const res = await api.api.admin.orders.manual.$post({ json: this.#payload() });
      const created = await unwrap<{ id: string; number: string }>(res);
      toast.success(t('newOrder.toastCreated', { number: created.number }));
      void goto(routes.orderDetail(created.id));
    } catch (err) {
      const fields = errorFields(err);
      if (Object.keys(fields).length > 0) this.#mark(fields);
      else toast.error(errorMessage(err));
      this.busy = false;
    }
  }
}
