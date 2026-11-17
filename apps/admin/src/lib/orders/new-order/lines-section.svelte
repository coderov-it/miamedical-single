<script lang="ts">
  import SearchIcon from '@lucide/svelte/icons/search';

  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { api } from '~/lib/api';
  import { formatMoney } from '~/lib/format';
  import { Resource } from '~/lib/resource.svelte';
  import { t } from '~/lib/ui-text';
  import LineCard from './line-card.svelte';
  import type { OrderForm } from './order-form.svelte';
  import { RESULT_ROW_CLASS, type LineProduct, type LineProducts } from './types';

  let { form }: { form: OrderForm } = $props();

  let query = $state('');
  let open = $state(false);

  const results = new Resource(
    () => query.trim(),
    async (q, signal) => {
      if (q.length < 2) return [] as LineProducts;
      const res = await api.api.admin.orders.manual.products.$get(
        { query: { q } },
        { init: { signal } },
      );
      const json = (await res.json()) as { data: LineProducts };
      return json.data;
    },
    { enabled: () => open, debounce: 250 },
  );

  function pick(product: LineProduct) {
    form.addLine(product);
    query = '';
    open = false;
  }

  /** A fixed price, or the cheapest package of a rental. */
  function startingAt(product: LineProduct): string {
    if (product.price) return formatMoney(product.price, 'EUR');
    const prices = product.packages.map((pkg) => Number(pkg.price));
    if (prices.length === 0) return '';
    const lowest = formatMoney(String(Math.min(...prices)), 'EUR');
    return t('newOrder.fromPrice', { price: lowest });
  }
</script>

<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">{t('newOrder.linesTitle')}</div>
  <div class="space-y-4 p-4">
    {#each form.lines as line, index (line.key)}
      <LineCard {form} {line} {index} />
    {/each}

    <div class="relative">
      <SearchIcon
        class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id="no-product-search"
        type="search"
        autocomplete="off"
        class="pl-8"
        bind:value={query}
        placeholder={t('newOrder.productSearch')}
        aria-label={t('newOrder.productSearch')}
        aria-invalid={form.fields.items ? 'true' : undefined}
        onfocus={() => (open = true)}
        onblur={() => setTimeout(() => (open = false), 150)}
      />
      {#if form.fields.items}
        <p class="mt-1 text-xs text-destructive" role="alert">{form.fields.items}</p>
      {/if}
      {#if open && query.trim().length >= 2}
        <div
          class="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-md border bg-popover shadow-md"
        >
          {#if results.loading && !results.hasData}
            <p class="px-3 py-2 text-sm text-muted-foreground">{t('newOrder.searching')}</p>
          {:else if (results.data ?? []).length === 0}
            <p class="px-3 py-2 text-sm text-muted-foreground">{t('newOrder.noProduct')}</p>
          {:else}
            {#each results.data ?? [] as product (product.id)}
              <button
                type="button"
                class={RESULT_ROW_CLASS}
                onmousedown={(event) => {
                  event.preventDefault();
                  pick(product);
                }}
              >
                <span class="min-w-0 flex-1 truncate">{product.title}</span>
                <span class="shrink-0 text-xs text-muted-foreground">{startingAt(product)}</span>
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  </div>
</Card.Root>
