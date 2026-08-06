<script lang="ts">
  import Sidebar from '~/lib/Sidebar.svelte';
  import { router } from '~/lib/router.svelte';
  import Dashboard from '~/routes/Dashboard.svelte';
  import Orders from '~/routes/Orders.svelte';
  import Products from '~/routes/Products.svelte';

  const view = $derived.by(() => {
    if (router.path.startsWith('/products')) return Products;
    if (router.path.startsWith('/orders')) return Orders;
    return Dashboard;
  });

  const View = $derived(view);
</script>

<div class="flex h-full">
  <Sidebar />

  <main class="flex-1 overflow-y-auto p-8">
    <View />
  </main>
</div>
