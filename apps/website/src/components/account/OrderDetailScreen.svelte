<!--
  One order, as the customer sees it: the lines they configured, where it is
  going, and what it costs.

  Deliberately not the admin's view — no internal id, no status timeline, no
  operator notes, no fiscal identifiers. `CustomerOrderDetailDto` is narrower
  for that reason, and the omissions are the point.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';
  import { type CustomerOrderDetail, formatDate, formatMoney } from '~/lib/customer-session';
  import { fill } from '~/scripts/account/copy';

  import AccountCrumbs from './AccountCrumbs.svelte';
  import AccountLink from './AccountLink.svelte';

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

<div class="mx-auto w-full max-w-2xl px-5 py-10">
  <AccountCrumbs
    trail={[{ label: say(copy, 'account.myOrders'), to: { name: 'orders' } }, { label: number }]}
  />

  {#if failure}
    <!-- An order that is not theirs 404s rather than 403s, so "not found" is
         the only thing this screen can honestly say about either case. -->
    <div class="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm" role="status">
      {errorMessage(failure, say(copy, 'account.order.unavailable'))}
      <AccountLink to={{ name: 'orders' }} class="underline">
        {say(copy, 'account.order.backToOrders')}
      </AccountLink>.
    </div>
  {:else if !order}
    <p class="text-[15px] text-neutral-600">{say(copy, 'account.loading')}</p>
  {:else}
    <article>
      <header class="flex flex-wrap items-baseline justify-between gap-2">
        <h1 class="text-[clamp(1.5rem,2.2vw,1.9rem)]/[1.2]">
          {fill(say(copy, 'account.order.title'), { number: order.number })}
        </h1>
        <span class="bg-tint rounded-full px-3 py-1 text-sm">
          {copy.status[order.status] ?? order.status}
        </span>
      </header>

      <p class="mt-1 text-sm text-neutral-600">
        {fill(say(copy, 'account.order.placedOn'), { date: formatDate(order.placedAt) })}
      </p>

      <ul class="mt-7">
        {#each order.items as item (item.id)}
          <li class="border-hair flex justify-between gap-4 border-b py-3 last:border-0">
            <div>
              <p class="font-medium">{item.productTitle}</p>
              <p class="text-sm text-neutral-600">
                {fill(say(copy, 'account.order.pieces'), { count: item.quantity })}
              </p>
            </div>
            <span class="tabular-nums">{formatMoney(item.total, order.totals.currency)}</span>
          </li>
        {/each}
      </ul>

      <div class="mt-5 space-y-1.5 text-[15px]">
        <div class="flex justify-between gap-4 text-neutral-600">
          <span>{say(copy, 'account.order.subtotal')}</span>
          <span class="tabular-nums">
            {formatMoney(order.totals.subtotal, order.totals.currency)}
          </span>
        </div>
        <div class="flex justify-between gap-4 text-neutral-600">
          <span>{say(copy, 'delivery')}</span>
          <span class="tabular-nums">{deliveryAmount(order)}</span>
        </div>
        <div class="flex justify-between gap-4 font-medium">
          <span>{say(copy, 'total')}</span>
          <span class="tabular-nums">{formatMoney(order.totals.total, order.totals.currency)}</span>
        </div>
      </div>

      {#if order.delivery?.method}
        <section class="border-hair mt-7 rounded-xl border p-4">
          <h2 class="text-sm font-medium">{say(copy, 'delivery')}</h2>
          <p class="mt-1 text-[15px] text-neutral-600">{deliveryLabel(order.delivery.method)}</p>
          {#if addressLine(order)}
            <p class="mt-1 text-[15px] text-neutral-600">{addressLine(order)}</p>
          {/if}
        </section>
      {/if}

      {#if order.notes}
        <section class="border-hair mt-4 rounded-xl border p-4">
          <h2 class="text-sm font-medium">{say(copy, 'account.order.yourNotes')}</h2>
          <p class="mt-1 text-[15px] whitespace-pre-line text-neutral-600">{order.notes}</p>
        </section>
      {/if}
    </article>
  {/if}
</div>
