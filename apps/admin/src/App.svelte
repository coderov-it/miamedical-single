<script lang="ts">
  import { session } from '~/lib/session.svelte';
  import Sidebar from '~/lib/Sidebar.svelte';
  import { router } from '~/lib/router.svelte';
  import Dashboard from '~/routes/Dashboard.svelte';
  import Login from '~/routes/Login.svelte';
  import Orders from '~/routes/Orders.svelte';
  import Products from '~/routes/Products.svelte';

  // The gate is the server's, not this component's: every route the shell can
  // reach is behind a permission check on the API. Hiding views is a courtesy.
  void session.load();

  const view = $derived.by(() => {
    if (router.path.startsWith('/products')) return Products;
    if (router.path.startsWith('/orders')) return Orders;
    return Dashboard;
  });

  const View = $derived(view);
</script>

{#if session.loading}
  <div class="flex h-full items-center justify-center text-sm text-neutral-500">Loading…</div>
{:else if !session.isAuthenticated}
  <Login />
{:else}
  <div class="flex h-full">
    <Sidebar />

    <main class="flex-1 overflow-y-auto p-8">
      <View />
    </main>
  </div>
{/if}
