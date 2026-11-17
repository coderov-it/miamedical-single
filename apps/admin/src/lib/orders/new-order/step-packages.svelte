<!-- Step 2. One configuration card per selected product, in the order they were picked. -->
<script lang="ts">
  import LineConfigCard from './line-config-card.svelte';
  import type { OrderForm } from './order-form.svelte';

  let { form }: { form: OrderForm } = $props();
</script>

<div class="space-y-4 pb-4">
  {#each form.lines as line, index (line.key)}
    <LineConfigCard {form} {line} {index} />
  {/each}
</div>
