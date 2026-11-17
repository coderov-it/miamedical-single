<script lang="ts">
  import { scaleBand } from 'd3-scale';
  import { BarChart } from 'layerchart';

  import TrendTooltip from './trend-tooltip.svelte';
  import type { TrendModel } from './types';

  interface Props {
    model: TrendModel;
  }

  let { model }: Props = $props();
</script>

<BarChart
  data={model.points}
  x="key"
  xScale={scaleBand().padding(0.25)}
  series={[{ key: 'value', label: model.config.value.label, color: model.config.value.color }]}
  props={{
    xAxis: { ticks: model.ticks, format: model.axisFormat },
    yAxis: { format: model.yFormat },
    grid: { y: true },
    bars: { radius: 4, rounded: 'top' },
  }}
>
  {#snippet tooltip()}
    <TrendTooltip {model} />
  {/snippet}
</BarChart>
