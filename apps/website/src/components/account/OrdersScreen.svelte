<!--
  The customer's orders. The reason the account exists at all: before it, an
  order number lived only on the confirmation panel you were standing on.

  No heading and no breadcrumb of its own any more — the shell paints both from
  the screen the URL names, so the three screens cannot disagree about the page.
  What is left here is the list and its three states.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';

  import OrderCard from './OrderCard.svelte';
  import { CARD } from './fields';

  const { copy, orders } = accountContext();

  $effect(() => {
    void orders.ensureOrders();
  });

  const rows = $derived(orders.rows);
</script>

{#if rows === null}
  <p class="text-ink-2 text-[15px]" role="status">{say(copy, 'account.loading')}</p>
{:else if orders.listError}
  <!--
    The old page had no error state at all: a failed load left "Caricamento…"
    on screen for good, with no way to try again. The store drops its memoised
    rejection on failure, so this button really does fetch again rather than
    replaying the same error.
  -->
  <div class={CARD} role="status">
    <p class="text-danger text-sm">
      {errorMessage(orders.listError, say(copy, 'account.retry'))}
    </p>
    <button
      class="bg-tint hover:bg-tint-2 rounded-field text-ink mt-4 inline-flex min-h-11 items-center px-4 text-[15px] font-semibold transition"
      type="button"
      onclick={() => void orders.ensureOrders()}
    >
      {say(copy, 'retry')}
    </button>
  </div>
{:else if rows.length === 0}
  <div class={CARD + ' text-center'}>
    <p class="text-ink-2 text-[15px]">{say(copy, 'account.orders.empty')}</p>
    <a
      class="hover:bg-accent-deep rounded-field mt-4 inline-flex min-h-11 items-center bg-accent px-4 text-[15px] font-semibold text-white no-underline"
      href={copy.routes.catalog}
    >
      {say(copy, 'account.orders.browse')}
    </a>
  </div>
{:else}
  <ul class="space-y-3">
    {#each rows as order (order.number)}
      <OrderCard {order} />
    {/each}
  </ul>
{/if}
