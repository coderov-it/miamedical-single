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
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { api } from '~/lib/api';
  import StatusBadge from '~/lib/components/status-badge.svelte';
  import { cn } from '$lib/utils.js';
  import { EM_DASH, formatDateTime, formatMoney, orDash, relativeTime } from '~/lib/format';
  import {
    FULFILMENT_STEPS,
    orderStatusMeta,
    paymentStatusMeta,
    type OrderStatus,
    type PaymentStatus,
  } from '~/lib/orders/status';
  import { errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';

  type OrderDetail = InferResponseType<(typeof api.api.admin.orders)[':id']['$get'], 200>['data'];

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

  function movePayment(to: PaymentStatus) {
    void run(
      `payment:${to}`,
      () =>
        api.api.admin.orders[':id'].payment.$post({
          param: { id: order.id },
          json: { to, ...notePayload() },
        }),
      (updated) =>
        `Payment is now ${paymentStatusMeta(updated.paymentStatus).label.toLowerCase()}.`,
    );
  }

  const addresses = $derived(
    [
      { title: 'Shipping', value: order.shippingAddress },
      { title: 'Billing', value: order.billingAddress },
    ].filter((entry) => entry.value !== null),
  );
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
    <div class="bg-card px-3 py-2.5">
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

  <div class="grid gap-5 @4xl:grid-cols-3">
    <div class="space-y-5 @4xl:col-span-2">
      <Card.Root class="gap-0 overflow-hidden py-0">
        <div class="border-b px-4 py-2.5 text-sm font-medium">Items</div>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Product</Table.Head>
              <Table.Head class="text-right">Qty</Table.Head>
              <Table.Head class="text-right">Unit</Table.Head>
              <Table.Head class="text-right">Total</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each order.items as item (item.id)}
              <Table.Row>
                <Table.Cell>
                  <p class="font-medium">{item.productTitle}</p>
                  <p class="font-mono text-xs text-muted-foreground">{item.sku}</p>
                </Table.Cell>
                <Table.Cell class="text-right tabular-nums">{item.quantity}</Table.Cell>
                <Table.Cell class="text-right tabular-nums">
                  {formatMoney(item.unitPrice, order.totals.currency)}
                </Table.Cell>
                <Table.Cell class="text-right tabular-nums">
                  {formatMoney(item.total, order.totals.currency)}
                </Table.Cell>
              </Table.Row>
            {:else}
              <Table.Row>
                <Table.Cell colspan={4} class="py-6 text-center text-muted-foreground">
                  This order has no lines.
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </Card.Root>

      <!-- Timeline. Oldest first, because that is how a sequence reads. -->
      <Card.Root class="gap-0 py-0">
        <div class="border-b px-4 py-2.5 text-sm font-medium">Timeline</div>
        <div class="p-4">
          {#if order.events.length === 0}
            <p class="text-sm text-muted-foreground">
              Nothing has happened since this order was placed.
            </p>
          {:else}
            <ol class="space-y-0">
              {#each order.events as event, index (event.id)}
                {@const meta =
                  event.field === 'status'
                    ? orderStatusMeta(event.toValue)
                    : paymentStatusMeta(event.toValue)}
                <li class="flex gap-3">
                  <div class="flex flex-col items-center">
                    <span class={cn('mt-1.5 size-2 shrink-0 rounded-full', meta.dot)}></span>
                    {#if index < order.events.length - 1}
                      <span class="w-px flex-1 bg-border"></span>
                    {/if}
                  </div>
                  <div class="pb-4">
                    <p class="text-sm">
                      <span class="text-muted-foreground">
                        {event.field === 'status' ? 'Status' : 'Payment'}
                      </span>
                      {orDash(event.fromValue)}
                      <span class="text-muted-foreground">→</span>
                      <span class="font-medium">{meta.label}</span>
                    </p>
                    {#if event.note}
                      <p class="mt-0.5 text-sm text-muted-foreground">{event.note}</p>
                    {/if}
                    <p class="mt-0.5 text-xs text-muted-foreground">
                      {event.actorName ?? 'System'} · {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                </li>
              {/each}
            </ol>
          {/if}
        </div>
      </Card.Root>
    </div>

    <div class="space-y-5">
      <Card.Root class="gap-0 py-0">
        <div class="border-b px-4 py-2.5 text-sm font-medium">Customer</div>
        <div class="space-y-1 p-4 text-sm">
          <p>{order.email}</p>
          <p class="text-muted-foreground">
            {order.userId ? 'Registered account' : 'Guest checkout'}
          </p>
          <p class="text-muted-foreground">Placed {relativeTime(order.placedAt)}</p>
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
  </div>

  <!-- Actions last: read the order, then decide. -->
  <Card.Root class="gap-0 py-0">
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
      {#if order.allowedStatuses.length === 0 && order.allowedPaymentStatuses.length === 0}
        <p class="text-sm text-muted-foreground">
          This order is {orderStatusMeta(order.status).label.toLowerCase()} and its payment is
          {paymentStatusMeta(order.paymentStatus).label.toLowerCase()}. There is nothing left to
          move.
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

          {#if order.allowedStatuses.length > 0 && order.allowedPaymentStatuses.length > 0}
            <Separator orientation="vertical" class="h-6" />
          {/if}

          {#each order.allowedPaymentStatuses as to (to)}
            <Button
              variant="ghost"
              size="sm"
              disabled={!canUpdate || busy !== null}
              onclick={() => movePayment(to as PaymentStatus)}
            >
              {#if busy === `payment:${to}`}<Spinner />{/if}
              Payment: {paymentStatusMeta(to as PaymentStatus).label.toLowerCase()}
            </Button>
          {/each}
        </div>
      {/if}
    </div>
  </Card.Root>

  <p class="text-xs text-muted-foreground">
    Last updated {order.updatedAt ? formatDateTime(order.updatedAt) : EM_DASH}
  </p>
</div>
