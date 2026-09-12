<!--
  One order, as the customer sees it: the lines they configured, where it is
  going, and what it costs.

  Deliberately not the admin's view — no internal id, no status timeline, no
  operator notes, no fiscal identifiers. `CustomerOrderDetailDto` is narrower
  for that reason, and the omissions are the point.

  The title and the trail are the shell's now; this screen opens on the one
  thing the shell cannot know — where the order stands.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';
  import { type CustomerOrderDetail, formatDate, formatMoney } from '~/lib/customer-session';
  import { fill } from '~/scripts/account/copy';

  import AccountLink from './AccountLink.svelte';
  import OrderStatusPill from './OrderStatusPill.svelte';
  import { CARD, HEADING } from './fields';

  interface Props {
    number: string;
  }

  const { number }: Props = $props();

  const { copy, orders } = accountContext();

  $effect(() => {
    void orders.ensureOrder(number);
  });

  const order = $derived(orders.detail(number));
  const failure = $derived(orders.detailError(number));

  function deliveryLabel(method: string): string {
    if (method === 'homeDelivery') return say(copy, 'homeDeliveryShort');
    if (method === 'storePickup') return say(copy, 'account.order.storePickup');
    return method;
  }

  /**
   * A home delivery still at zero has not been agreed yet, not given away:
   * nothing prices delivery, so an order is placed at 0,00 € and stays there
   * until somebody writes down what was settled on the phone. Printing
   * "0,00 €" would tell the customer their delivery is free. A collection
   * genuinely is free.
   */
  function deliveryAmount(detail: CustomerOrderDetail): string {
    const settled = Number(detail.totals.shippingTotal) > 0;
    if (settled || detail.delivery?.method !== 'homeDelivery') {
      return formatMoney(detail.totals.shippingTotal, detail.totals.currency);
    }
    return say(copy, 'deliveryPending');
  }

  function addressLine(detail: CustomerOrderDetail): string {
    const address = detail.shippingAddress;
    if (!address) return '';
    return [address.line1, address.postalCode, address.city].filter(Boolean).join(', ');
  }
</script>

{#if failure}
  <div class={CARD} role="status">
    <p class="text-danger text-sm">
      {errorMessage(failure, say(copy, 'account.order.unavailable'))}
    </p>
    <AccountLink
      to={{ name: 'orders' }}
      class="mt-3 inline-block text-[15px] font-semibold text-accent underline"
    >
      {say(copy, 'account.order.backToOrders')}
    </AccountLink>
  </div>
{:else if !order}
  <p class="text-ink-2 text-[15px]" role="status">{say(copy, 'account.loading')}</p>
{:else}
  <article>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <OrderStatusPill status={order.status} />
      <p class="text-ink-2 text-[14px]">
        {fill(say(copy, 'account.order.placedOn'), { date: formatDate(order.placedAt) })}
      </p>
    </div>

    <section class={CARD + ' mt-5'}>
      <h2 class={HEADING}>{say(copy, 'orderSummary')}</h2>

      <ul class="mt-3">
        {#each order.items as item (item.id)}
          <li class="border-hair flex justify-between gap-4 border-b py-3 last:border-0">
            <div class="min-w-0">
              <p class="font-medium">{item.productTitle}</p>
              <p class="text-ink-2 text-[14px]">
                {fill(say(copy, 'account.order.pieces'), { count: item.quantity })}
              </p>
            </div>
            <span class="font-semibold tabular-nums">
              {formatMoney(item.total, order.totals.currency)}
            </span>
          </li>
        {/each}
      </ul>

      <div class="border-hair mt-4 space-y-2 border-t pt-4 text-[15px]">
        <div class="text-ink-2 flex justify-between gap-4">
          <span>{say(copy, 'account.order.subtotal')}</span>
          <span class="tabular-nums">
            {formatMoney(order.totals.subtotal, order.totals.currency)}
          </span>
        </div>
        <div class="text-ink-2 flex justify-between gap-4">
          <span>{say(copy, 'delivery')}</span>
          <span class="tabular-nums">{deliveryAmount(order)}</span>
        </div>
        <div class="flex justify-between gap-4 text-[1.0625rem] font-bold">
          <span>{say(copy, 'total')}</span>
          <span class="tabular-nums">{formatMoney(order.totals.total, order.totals.currency)}</span>
        </div>
      </div>
    </section>

    {#if order.delivery?.method}
      <section class={CARD + ' mt-6'}>
        <h2 class={HEADING}>{say(copy, 'delivery')}</h2>
        <p class="mt-2 text-[15px]">{deliveryLabel(order.delivery.method)}</p>
        {#if addressLine(order)}
          <p class="text-ink-2 mt-1 text-[15px]">{addressLine(order)}</p>
        {/if}
      </section>
    {/if}

    {#if order.notes}
      <section class={CARD + ' mt-6'}>
        <h2 class={HEADING}>{say(copy, 'account.order.yourNotes')}</h2>
        <p class="text-ink-2 mt-2 text-[15px] whitespace-pre-line">{order.notes}</p>
      </section>
    {/if}
  </article>
{/if}
