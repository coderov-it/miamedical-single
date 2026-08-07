<!--
  One badge for both status axes. `kind` picks the meta table rather than the
  caller passing colours, so a status can never be styled two ways in two
  places.
-->
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { cn } from '$lib/utils.js';
  import { orderStatusMeta, paymentStatusMeta } from '~/lib/orders/status';

  interface Props {
    status: string;
    kind?: 'order' | 'payment';
    /** Adds the coloured dot — useful in dense tables, noise in a header. */
    dot?: boolean;
    class?: string;
  }

  let { status, kind = 'order', dot = false, class: className }: Props = $props();

  const meta = $derived(kind === 'order' ? orderStatusMeta(status) : paymentStatusMeta(status));
</script>

<Badge variant="outline" class={cn(meta.tone, className)}>
  {#if dot}
    <span class={cn('size-1.5 rounded-full', meta.dot)}></span>
  {/if}
  {meta.label}
</Badge>
