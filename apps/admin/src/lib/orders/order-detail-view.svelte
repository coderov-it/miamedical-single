<!--
  The whole order, rendered identically whether it arrived as a routed page or
  as the queue's drawer. One component is the point: a shareable link and a
  triage glance must never disagree about what an order says.

  Blocked actions stay *visible*, disabled, with the missing permission named.
  Hiding a button teaches nobody the order in which work happens — someone
  without ORDER_UPDATE should still be able to see that "Mark fulfilled" is the
  next step, and go ask for it by name.
-->
<script lang="ts">
  import { P, permissionByCode } from '@mia/permissions';
  import CheckIcon from '@lucide/svelte/icons/check';
  import FileSignatureIcon from '@lucide/svelte/icons/file-signature';
  import LockIcon from '@lucide/svelte/icons/lock';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { api } from '~/lib/api';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import StatusBadge from '~/lib/components/status-badge.svelte';
  import OrderItemsCard from '~/lib/orders/order-items-card.svelte';
  import OrderTimelineCard from '~/lib/orders/order-timeline-card.svelte';
  import { cn } from '$lib/utils.js';
  import { contractStatusMeta, variantLabel } from '~/lib/contracts/status';
  import {
    EM_DASH,
    formatDate,
    formatDateTime,
    formatMoney,
    orDash,
    relativeTime,
  } from '~/lib/format';
  import { FULFILMENT_STEPS, orderStatusMeta, type OrderStatus } from '~/lib/orders/status';
  import { errorMessage, unwrap } from '~/lib/request';
  import type { OrderAddress, OrderDetail } from '~/lib/orders/types';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  interface Props {
    order: OrderDetail;
    /** Hand back the refreshed order so the list and the drawer stay in step. */
    onUpdated: (order: OrderDetail) => void;
    /** The drawer trims the header; the routed page carries its own. */
    compact?: boolean;
  }

  let { order, onUpdated, compact = false }: Props = $props();

  const canUpdate = $derived(session.can(P.ORDER_UPDATE));
  const updateKey = permissionByCode(P.ORDER_UPDATE)?.key ?? 'order:update';

  let busy = $state<string | null>(null);
  let note = $state('');

  // Where the order sits on the happy path. `-1` for an exit status, which is
  // what greys the whole stepper out rather than pretending it is step one.
  const stepIndex = $derived(FULFILMENT_STEPS.indexOf(order.status as OrderStatus));

  /**
   * The two endpoints take different literal unions for `to`, so they cannot
   * share a call site without widening to `string` and losing the check. What
   * they *can* share is everything around it — the busy key, the note, the
   * toast and the error handling.
   */
  async function run(
    key: string,
    request: () => Promise<Response>,
    describe: (o: OrderDetail) => string,
  ) {
    busy = key;
    try {
      const updated = await unwrap<OrderDetail>(await request());
      note = '';
      onUpdated(updated);
      toast.success(describe(updated));
    } catch (err) {
      // The server's 409 explains what *would* work; show it verbatim rather
      // than flattening it to "something went wrong".
      toast.error(errorMessage(err));
    } finally {
      busy = null;
    }
  }

  const notePayload = () => (note.trim() ? { note: note.trim() } : {});

  function moveStatus(to: OrderStatus) {
    void run(
      `status:${to}`,
      () =>
        api.api.admin.orders[':id'].status.$post({
          param: { id: order.id },
          json: { to, ...notePayload() },
        }),
      (updated) =>
        `Order ${updated.number} is now ${orderStatusMeta(updated.status).label.toLowerCase()}.`,
    );
  }

  const ADDRESS_FIELDS = [
    'fullName',
    'line1',
    'line2',
    'postalCode',
    'city',
    'region',
    'country',
    'phone',
  ] as const satisfies ReadonlyArray<keyof OrderAddress>;

  /**
   * Most orders bill to the address they ship to, and two identical cards are a
   * second thing to read that says nothing — they also hand the sidebar a card's
   * worth of height the order beside it has no content to match. Matching
   * addresses collapse to one card whose title names both; differing ones stand
   * apart, which is the case an operator has to notice.
   */
  function addressCards() {
    const shipping = order.shippingAddress;
    const billing = order.billingAddress;
    const same =
      shipping !== null &&
      billing !== null &&
      ADDRESS_FIELDS.every((field) => shipping[field] === billing[field]);
    if (same) return [{ title: 'Shipping & billing', value: shipping }];
    return [
      { title: 'Shipping', value: shipping },
      { title: 'Billing', value: billing },
    ].filter((entry) => entry.value !== null);
  }

  const addresses = $derived(addressCards());

  /**
   * How the order changes hands, in one line an operator can act on.
   *
   * The method comes back as its wire id, so it is titled here rather than shown
   * raw — and an id this build has never heard of falls through to itself instead
   * of to a blank, which is what makes an older stored order still readable.
   */
  const DELIVERY_LABELS: Record<string, string> = {
    homeDelivery: 'Home delivery',
    storePickup: 'Collection from a branch',
  };

  const delivery = $derived(order.delivery);
  const deliveryMethod = $derived(
    delivery ? (DELIVERY_LABELS[delivery.method] ?? delivery.method) : null,
  );
  /** The one detail the chosen method carries. */
  const deliveryDetail = $derived(
    [delivery?.deliveryAddress, delivery?.deliveryPostalCode, delivery?.pickupCity]
      .filter(Boolean)
      .join(' · '),
  );

  /**
   * Where the rental is collected from at the end.
   *
   * Only rendered when it is NOT the delivery address, because that is the case
   * that changes somebody's route. Saying "same address" on every order would put
   * a line on the card that never means anything.
   */
  const returnAddress = $derived(
    delivery && delivery.returnToSameAddress === false ? delivery.returnAddress : null,
  );

  /**
   * Whether this order still owes a delivery figure.
   *
   * Nothing prices delivery — every order is placed at 0,00 € and the storefront
   * has told the customer we will contact them about it — so a home delivery
   * sitting at zero is not free, it is UNAGREED, and it is the one thing on this
   * page an operator has to go and do. A collection owes nothing and says nothing.
   */
  const deliveryOwed = $derived(
    delivery?.method === 'homeDelivery' && Number(order.totals.shippingTotal) === 0,
  );

  /**
   * The amount an operator types after the phone call.
   *
   * A WRITABLE derived: the field owns it while it is being typed into, and any
   * fresh order arriving from the server resets it. That is what stops a status
   * move landing underneath this card from leaving a stale figure sitting in it.
   */
  let shippingDraft = $derived(order.totals.shippingTotal);

  function saveShipping() {
    void run(
      'shipping',
      () =>
        api.api.admin.orders[':id'].$patch({
          param: { id: order.id },
          json: { shippingTotal: shippingDraft },
        }),
      (updated) =>
        `Delivery on ${updated.number} is ${formatMoney(
          updated.totals.shippingTotal,
          updated.totals.currency,
        )}.`,
    );
  }

  const CUSTOMER_TYPE_LABELS: Record<string, string> = {
    private: 'Private customer',
    company: 'Company',
    tourist: 'Tourist',
  };

  /**
   * Checkout takes whatever email it is given, so matching an existing account is
   * a claim until the customer confirms it from their own session. These labels
   * exist so the panel never presents an unconfirmed match as an identity.
   */
  const CUSTOMER_LINK_LABELS: Record<string, string> = {
    unverified: 'Account matched by email · unconfirmed',
    confirmed: 'Account confirmed by the customer',
    rejected: 'Account link rejected by the customer',
  };

  type ContractSummaries = InferResponseType<
    (typeof api.api.admin.contracts)['by-order'][':orderId']['$get'],
    200
  >['data'];

  const orderContracts = new Resource(
    () => order.id,
    async (id, signal) =>
      unwrap<ContractSummaries>(
        await api.api.admin.contracts['by-order'][':orderId'].$get(
          { param: { orderId: id } },
          { init: { signal } },
        ),
      ),
    { enabled: () => session.can(P.CONTRACT_READ) },
  );

  /** Whether anything on this order is rented — the case where a contract is owed. */
  const hasRental = $derived(
    order.items.some((item) => item.configuration?.pricingMode === 'rental'),
  );
  /** Newest first from the server; the first non-voided one is the live one. */
  const liveContract = $derived(
    orderContracts.data?.find((contract) => contract.status !== 'voided') ?? null,
  );

  let generating = $state(false);

  async function generateContract() {
    generating = true;
    try {
      await unwrap(await api.api.admin.contracts.generate.$post({ json: { orderId: order.id } }));
      orderContracts.refresh();
      toast.success('Contract generated and sent for signing.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      generating = false;
    }
  }
</script>

<!--
  `@container`, not viewport breakpoints: this same markup renders full width
  on the routed page and inside a ~750px drawer. Keying the columns to the
  viewport would hand the drawer a three-column layout it has no room for.
-->
<div class="@container space-y-5">
  {#if !compact}
    <div class="flex flex-wrap items-center gap-3">
      <h2 class="font-mono text-lg font-semibold tracking-tight">{order.number}</h2>
      <StatusBadge status={order.status} dot />
      <StatusBadge status={order.paymentStatus} kind="payment" dot />
      <span class="ml-auto text-sm text-muted-foreground">
        Placed {formatDateTime(order.placedAt)}
      </span>
    </div>
  {/if}

  <!-- Money strip. Every figure comes from the server as a decimal string. -->
  <div class="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border @2xl:grid-cols-5">
    {#each [{ label: 'Subtotal', value: order.totals.subtotal }, { label: 'Shipping', value: order.totals.shippingTotal }, { label: 'Tax', value: order.totals.taxTotal }, { label: 'Discount', value: order.totals.discountTotal }] as entry (entry.label)}
      <div class="bg-card px-3 py-2.5">
        <p class="text-xs text-muted-foreground">{entry.label}</p>
        <p class="mt-0.5 text-sm tabular-nums">
          {formatMoney(entry.value, order.totals.currency)}
        </p>
      </div>
    {/each}
    <!-- Five figures over two columns leaves a sixth cell showing as a grey
         box, so the total takes the whole last row rather than half of it. -->
    <div class="col-span-2 bg-card px-3 py-2.5 @2xl:col-span-1">
      <p class="text-xs text-muted-foreground">Total</p>
      <p class="mt-0.5 text-sm font-semibold tabular-nums">
        {formatMoney(order.totals.total, order.totals.currency)}
      </p>
    </div>
  </div>

  <!-- Fulfilment stepper: the happy path only. -->
  <div class="flex items-center gap-2">
    {#each FULFILMENT_STEPS as step, index (step)}
      {@const done = stepIndex >= 0 && index <= stepIndex}
      <div class="flex items-center gap-2">
        <span
          class={cn(
            'flex size-5 items-center justify-center rounded-full border text-[0.625rem] font-medium',
            done
              ? 'border-transparent bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground',
          )}
        >
          {#if done}<CheckIcon class="size-3" />{:else}{index + 1}{/if}
        </span>
        <span class={cn('text-sm', done ? 'font-medium' : 'text-muted-foreground')}>
          {orderStatusMeta(step).label}
        </span>
      </div>
      {#if index < FULFILMENT_STEPS.length - 1}
        <span class={cn('h-px w-6 shrink-0', stepIndex > index ? 'bg-primary' : 'bg-border')}
        ></span>
      {/if}
    {/each}
    {#if stepIndex < 0}
      <span class="ml-2 text-sm text-muted-foreground">
        — {orderStatusMeta(order.status).label.toLowerCase()}, so the path above ended early.
      </span>
    {/if}
  </div>

  <!--
    Three grid children, not two columns with a trailer underneath: the sidebar
    spans both rows so Actions can sit under the items at width. A short order —
    one line, two timeline entries — used to end the main column halfway up the
    address cards beside it and leave the rest of the row blank. Stacked (the
    drawer, a narrow window) the placements drop away and Actions is last again,
    after everything there is to read.

    The second row is `1fr` and the items align to `start` so that a sidebar
    taller than both cards beside it spends the difference *below* Actions,
    at the bottom of the page, instead of splitting it into a gap between them.
  -->
  <div class="grid gap-5 @4xl:grid-cols-3 @4xl:grid-rows-[auto_1fr] @4xl:items-start">
    <div class="space-y-5 @4xl:col-span-2 @4xl:col-start-1 @4xl:row-start-1">
      <OrderItemsCard items={order.items} currency={order.totals.currency} />
      <OrderTimelineCard events={order.events} />
    </div>

    <div class="space-y-5 @4xl:col-start-3 @4xl:row-span-2 @4xl:row-start-1">
      <Card.Root class="gap-0 py-0">
        <div class="border-b px-4 py-2.5 text-sm font-medium">Customer</div>
        <div class="space-y-1 p-4 text-sm">
          <p>{order.email}</p>
          {#if order.phone}
            <!-- A tel: link, because the whole flow ends in a phone call. -->
            <p><a class="hover:underline" href={`tel:${order.phone}`}>{order.phone}</a></p>
          {/if}
          {#if order.customerType}
            <p class="text-muted-foreground">
              {CUSTOMER_TYPE_LABELS[order.customerType] ?? order.customerType}
            </p>
          {/if}
          {#if order.partitaIva}
            <p class="text-muted-foreground">
              Partita IVA <span class="font-mono">{order.partitaIva}</span>
            </p>
          {/if}
          {#if order.codiceFiscale}
            <p class="text-muted-foreground">
              Codice fiscale <span class="font-mono">{order.codiceFiscale}</span>
            </p>
          {/if}
          <!-- An order is attached to an account on an email match alone, so the
               status beside it is what says whether anyone has vouched for that
               match. Never show "Registered account" on its own: unconfirmed and
               confirmed look identical, and only one of them is evidence. -->
          <p class="text-muted-foreground">
            {order.customerAccountId
              ? CUSTOMER_LINK_LABELS[order.customerLinkStatus]
              : order.customerLinkStatus === 'rejected'
                ? 'Account link rejected by the customer'
                : 'Guest checkout'}
          </p>
          <p class="text-muted-foreground">Placed {relativeTime(order.placedAt)}</p>
        </div>
      </Card.Root>

      {#if delivery}
        <Card.Root class="gap-0 py-0">
          <div class="border-b px-4 py-2.5 text-sm font-medium">Delivery</div>
          <div class="space-y-1 p-4 text-sm">
            <p class="font-medium">{deliveryMethod}</p>
            {#if deliveryDetail}
              <p class="text-muted-foreground">{deliveryDetail}</p>
            {/if}
            <!-- An unagreed delivery records 0,00 €, so the amount alone would
                 read as free. The line beside it is what says a figure is owed. -->
            <p class="flex items-center gap-2 tabular-nums">
              <span class="text-muted-foreground">
                {formatMoney(order.totals.shippingTotal, order.totals.currency)}
              </span>
              {#if deliveryOwed}
                <span class="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  To agree by phone
                </span>
              {/if}
            </p>

            <!-- Where the agreed amount lands. The only way a delivery fee ever
                 reaches an order, which is why it sits on the card the operator is
                 already reading rather than behind an edit screen. Saving
                 re-derives the order total on the server. -->
            {#if canUpdate}
              <div class="flex items-end gap-2 pt-2">
                <MoneyInput
                  label="Delivery fee"
                  bind:value={shippingDraft}
                  suffix={order.totals.currency}
                  disabled={busy !== null}
                  dense
                />
                <Button
                  size="sm"
                  variant="outline"
                  class="h-8"
                  disabled={busy !== null || shippingDraft === order.totals.shippingTotal}
                  onclick={saveShipping}
                >
                  {busy === 'shipping' ? 'Saving…' : 'Save'}
                </Button>
              </div>
            {/if}
            <!-- A different collection address is a second stop on somebody's day,
                 so it is called out rather than folded into the detail line. -->
            {#if returnAddress}
              <p class="pt-1">
                <span class="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Collect from
                </span>
                <span class="text-muted-foreground">{returnAddress}</span>
              </p>
            {/if}
          </div>
        </Card.Root>
      {/if}

      <!-- Contract. Renewals stack up, so this card reads as a history: the
           live contract on top, every earlier one dated beneath it. -->
      <Card.Root class="gap-0 py-0">
        <div class="border-b px-4 py-2.5 text-sm font-medium">Contract</div>
        <div class="p-4 text-sm">
          {#if orderContracts.loading && !orderContracts.data}
            <p class="text-muted-foreground">Loading…</p>
          {:else if liveContract}
            {@const cMeta = contractStatusMeta(liveContract.status)}
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <Badge variant="outline" class={cMeta.tone}>
                  <span class={cn('size-1.5 rounded-full', cMeta.dot)}></span>
                  {cMeta.label}
                </Badge>
                <span class="font-mono text-xs text-muted-foreground">{liveContract.number}</span>
              </div>
              <p class="text-muted-foreground">{variantLabel(liveContract.variant)}</p>
              {#if liveContract.status !== 'signed'}
                <!-- The one fact an operator must not miss: no signature, no
                     money and no goods. It gates "Mark paid" on the server. -->
                <p class="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Contract not signed — the order cannot be marked paid yet.
                </p>
              {:else}
                <p class="text-xs text-muted-foreground">
                  Signed {liveContract.signedAt ? formatDateTime(liveContract.signedAt) : ''}
                </p>
              {/if}
              <Button
                href={routes.contractDetail(liveContract.id)}
                variant="outline"
                size="sm"
                class="w-full"
              >
                <FileSignatureIcon class="size-4" />
                View contract
              </Button>

              {#if (orderContracts.data?.length ?? 0) > 1}
                <div class="space-y-1 border-t pt-2">
                  <p class="text-xs font-medium text-muted-foreground">History</p>
                  {#each orderContracts.data ?? [] as history (history.id)}
                    {#if history.id !== liveContract.id}
                      {@const hMeta = contractStatusMeta(history.status)}
                      <p class="flex items-center gap-2 text-xs">
                        <a
                          href={routes.contractDetail(history.id)}
                          class="font-mono hover:underline"
                        >
                          {history.number}
                        </a>
                        <span class={hMeta.tone}>{hMeta.label}</span>
                        <span class="ml-auto text-muted-foreground">
                          {formatDate(history.createdAt)}
                        </span>
                      </p>
                    {/if}
                  {/each}
                </div>
              {/if}
            </div>
          {:else if !hasRental}
            <p class="text-muted-foreground">
              Nothing on this order is rented, so no rental contract applies.
            </p>
          {:else}
            <div class="space-y-2">
              <p class="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Contract not signed — no contract has been generated for this rental.
              </p>
              {#if session.can(P.CONTRACT_CREATE)}
                <Button
                  variant="outline"
                  size="sm"
                  class="w-full"
                  disabled={generating}
                  onclick={generateContract}
                >
                  {#if generating}<Spinner />{/if}
                  <FileSignatureIcon class="size-4" />
                  Generate contract
                </Button>
              {/if}
            </div>
          {/if}
        </div>
      </Card.Root>

      {#each addresses as entry (entry.title)}
        {@const address = entry.value}
        <Card.Root class="gap-0 py-0">
          <div class="border-b px-4 py-2.5 text-sm font-medium">{entry.title}</div>
          <address class="space-y-0.5 p-4 text-sm not-italic">
            <p>{orDash(address?.fullName)}</p>
            <p class="text-muted-foreground">{orDash(address?.line1)}</p>
            {#if address?.line2}<p class="text-muted-foreground">{address.line2}</p>{/if}
            <p class="text-muted-foreground">
              {orDash(address?.postalCode)}
              {orDash(address?.city)}{address?.region ? ` (${address.region})` : ''}
            </p>
            <p class="text-muted-foreground">{orDash(address?.country)}</p>
            {#if address?.phone}<p class="text-muted-foreground">{address.phone}</p>{/if}
          </address>
        </Card.Root>
      {/each}

      {#if order.notes}
        <Card.Root class="gap-0 py-0">
          <div class="border-b px-4 py-2.5 text-sm font-medium">Notes</div>
          <p class="p-4 text-sm whitespace-pre-wrap">{order.notes}</p>
        </Card.Root>
      {/if}
    </div>

    <!-- Actions last in the reading order, and at width the card that fills
         the column under the items. -->
    <Card.Root class="gap-0 py-0 @4xl:col-span-2 @4xl:col-start-1 @4xl:row-start-2">
      <div class="flex items-center gap-2 border-b px-4 py-2.5">
        <span class="text-sm font-medium">Actions</span>
        {#if !canUpdate}
          <Badge variant="outline" class="gap-1 text-muted-foreground">
            <LockIcon class="size-3" />
            needs <code class="font-mono">{updateKey}</code>
          </Badge>
        {/if}
      </div>

      <div class="space-y-3 p-4">
        {#if order.allowedStatuses.length === 0}
          <p class="text-sm text-muted-foreground">
            This order is {orderStatusMeta(order.status).label.toLowerCase()}. There is nothing left
            to move.
          </p>
        {:else}
          <Textarea
            bind:value={note}
            rows={2}
            disabled={!canUpdate}
            placeholder="Optional note — it is written to the timeline with the change."
            aria-label="Note for the next status change"
          />

          <div class="flex flex-wrap items-center gap-2">
            {#each order.allowedStatuses as to (to)}
              <Button
                variant="outline"
                size="sm"
                disabled={!canUpdate || busy !== null}
                onclick={() => moveStatus(to as OrderStatus)}
              >
                {#if busy === `status:${to}`}<Spinner />{/if}
                Mark {orderStatusMeta(to as OrderStatus).label.toLowerCase()}
              </Button>
            {/each}
          </div>
        {/if}
      </div>
    </Card.Root>
  </div>

  <p class="text-xs text-muted-foreground">
    Last updated {order.updatedAt ? formatDateTime(order.updatedAt) : EM_DASH}
  </p>
</div>
