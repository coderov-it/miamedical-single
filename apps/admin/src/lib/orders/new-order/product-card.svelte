<!--
  One product in the browser. The whole card is the toggle: a click adds it to the
  order, a second click takes it off. `highlighted` is the keyboard cursor of the
  search box, so Enter and a click land on the same card.
-->
<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import XIcon from '@lucide/svelte/icons/x';
  import ImageOffIcon from '@lucide/svelte/icons/image-off';

  import { cn } from '$lib/utils.js';
  import { mediaUrl } from '~/lib/api';
  import { formatMoney } from '~/lib/format';
  import { t } from '~/lib/ui-text';
  import KindBadge from './kind-badge.svelte';
  import StockIndicator from './stock-indicator.svelte';
  import type { LineCard } from './types';

  interface Props {
    product: LineCard;
    selected: boolean;
    highlighted: boolean;
    pending?: boolean;
    onToggle: () => void;
    onPrefetch?: () => void;
  }

  let { product, selected, highlighted, pending = false, onToggle, onPrefetch }: Props = $props();

  const rental = $derived(product.mode === 'rental');
  const price = $derived(formatMoney(product.fromPrice, 'EUR'));
</script>

<button
  type="button"
  aria-pressed={selected}
  aria-busy={pending}
  data-product-card
  onclick={onToggle}
  onpointerenter={onPrefetch}
  onfocus={onPrefetch}
  class={cn(
    'group relative flex items-stretch gap-3 overflow-hidden rounded-xl border bg-card p-2 text-left transition-all outline-none',
    'hover:border-foreground/25 hover:shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/50',
    selected && 'border-primary bg-primary/5 ring-2 ring-primary',
    highlighted && !selected && 'border-ring ring-2 ring-ring/40',
    !product.inStock && 'opacity-70',
  )}
>
  <span class="relative block size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
    {#if product.image}
      <img
        src={mediaUrl(product.image)}
        alt=""
        loading="lazy"
        class="size-full object-contain p-1"
      />
    {:else}
      <span class="grid size-full place-items-center text-muted-foreground">
        <ImageOffIcon class="size-6" />
      </span>
    {/if}
  </span>
  <span class="flex min-w-0 flex-1 flex-col py-0.5 pr-8">
    <span class="flex items-center gap-2">
      <KindBadge mode={product.mode} />
      <span class="truncate text-xs text-muted-foreground">{product.category.name}</span>
    </span>
    <span class="mt-1 line-clamp-2 text-sm leading-snug font-medium">{product.title}</span>
    <span class="mt-auto flex flex-wrap items-end justify-between gap-x-3 pt-1">
      <span class="text-sm font-semibold tabular-nums">
        {#if rental}<span class="text-xs font-normal text-muted-foreground">
            {t('newOrder.fromLabel')}
          </span>{/if}
        {price}
      </span>
      <StockIndicator stock={product.stock} />
    </span>
  </span>
  <span
    class={cn(
      'absolute top-2 right-2 grid size-6 place-items-center rounded-full border text-transparent transition-colors',
      selected && 'border-primary bg-primary text-primary-foreground',
    )}
    title={selected ? t('newOrder.removeLine') : undefined}
    aria-hidden="true"
  >
    <CheckIcon class={cn('size-3.5', selected && 'group-hover:hidden')} strokeWidth={3} />
    {#if selected}<XIcon class="hidden size-3.5 group-hover:block" strokeWidth={3} />{/if}
  </span>
</button>
