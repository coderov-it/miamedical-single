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
  import LockIcon from '@lucide/svelte/icons/lock';
  import { toast } from 'svelte-sonner';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { api } from '~/lib/api';
  import StatusBadge from '~/lib/components/status-badge.svelte';
  import OrderAddressCards from '~/lib/orders/order-address-cards.svelte';
  import OrderContractCard from '~/lib/orders/order-contract-card.svelte';
  import OrderCustomerCard from '~/lib/orders/order-customer-card.svelte';
  import OrderDeliveryCard from '~/lib/orders/order-delivery-card.svelte';
  import OrderExtensionsCard from '~/lib/orders/order-extensions-card.svelte';
  import OrderManualCard from '~/lib/orders/order-manual-card.svelte';
  import OrderMoneyCard from '~/lib/orders/order-money-card.svelte';
  import OrderRefundAllConfirm from '~/lib/orders/order-refund-all-confirm.svelte';
  import OrderItemsCard from '~/lib/orders/order-items-card.svelte';
  import OrderTimelineCard from '~/lib/orders/order-timeline-card.svelte';
  import { cn } from '$lib/utils.js';
  import { EM_DASH, formatDateTime, formatMoney } from '~/lib/format';
  import { STAGE_LABELS } from '~/lib/orders/manual-order';
  import { FULFILMENT_STEPS, orderStatusMeta, type OrderStatus } from '~/lib/orders/status';
  import { errorMessage, unwrap } from '~/lib/request';
  import type { OrderDetail } from '~/lib/orders/types';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';

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

  /** Whether anything on this order is rented — the case where extensions apply. */
  const hasRental = $derived(
    order.items.some((item) => item.configuration?.pricingMode === 'rental'),
  );
  let contractCard = $state<ReturnType<typeof OrderContractCard>>();
  let confirmRefundAll = $state(false);

  /** The delivery card hands over the agreed fee; the request runs here with the rest. */
  function saveShipping(amount: string) {
    void run(
      'shipping',
      () =>
        api.api.admin.orders[':id'].$patch({
          param: { id: order.id },
          json: { shippingTotal: amount },
        }),
      (updated) =>
        t('orders.shippingSaved', {
          number: updated.number,
          amount: formatMoney(updated.totals.shippingTotal, updated.totals.currency),
        }),
    );
  }

  /** `refunded` moves money, so it asks first; every other move goes straight through. */
  function requestMove(to: OrderStatus) {
    if (to === 'refunded') {
      confirmRefundAll = true;
      return;
    }
    moveStatus(to);
  }

  function moveStatus(to: OrderStatus) {
    void run(
      `status:${to}`,
      () =>
        api.api.admin.orders[':id'].status.$post({
          param: { id: order.id },
          json: { to, ...notePayload() },
        }),
      (updated) =>
        t('orders.statusChanged', {
          number: updated.number,
          status: orderStatusMeta(updated.status).label,
        }),
    );
  }

  /** An extension wrote to the timeline and may have issued a contract. */
  async function reloadAfterExtension() {
    contractCard?.refresh();
    try {
      const res = await api.api.admin.orders[':id'].$get({ param: { id: order.id } });
      onUpdated(await unwrap<OrderDetail>(res));
    } catch (err) {
      toast.error(errorMessage(err));
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
      {#if order.manualStage}
        <Badge variant="outline" class="border-amber-500/40 text-amber-600 dark:text-amber-400">
          {t(STAGE_LABELS[order.manualStage])}
        </Badge>
      {/if}
      <span class="ml-auto text-sm text-muted-foreground">
        {t('orders.detailPlaced', { date: formatDateTime(order.placedAt) })}
      </span>
    </div>
  {/if}

  <!-- Money strip. Every figure comes from the server as a decimal string. -->
  <div class="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border @2xl:grid-cols-5">
    {#each [{ label: t('orders.moneySubtotal'), value: order.totals.subtotal }, { label: t('orders.moneyShipping'), value: order.totals.shippingTotal }, { label: t('orders.moneyTax'), value: order.totals.taxTotal }, { label: t('orders.moneyDiscount'), value: order.totals.discountTotal }] as entry (entry.label)}
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
      <p class="text-xs text-muted-foreground">{t('orders.moneyTotal')}</p>
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
        {t('orders.stepperEndedEarly', { status: orderStatusMeta(order.status).label })}
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
      <OrderCustomerCard {order} />

      {#if order.delivery}
        <OrderDeliveryCard {order} {busy} onSave={saveShipping} />
      {/if}

      <OrderContractCard {order} bind:this={contractCard} />

      {#if order.source === 'manual'}
        <OrderManualCard {order} {onUpdated} />
      {/if}

      <OrderMoneyCard {order} {onUpdated} />

      {#if hasRental}
        <OrderExtensionsCard
          orderId={order.id}
          orderNumber={order.number}
          onChanged={reloadAfterExtension}
        />
      {/if}

      <OrderAddressCards {order} />
    </div>

    <!-- Actions last in the reading order, and at width the card that fills
         the column under the items. -->
    <Card.Root class="gap-0 py-0 @4xl:col-span-2 @4xl:col-start-1 @4xl:row-start-2">
      <div class="flex items-center gap-2 border-b px-4 py-2.5">
        <span class="text-sm font-medium">{t('orders.actionsTitle')}</span>
        {#if !canUpdate}
          <Badge variant="outline" class="gap-1 text-muted-foreground">
            <LockIcon class="size-3" />
            {t('orders.actionsNeeds')} <code class="font-mono">{updateKey}</code>
          </Badge>
        {/if}
      </div>

      <div class="space-y-3 p-4">
        {#if order.allowedStatuses.length === 0}
          <p class="text-sm text-muted-foreground">
            {t('orders.actionsNothingLeft', { status: orderStatusMeta(order.status).label })}
          </p>
        {:else}
          <Textarea
            bind:value={note}
            rows={2}
            disabled={!canUpdate}
            placeholder={t('orders.actionsNotePlaceholder')}
            aria-label={t('orders.actionsNoteLabel')}
          />

          <div class="flex flex-wrap items-center gap-2">
            {#each order.allowedStatuses as to (to)}
              <Button
                variant="outline"
                size="sm"
                disabled={!canUpdate || busy !== null}
                onclick={() => requestMove(to as OrderStatus)}
              >
                {#if busy === `status:${to}`}<Spinner />{/if}
                {t('orders.actionsMarkAs', { status: orderStatusMeta(to as OrderStatus).label })}
              </Button>
            {/each}
          </div>
        {/if}
      </div>
    </Card.Root>
  </div>

  <OrderRefundAllConfirm
    {order}
    open={confirmRefundAll}
    onClose={() => (confirmRefundAll = false)}
    onConfirm={() => moveStatus('refunded')}
  />

  <p class="text-xs text-muted-foreground">
    {t('orders.detailUpdated', {
      date: order.updatedAt ? formatDateTime(order.updatedAt) : EM_DASH,
    })}
  </p>
</div>
