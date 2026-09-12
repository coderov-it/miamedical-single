<!--
  One order in the list, and the ONLY row shape in the area: the account home
  shows three of these under "Ultimi ordini" and the orders screen shows all of
  them, so a customer learns one row and reads it everywhere.

  THE WHOLE ROW IS THE LINK. The anchor carries an `after:inset-0` overlay
  inside a positioned wrapper, which is why the wrapper is the row and not the
  `<li>`: the overlay stops where the row stops, leaving the verification
  buttons below it clickable. Middle-click and ⌘-click still work — it is a
  real `<a>` with a real href.

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
  import OrderStatusPill from './OrderStatusPill.svelte';

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

<li class="border-hair rounded-card overflow-hidden border bg-white">
  <div class="hover:bg-tint relative flex flex-wrap items-center gap-x-5 gap-y-3 p-5 transition">
    <AccountLink
      to={{ name: 'orderDetail', number: order.number }}
      class="group min-w-0 flex-1 basis-44 no-underline after:absolute after:inset-0"
    >
      <span class="block font-bold whitespace-nowrap group-hover:text-accent">{order.number}</span>
      <span class="text-ink-2 mt-0.5 block text-[14px]">
        {formatDate(order.placedAt)} · {itemsLabel}
      </span>
    </AccountLink>

    <!--
      The trailing cluster takes the whole second line on a phone and the right
      end of the first one on a desktop. `ml-auto` is what makes the wrap read
      as one row rather than as three objects left behind: the cluster hugs the
      right edge of whichever line it landed on.
    -->
    <div class="ml-auto flex items-center gap-x-4">
      <OrderStatusPill status={order.status} />

      <span class="text-right font-bold whitespace-nowrap tabular-nums">
        {formatMoney(order.total, order.currency)}
      </span>

      <svg
        class="text-ink-decorative flex-none"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m9.5 5.5 6.5 6.5-6.5 6.5"></path>
      </svg>
    </div>
  </div>

  {#if order.linkStatus === 'unverified'}
    <div class="border-hair bg-tint border-t p-5">
      <p class="text-[15px]">{say(copy, 'account.orders.verifyPrompt')}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          class="hover:bg-accent-deep rounded-field inline-flex min-h-11 items-center bg-accent px-4 text-[15px] font-semibold text-white"
          type="button"
          onclick={() => void answer(true)}
        >
          {say(copy, 'account.orders.confirm')}
        </button>
        <button
          class="bg-tint-2 hover:bg-hair rounded-field text-ink inline-flex min-h-11 items-center px-4 text-[15px] font-semibold"
          type="button"
          onclick={() => void answer(false)}
        >
          {say(copy, 'account.orders.reject')}
        </button>
      </div>
      {#if note}
        <p class="text-ink-2 mt-2 text-xs" role="status">{note}</p>
      {/if}
    </div>
  {/if}
</li>
