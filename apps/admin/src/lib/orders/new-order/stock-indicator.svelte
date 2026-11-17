<!-- Units on the shelf, as a dot and a few words: out, running low, or plenty. -->
<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { t } from '~/lib/ui-text';

  let { stock }: { stock: number } = $props();

  const LOW = 3;
  const out = $derived(stock <= 0);
  const low = $derived(stock > 0 && stock <= LOW);
  const tone = $derived.by(() => {
    if (out) return 'bg-destructive';
    if (low) return 'bg-amber-500';
    return 'bg-emerald-500';
  });
</script>

<span class="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
  <span class={cn('size-1.5 rounded-full', tone)}></span>
  {#if out}
    {t('newOrder.stockOut')}
  {:else if low}
    {t('newOrder.stockLow', { count: stock })}
  {:else}
    {t('newOrder.stockIn', { count: stock })}
  {/if}
</span>
