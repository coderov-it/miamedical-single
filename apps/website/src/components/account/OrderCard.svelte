<!--
  One order in the list.

  An UNVERIFIED order is one the account was matched to by email alone, so it
  asks rather than presenting the claim as settled — that is the whole reason
  the state exists. Confirming makes it a fact; rejecting unlinks it, and the
  row goes, because it is no longer one of their orders.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';
  import { type CustomerOrderSummary, formatDate, formatMoney } from '~/lib/customer-session';
  import { fill } from '~/scripts/account/copy';

  import AccountLink from './AccountLink.svelte';

  interface Props {
    order: CustomerOrderSummary;
  }

  const { order }: Props = $props();

  const { copy, orders } = accountContext();

  let note = $state<string | null>(null);
  /** Re-entry guard. The buttons are never disabled — see fields.ts. */
  let working = false;

  const itemsLabel = $derived(
    fill(say(copy, order.itemCount === 1 ? 'account.orders.itemOne' : 'account.orders.itemMany'), {
      count: order.itemCount,
    }),
  );

  async function answer(mine: boolean) {
    if (working) return;
    working = true;
    note = null;
    try {
      if (mine) await orders.confirm(order.number);
      else await orders.reject(order.number);
    } catch (error) {
      note = errorMessage(error, say(copy, 'account.retry'));
    } finally {
      working = false;
    }
  }
</script>

<li class="border-hair rounded-xl border p-4">
  <div class="flex flex-wrap items-baseline justify-between gap-2">
    <AccountLink to={{ name: 'orderDetail', number: order.number }} class="font-medium underline">
      {order.number}
    </AccountLink>
    <span class="tabular-nums">{formatMoney(order.total, order.currency)}</span>
  </div>

  <p class="mt-1 text-sm text-neutral-600">
    {copy.status[order.status] ?? order.status}
    · {itemsLabel}
    · {formatDate(order.placedAt)}
  </p>

  {#if order.linkStatus === 'unverified'}
    <div class="bg-tint mt-3 rounded-lg px-3 py-3">
      <p class="text-sm">{say(copy, 'account.orders.verifyPrompt')}</p>
      <div class="mt-2.5 flex flex-wrap gap-2">
        <button
          class="hover:bg-accent-deep rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
          type="button"
          onclick={() => void answer(true)}
        >
          {say(copy, 'account.orders.confirm')}
        </button>
        <button
          class="bg-tint-2 hover:bg-hair rounded-lg px-3 py-1.5 text-sm font-medium"
          type="button"
          onclick={() => void answer(false)}
        >
          {say(copy, 'account.orders.reject')}
        </button>
      </div>
      {#if note}
        <p class="mt-2 text-xs text-neutral-500" role="status">{note}</p>
      {/if}
    </div>
  {/if}
</li>
