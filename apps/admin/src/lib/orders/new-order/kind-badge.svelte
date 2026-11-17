<!-- Sale or Rental, the one label that says which half of the catalogue a product is. -->
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { cn } from '$lib/utils.js';
  import { t } from '~/lib/ui-text';

  let { mode, class: className }: { mode: 'fixed' | 'rental'; class?: string } = $props();

  const rental = $derived(mode === 'rental');
</script>

<Badge
  variant="outline"
  class={cn(
    'bg-background/85 backdrop-blur-sm',
    rental
      ? 'border-sky-500/40 text-sky-600 dark:text-sky-400'
      : 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    className,
  )}
>
  {rental ? t('newOrder.kindRental') : t('newOrder.kindSale')}
</Badge>
