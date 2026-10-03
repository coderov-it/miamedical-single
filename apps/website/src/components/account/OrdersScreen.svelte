<!--
  The customer's orders. The reason the account exists at all: before it, an
  order number lived only on the confirmation panel you were standing on.

  No heading and no breadcrumb of its own any more — the shell paints both from
  the screen the URL names, so the three screens cannot disagree about the page.
  What is left here is one section — the list — and its four states.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';

  import AccountSection from './AccountSection.svelte';
  import OrderCard from './OrderCard.svelte';
  import { BROWSE, RETRY } from './fields';
  import LoadingState from '../primitives/LoadingState.svelte';

  const { copy, orders } = accountContext();

  $effect(() => {
    void orders.ensureOrders();
  });

  const rows = $derived(orders.rows);
  /** The list itself runs edge to edge; every other state keeps the padded body. */
  const listed = $derived(!!rows?.length && !orders.listError);
</script>

<AccountSection title={say(copy, 'account.orders.all')} flush={listed}>
  {#if rows === null}
    <LoadingState variant="inline" label={say(copy, 'account.orders.loading')} />
  {:else if orders.listError}
    <!--
      The old page had no error state at all: a failed load left "Caricamento…"
      on screen for good, with no way to try again. The store drops its memoised
      rejection on failure, so this button really does fetch again rather than
      replaying the same error.
    -->
    <div role="status">
      <p class="text-danger text-sm">
        {errorMessage(orders.listError, say(copy, 'account.retry'))}
      </p>
      <button class={RETRY + ' mt-4'} type="button" onclick={() => void orders.ensureOrders()}>
        {say(copy, 'retry')}
      </button>
    </div>
  {:else if rows.length === 0}
    <div class="text-center">
      <p class="text-ink-2 text-[15px]">{say(copy, 'account.orders.empty')}</p>
      <a class={BROWSE + ' mt-4'} href={copy.routes.catalog}>
        {say(copy, 'account.orders.browse')}
      </a>
    </div>
  {:else}
    <ul class="divide-hair divide-y">
      {#each rows as order (order.number)}
        <OrderCard {order} />
      {/each}
    </ul>
  {/if}
</AccountSection>
