<!-- Line mode: a 2px spline, dots only while there are few enough buckets to tell apart. -->
<script lang="ts">
  import { scalePoint } from 'd3-scale';
  import { curveMonotoneX } from 'd3-shape';
  import { LineChart } from 'layerchart';

  import TrendTooltip from './trend-tooltip.svelte';
  import type { TrendModel } from './types';

  interface Props {
    model: TrendModel;
  }

  let { model }: Props = $props();

  const dots = $derived.by(() => {
    if (model.points.length <= 31) return { r: 4 };
    return false;
  });
</script>

<LineChart
  data={model.points}
  x="key"
  xScale={scalePoint().padding(0.5)}
  series={[{ key: 'value', label: model.config.value.label, color: model.config.value.color }]}
  points={dots}
  props={{
    xAxis: { ticks: model.ticks, format: model.axisFormat },
    yAxis: { format: model.yFormat, ...(model.yTicks ? { ticks: model.yTicks } : {}) },
    grid: { y: true },
    spline: { strokeWidth: 2, curve: curveMonotoneX },
  }}
>
  {#snippet tooltip()}
    <TrendTooltip {model} />
  {/snippet}
</LineChart>
