<!--
  Step 1. A grid of product cards the agent searches, filters and clicks. Search
  autofocuses; arrows move a highlight over the cards and Enter picks it, so the
  whole step can be done without the mouse while the customer is still talking.
-->
<script lang="ts">
  import SearchIcon from '@lucide/svelte/icons/search';
  import XIcon from '@lucide/svelte/icons/x';

  import { Input } from '$lib/components/ui/input/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { cn } from '$lib/utils.js';
  import Pager from '~/lib/components/pager.svelte';
  import { t } from '~/lib/ui-text';
  import type { OrderForm } from './order-form.svelte';
  import ProductCard from './product-card.svelte';
  import type { ProductCatalog } from './product-catalog.svelte';
  import type { SaleMode } from './types';

  /** The catalog belongs to the page, so coming back to this step shows the grid at once. */
  let { form, catalog }: { form: OrderForm; catalog: ProductCatalog } = $props();
  let focused = $state(false);

  const MODES: {
    value: SaleMode;
    labelKey: 'newOrder.kindAll' | 'newOrder.kindSale' | 'newOrder.kindRental';
  }[] = [
    { value: '', labelKey: 'newOrder.kindAll' },
    { value: 'fixed', labelKey: 'newOrder.kindSale' },
    { value: 'rental', labelKey: 'newOrder.kindRental' },
  ];

  const CHIP =
    'shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';
  const idle = 'bg-card text-foreground/80 hover:bg-muted';
  const on = 'border-primary bg-primary text-primary-foreground';

  function onKeydown(event: KeyboardEvent) {
    const steps: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    const by = steps[event.key];
    if (by !== undefined) {
      event.preventDefault();
      catalog.move(by);
      return;
    }
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const product = catalog.highlighted();
    if (product) form.toggleProduct(product);
  }

  $effect(() => {
    if (!focused) return;
    document
      .querySelectorAll('[data-product-card]')
      [catalog.highlight]?.scrollIntoView({ block: 'nearest' });
  });
</script>

<div class="space-y-4">
  <div class="relative">
    <SearchIcon
      class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
    />
    <Input
      id="no-product-search"
      type="search"
      autocomplete="off"
      autofocus
      class="h-11 pl-9 text-base"
      value={catalog.query}
      oninput={(event) => catalog.setQuery(event.currentTarget.value)}
      onkeydown={onKeydown}
      onfocus={() => (focused = true)}
      onblur={() => (focused = false)}
      placeholder={t('newOrder.productSearch')}
      aria-label={t('newOrder.productSearch')}
      aria-invalid={form.fields.items ? 'true' : undefined}
    />
    {#if catalog.query}
      <button
        type="button"
        class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={t('newOrder.clearSearch')}
        onclick={() => catalog.setQuery('')}
      >
        <XIcon class="size-4" />
      </button>
    {/if}
  </div>

  <div class="flex flex-wrap items-center gap-2">
    <div class="flex shrink-0 items-center gap-0.5 rounded-full border bg-muted/60 p-0.5">
      {#each MODES as mode (mode.value)}
        {@const active = catalog.mode === mode.value}
        <button
          type="button"
          aria-pressed={active}
          onclick={() => catalog.setMode(mode.value)}
          class={cn(
            'rounded-full px-3.5 py-1 text-sm font-medium transition-colors',
            active
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-foreground/80 hover:bg-background',
          )}
        >
          {t(mode.labelKey)}
        </button>
      {/each}
    </div>
    <span class="hidden h-5 w-px bg-border sm:block"></span>
    {#each catalog.categories.data ?? [] as category (category.id)}
      {@const active = catalog.category === category.code}
      <button
        type="button"
        aria-pressed={active}
        onclick={() => catalog.setCategory(category.code)}
        class={cn(CHIP, active ? on : idle)}
      >
        {category.name}
      </button>
    {/each}
  </div>

  {#if catalog.isDefault}
    <h2 class="text-sm font-semibold">{t('newOrder.bestSellers')}</h2>
  {/if}

  {#if form.fields.items}
    <p class="text-sm text-destructive" role="alert">{form.fields.items}</p>
  {/if}

  {#if catalog.results.loading && !catalog.results.hasData}
    <div class="grid gap-2.5 @xl:grid-cols-2">
      {#each { length: 8 } as _, index (index)}
        <Skeleton class="h-28 rounded-xl" />
      {/each}
    </div>
  {:else if catalog.rows.length === 0}
    <p class="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
      {t('newOrder.noProduct')}
    </p>
  {:else}
    <div class={cn('grid gap-2.5 @xl:grid-cols-2', catalog.results.loading && 'opacity-60')}>
      {#each catalog.rows as product, index (product.id)}
        <ProductCard
          {product}
          selected={form.selectedIds.has(product.id) || form.pendingCards.has(product.id)}
          pending={form.pendingCards.has(product.id)}
          highlighted={focused && catalog.highlight === index}
          onToggle={() => form.toggleProduct(product)}
          onPrefetch={() => form.prefetch(product)}
        />
      {/each}
    </div>
    <div class="[&>div]:border-t-0">
      <Pager
        meta={catalog.meta}
        busy={catalog.results.loading}
        onPage={(page) => (catalog.page = page)}
      />
    </div>
  {/if}
</div>
