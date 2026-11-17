import type { BranchCity } from '@mia/validators/branches';
import { tick } from 'svelte';
import { toast } from 'svelte-sonner';

import { goto } from '$app/navigation';

import { api } from '~/lib/api';
import { focusFirstIssue } from '~/lib/form-gate';
import { Resource } from '~/lib/resource.svelte';
import { ApiError, errorFields, errorMessage, unwrap } from '~/lib/request';
import { routes } from '~/lib/routes';
import { t } from '~/lib/ui-text';
import { gateFields, stepOf } from './form-errors';
import { type LineDraft, isLineReady, newLine, toWireItem } from './line-draft';
import { buildPayload } from './order-payload';
import { ZERO, blank, stepIssues } from './step-issues';
import {
  type AccountMatch,
  type CustomerType,
  type DeliveryMethod,
  type LineCard,
  type LineProduct,
  type Quote,
  type QuoteResult,
  STEPS,
} from './types';

/**
 * The new-order wizard's shared state, handed to each step as a prop. Steps own
 * only their lookup UI (query, open flag). Money never comes from here: every
 * figure is whatever the server quoted for the lines as they stand.
 *
 * Validation follows the storefront rule (lib/form-gate.ts): Next and Create are
 * never disabled; a click marks every offending field, scrolls to the first and
 * focuses it. Client checks and the server's 422 `fields` share one `fields` map,
 * and a failure on another step takes the wizard to the step that shows it.
 */
export class OrderForm {
  // Customer
  accountId = $state<string | null>(null);
  /** The account picked from the lookup, kept whole for the customer card. */
  picked = $state.raw<AccountMatch | null>(null);
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
  pickupCity = $state<BranchCity | ''>('');
  returnToSameAddress = $state(true);
  returnAddress = $state('');
  notes = $state('');

  fields = $state<Record<string, string>>({});
  busy = $state(false);

  /** Index into STEPS; `reached` is the furthest step Next has let through. */
  step = $state(0);
  reached = $state(0);

  /** Cards clicked whose choices are still loading, by product id. */
  pendingCards = $state.raw<Map<string, LineCard>>(new Map());

  selectedIds = $derived(new Set(this.lines.map((line) => line.product.id)));

  readyItems = $derived(this.lines.filter(isLineReady).map(toWireItem));

  /** Re-priced whenever the lines, the delivery fee or the discount change. */
  quoteResource = new Resource<(QuoteResult & { key: string }) | null, string>(
    () => this.quoteKey,
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
        return { key, quote: await unwrap<Quote>(res) };
      } catch (err) {
        if (err instanceof ApiError) return { key, message: err.message };
        throw err;
      }
    },
    { debounce: 300 },
  );

  /**
   * What the quote is for, as a string. A `$derived` string, not a method: a click that
   * changes nothing priceable (a package on a line still without its date) rebuilds
   * `readyItems` but yields the same string, so no request — and no spinner — follows.
   */
  quoteKey = $derived(
    JSON.stringify({
      items: this.readyItems,
      shippingTotal: this.shippingTotal,
      discountAmount: this.discountAmount,
    }),
  );

  /**
   * The money on screen is not for the current choices yet: true from the moment a
   * package, date, quantity, fee or discount changes — through the debounce — until the
   * matching quote lands. Totals dim while it holds.
   */
  quoting = $derived.by(() => {
    if (this.readyItems.length === 0) return false;
    return this.quoteResource.loading || this.quoteResource.data?.key !== this.quoteKey;
  });

  /** The wire items the figures on screen were quoted for, one JSON string each. */
  #quotedItems = $derived.by(() => {
    const key = this.quoteResource.data?.key;
    if (!key) return new Set<string>();
    const body = JSON.parse(key) as { items: unknown[] };
    return new Set(body.items.map((item) => JSON.stringify(item)));
  });

  /**
   * Only the line whose own choices changed waits on the new quote. A line that cannot be
   * priced yet (no package or date) never spins — it shows what it still needs instead.
   */
  lineQuoting(line: LineDraft): boolean {
    if (!this.quoting || !isLineReady(line)) return false;
    return !this.#quotedItems.has(JSON.stringify(toWireItem(line)));
  }

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
    this.picked = match;
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

  /** "Change": back to an empty customer, ready for another email. */
  clearAccount() {
    this.accountId = null;
    this.picked = null;
    this.email = '';
    this.firstName = '';
    this.lastName = '';
    this.phone = '';
    this.customerType = '';
    this.codiceFiscale = '';
    this.partitaIva = '';
  }

  // --- lines ---------------------------------------------------------------------

  /** Details already fetched, by product id, so a second click on a card costs nothing. */
  #details = new Map<string, LineProduct>();
  #inflight = new Map<string, Promise<LineProduct>>();

  /** The choices of a product: cached, or the request already running, or a new one. */
  #detail(card: LineCard): Promise<LineProduct> {
    const known = this.#details.get(card.id);
    if (known) return Promise.resolve(known);
    const running = this.#inflight.get(card.id);
    if (running) return running;
    const request = api.api.admin.orders.manual.products[':id']
      .$get({ param: { id: card.id } })
      .then((res) => unwrap<LineProduct>(res))
      .then((product) => {
        this.#details.set(card.id, product);
        return product;
      })
      .finally(() => this.#inflight.delete(card.id));
    this.#inflight.set(card.id, request);
    return request;
  }

  /** Hovering or focusing a card starts loading its choices, so the click is usually instant. */
  prefetch(card: LineCard) {
    if (!card.inStock) return;
    void this.#detail(card).catch(() => undefined);
  }

  /**
   * A product card toggles. The first click shows it in the summary at once, from the card
   * itself, and the line replaces that row when its choices (packages, add-ons, questions)
   * arrive. A click on a selected or still-loading card takes it off, and a late response
   * for a card that was taken off is dropped.
   */
  async toggleProduct(card: LineCard) {
    const index = this.lines.findIndex((line) => line.product.id === card.id);
    if (index >= 0) {
      this.removeLine(index);
      return;
    }
    if (this.pendingCards.has(card.id)) {
      this.cancelPending(card.id);
      return;
    }
    if (!card.inStock) {
      toast.error(t('newOrder.outOfStock', { title: card.title }));
      return;
    }
    this.pendingCards = new Map(this.pendingCards).set(card.id, card);
    this.clear('items');
    try {
      const product = await this.#detail(card);
      if (!this.pendingCards.has(card.id)) return;
      const line = newLine(product);
      // A single package needs no choice, so it is taken for the agent.
      const only = product.packages.length === 1 ? product.packages[0] : undefined;
      if (only) line.packageCode = only.code;
      this.lines = [...this.lines, line];
      this.cancelPending(card.id);
    } catch (err) {
      if (this.pendingCards.has(card.id)) toast.error(errorMessage(err));
      this.cancelPending(card.id);
    }
  }

  /** Drops a card that is still loading; its response, when it lands, is ignored. */
  cancelPending(id: string) {
    this.pendingCards = new Map([...this.pendingCards].filter(([key]) => key !== id));
  }

  removeLine(index: number) {
    this.lines = this.lines.filter((_, i) => i !== index);
    this.fields = {};
  }

  /** The quoted figures of a line, matched by position among the lines that can be priced. */
  quoteLine(line: LineDraft) {
    const ready = this.lines.filter(isLineReady);
    const at = ready.indexOf(line);
    return at < 0 ? null : (this.quote?.lines[at] ?? null);
  }

  /** Drops one field's message once the agent has answered it. */
  clear(key: string) {
    if (!this.fields[key]) return;
    this.fields = Object.fromEntries(Object.entries(this.fields).filter(([k]) => k !== key));
  }

  // --- navigation -------------------------------------------------------------

  /** Marks the issues, goes to the step of the first, and focuses its control. */
  async #mark(issues: Record<string, string>) {
    this.fields = issues;
    const first = gateFields(issues)[0];
    if (first) this.step = STEPS.findIndex((entry) => entry.id === stepOf(first.key));
    await tick();
    focusFirstIssue(issues, gateFields(issues));
  }

  /** Issues of one step, marked on screen. Returns whether the step is clean. */
  async #check(index: number): Promise<boolean> {
    const step = STEPS[index];
    const issues = step ? stepIssues(this, step.id) : {};
    if (Object.keys(issues).length === 0) return true;
    await this.#mark(issues);
    return false;
  }

  /** Next: the step must be clean before the wizard moves on. */
  async next() {
    // A card clicked a moment ago is a product of this order: let its line land first.
    if (this.pendingCards.size > 0) {
      await Promise.allSettled([...this.#inflight.values()]);
      await tick();
    }
    if (!(await this.#check(this.step))) return;
    this.fields = {};
    this.enter(Math.min(this.step + 1, STEPS.length - 1));
  }

  back() {
    this.enter(Math.max(this.step - 1, 0));
  }

  /** The stepper: a step behind is free, one ahead needs every step before it to pass. */
  async goTo(index: number) {
    for (let at = this.step; at < index; at++) {
      this.step = at;
      if (!(await this.#check(at))) return;
    }
    this.fields = {};
    this.enter(index);
  }

  enter(index: number) {
    this.step = index;
    this.reached = Math.max(this.reached, index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- submit --------------------------------------------------------------------

  async create() {
    for (let at = 0; at < STEPS.length; at++) {
      if (!(await this.#check(at))) return;
    }
    this.fields = {};
    this.busy = true;
    try {
      const res = await api.api.admin.orders.manual.$post({ json: buildPayload(this) });
      const created = await unwrap<{ id: string; number: string }>(res);
      toast.success(t('newOrder.toastCreated', { number: created.number }));
      void goto(routes.orderDetail(created.id));
    } catch (err) {
      const fields = errorFields(err);
      if (Object.keys(fields).length > 0) await this.#mark(fields);
      else toast.error(errorMessage(err));
      this.busy = false;
    }
  }
}
