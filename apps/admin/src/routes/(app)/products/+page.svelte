<script lang="ts">
  import { P } from '@mia/permissions';
  import type { InferResponseType } from 'hono/client';

  import { api, formatMoney } from '~/lib/api';
  import Forbidden from '~/lib/components/Forbidden.svelte';
  import { errorMessage, unwrapFull } from '~/lib/request';
  import { session } from '~/lib/session.svelte';

  type ListResponse = InferResponseType<typeof api.api.admin.products.$get, 200>;
  type Product = ListResponse['data'][number];
  type Category = InferResponseType<typeof api.api.admin.categories.$get, 200>['data'][number];

  const allowed = $derived(session.can(P.PRODUCT_READ));

  let query = $state('');
  let status = $state('');
  let category = $state('');
  let products = $state<Product[]>([]);
  let categories = $state<Category[]>([]);
  let total = $state(0);
  let page = $state(1);
  let pageCount = $state(1);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function load() {
    loading = true;
    error = null;
    try {
      const body = await unwrapFull<ListResponse>(
        await api.api.admin.products.$get({
          query: {
            page: String(page),
            ...(query ? { q: query } : {}),
            ...(status ? { status } : {}),
            ...(category ? { category } : {}),
          },
        }),
      );
      products = body.data;
      total = body.meta.total;
      pageCount = body.meta.pageCount;
    } catch (err) {
      error = errorMessage(err);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (!allowed) return;
    // Read the reactive inputs so the effect re-runs on change.
    void [query, status, category, page];
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  });

  $effect(() => {
    if (!allowed || !session.can(P.CATEGORY_READ)) return;
    void api.api.admin.categories
      .$get()
      .then((response) => unwrapFull<{ data: Category[] }>(response))
      .then((body) => (categories = body.data))
      .catch(() => undefined);
  });

  const statusColor: Record<string, string> = {
    active: 'text-green-600',
    draft: 'text-amber-600',
    archived: 'text-neutral-400',
  };
</script>

{#if !allowed}
  <Forbidden />
{:else}
  <div class="flex flex-wrap items-center justify-between gap-4">
    <h1 class="text-2xl font-semibold tracking-tight">Products</h1>
    <div class="flex items-center gap-2">
      <input
        type="search"
        bind:value={query}
        placeholder="Search products…"
        class="focus:border-brand-500 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <select
        bind:value={category}
        class="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        <option value="">All categories</option>
        {#each categories as cat (cat.id)}
          <option value={cat.code}>{cat.translations.it?.name ?? cat.code}</option>
        {/each}
      </select>
      <select
        bind:value={status}
        class="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        <option value="">All statuses</option>
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>
      {#if session.can(P.PRODUCT_CREATE)}
        <a
          href="/products/new"
          class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
        >
          New product
        </a>
      {/if}
    </div>
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
            <th class="px-4 py-3 font-medium">Title</th>
            <th class="px-4 py-3 font-medium">Category</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Pricing</th>
            <th class="px-4 py-3 font-medium">EN</th>
            <th class="px-4 py-3 text-right font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {#each products as product (product.id)}
            <tr class="border-t border-neutral-100 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/40">
              <td class="px-4 py-3 font-medium">
                <a href={`/products/${product.id}`} class="hover:underline">{product.title}</a>
                <div class="text-xs text-neutral-400">{product.baseSku}</div>
              </td>
              <td class="px-4 py-3 text-neutral-500">{product.categoryName}</td>
              <td class="px-4 py-3 {statusColor[product.status] ?? ''}">{product.status}</td>
              <td class="px-4 py-3 text-neutral-500">
                {product.pricingMode === 'rental' ? `rental / ${product.rentalUnit}` : 'fixed'}
              </td>
              <td class="px-4 py-3">
                {#if product.translationStatus.en === 'complete'}
                  <span class="text-green-600">✓</span>
                {:else if product.translationStatus.en === 'partial'}
                  <span class="text-amber-600">partial</span>
                {:else}
                  <span class="text-neutral-400">—</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-right tabular-nums">
                {formatMoney(product.basePrice, product.currency)}{product.pricingMode === 'rental'
                  ? ` / ${product.rentalUnit === 'day' ? 'day' : 'hour'}`
                  : ''}
              </td>
            </tr>
          {:else}
            <tr>
              <td class="px-4 py-8 text-center text-neutral-500" colspan="6">No products yet.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex items-center justify-between text-sm text-neutral-500">
      <span>{total} total</span>
      {#if pageCount > 1}
        <span class="flex items-center gap-2">
          <button
            type="button"
            class="rounded border border-neutral-300 px-2 py-1 disabled:opacity-40 dark:border-neutral-700"
            disabled={page <= 1}
            onclick={() => (page -= 1)}>←</button
          >
          {page} / {pageCount}
          <button
            type="button"
            class="rounded border border-neutral-300 px-2 py-1 disabled:opacity-40 dark:border-neutral-700"
            disabled={page >= pageCount}
            onclick={() => (page += 1)}>→</button
          >
        </span>
      {/if}
    </div>
  {/if}
{/if}
