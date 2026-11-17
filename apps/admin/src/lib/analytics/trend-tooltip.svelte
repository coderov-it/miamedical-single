<!-- Tooltip body shared by the bar and line charts: bucket title, then the formatted value. -->
<script lang="ts">
  import * as Chart from '$lib/components/ui/chart/index.js';

  import type { TrendModel } from './types';

  interface Props {
    model: TrendModel;
  }

  let { model }: Props = $props();
</script>

<Chart.Tooltip labelFormatter={(key: string) => model.titleFor(key)} indicator="line">
  {#snippet formatter({ name, value })}
    <div class="flex w-full items-center justify-between gap-4">
      <span class="text-muted-foreground">{name}</span>
      <span class="font-medium text-foreground">{model.fullFormat(Number(value))}</span>
    </div>
  {/snippet}
</Chart.Tooltip>
