<script lang="ts">
  import { P } from '@mia/permissions';

  import Forbidden from '~/lib/components/Forbidden.svelte';
  import { session } from '~/lib/session.svelte';

  // Placeholder — mirrors products/+page.svelte once /api/orders lands.
</script>

{#if !session.can(P.ORDER_READ)}
  <Forbidden />
{:else}
  <h1 class="text-2xl font-semibold tracking-tight">Orders</h1>

  <div
    class="mt-6 rounded-xl border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500 dark:border-neutral-700"
  >
    Add the <code>/api/orders</code> routes in
    <code>apps/server/src/routes/orders.ts</code>, then mirror the table in
    <code>products/+page.svelte</code>.
  </div>
{/if}
