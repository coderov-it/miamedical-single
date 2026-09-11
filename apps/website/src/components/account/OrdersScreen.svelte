<!--
  The customer's orders. The reason the account exists at all: before it, an
  order number lived only on the confirmation panel you were standing on.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';

  import AccountCrumbs from './AccountCrumbs.svelte';
  import OrderCard from './OrderCard.svelte';

  const { copy, orders } = accountContext();

  $effect(() => {
    void orders.ensureOrders();
  });

  const rows = $derived(orders.rows);
</script>

<div class="mx-auto w-full max-w-3xl px-5 py-10">
  <AccountCrumbs
    trail={[
      { label: say(copy, 'account.title'), to: { name: 'account' } },
      { label: say(copy, 'account.orders.breadcrumb') },
    ]}
  />

  <h1 class="text-[clamp(1.6rem,2.4vw,2rem)]/[1.2]">{say(copy, 'account.myOrders')}</h1>

  {#if rows === null}
    <p class="mt-6 text-[15px] text-neutral-600">{say(copy, 'account.loading')}</p>
  {:else if orders.listError}
    <!-- The old page had no error state at all: a failed load left
         "Caricamento…" on screen for good, with no way to try again. -->
    <div class="mt-8 rounded-xl border border-red-300 bg-red-50 px-5 py-6 text-sm" role="status">
      {errorMessage(orders.listError, say(copy, 'account.retry'))}
    </div>
  {:else if rows.length === 0}
    <div class="bg-tint mt-8 rounded-xl px-5 py-8 text-center">
      <p class="text-[15px] text-neutral-600">{say(copy, 'account.orders.empty')}</p>
      <a class="mt-4 inline-block text-[15px] underline" href={copy.routes.catalog}>
        {say(copy, 'account.orders.browse')}
      </a>
    </div>
  {:else}
    <ul class="mt-6 space-y-3">
      {#each rows as order (order.number)}
        <OrderCard {order} />
      {/each}
    </ul>
  {/if}
</div>
