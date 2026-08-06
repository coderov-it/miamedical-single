<script lang="ts">
  import type { InferResponseType } from 'hono/client';

  import { api, formatMoney } from '~/lib/api';

  // Narrow to the 200 response — the raw return type also covers 4xx bodies.
  type Product = InferResponseType<typeof api.api.products.$get, 200>['data'][number];

  let query = $state('');
  let products = $state<Product[]>([]);
  let total = $state(0);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function load(q: string) {
    loading = true;
    error = null;
    try {
      const response = await api.api.products.$get({ query: q ? { q } : {} });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const body = (await response.json()) as InferResponseType<typeof api.api.products.$get, 200>;
      products = body.data;
      total = body.meta.total;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load products.';
    } finally {
      loading = false;
    }
  }

  // Debounced reload whenever the search box changes.
  $effect(() => {
    const q = query;
    const timer = setTimeout(() => void load(q), 250);
    return () => clearTimeout(timer);
  });
</script>

<div class="flex items-center justify-between gap-4">
  <h1 class="text-2xl font-semibold tracking-tight">Products</h1>
  <input
    type="search"
    bind:value={query}
    placeholder="Search products…"
    class="focus:border-brand-500 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
  />
</div>

{#if error}
  <p class="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>
{:else if loading}
  <p class="mt-6 text-sm text-neutral-500">Loading…</p>
{:else}
  <div
    class="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
  >
    <table class="w-full text-sm">
      <thead class="bg-neutral-50 text-left dark:bg-neutral-800/50">
        <tr>
          <th class="px-4 py-3 font-medium">Name</th>
          <th class="px-4 py-3 font-medium">Status</th>
          <th class="px-4 py-3 font-medium">Variants</th>
          <th class="px-4 py-3 text-right font-medium">From</th>
        </tr>
      </thead>
      <tbody>
        {#each products as product (product.id)}
          <tr class="border-t border-neutral-100 dark:border-neutral-800">
            <td class="px-4 py-3 font-medium">{product.name}</td>
            <td class="px-4 py-3 text-neutral-500">{product.status}</td>
            <td class="px-4 py-3 text-neutral-500">{product.variantCount}</td>
            <td class="px-4 py-3 text-right">
              {product.priceFrom
                ? formatMoney(product.priceFrom.cents, product.priceFrom.currency)
                : '—'}
            </td>
          </tr>
        {:else}
          <tr>
            <td class="px-4 py-8 text-center text-neutral-500" colspan="4">No products yet.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="mt-4 text-sm text-neutral-500">{total} total</p>
{/if}
