<!-- Closing stock per day as a step line: a level that jumps, so it is never interpolated. -->
<script lang="ts">
  import { scalePoint } from 'd3-scale';
  import { curveStepAfter } from 'd3-shape';
  import { LineChart } from 'layerchart';

  import * as Chart from '$lib/components/ui/chart/index.js';
  import TrendTooltip from '~/lib/analytics/trend-tooltip.svelte';
  import type { TrendModel } from '~/lib/analytics/types';
  import { bucketLabel, bucketTitle } from '~/lib/analytics/range';
  import { locale } from '~/lib/analytics/format';
  import { formatNumber } from '~/lib/format';
  import { t, tn } from '~/lib/ui-text';

  import { integerTicks } from '~/lib/charts/ticks';
  import type { StockHistory } from './types';

  interface Props {
    series: StockHistory['series'];
  }

  let { series }: Props = $props();

  // Days before the history starts have no level; leave them out rather than draw 0.
  const known = $derived(
    series.flatMap((s) => (s.stock === null ? [] : [{ key: s.day, value: s.stock }])),
  );
  // Only a prefix of days can be null (history not started), so the known days are
  // contiguous: a day with no known neighbour exists only when there is exactly one.
  // A step line needs two points to draw, so that lone day gets a dot (r 4 = 8px).
  const dots = $derived.by(() => {
    if (known.length === 1) return { r: 4 };
    return false;
  });
  const yTicks = $derived(integerTicks(Math.max(0, ...known.map((p) => p.value))));
  const top = $derived(yTicks[yTicks.length - 1] ?? 1);

  const model = $derived<TrendModel>({
    points: known,
    ticks: known
      .filter((_, i) => i % Math.max(1, Math.ceil(known.length / 8)) === 0)
      .map((p) => p.key),
    config: { value: { label: t('stock.level'), color: 'var(--chart-1)' } },
    axisFormat: (key) => bucketLabel(key, key, 'day', locale()),
    titleFor: (key) => bucketTitle(key, key, 'day', locale()),
    yFormat: (value) => formatNumber(value),
    fullFormat: (value) => tn('stock.units', value),
  });
</script>

<Chart.Container config={model.config} class="aspect-auto h-64 w-full tabular-nums">
  <LineChart
    data={model.points}
    x="key"
    xScale={scalePoint().padding(0.5)}
    yDomain={[0, top]}
    points={dots}
    series={[{ key: 'value', label: model.config.value.label, color: model.config.value.color }]}
    props={{
      xAxis: { ticks: model.ticks, format: model.axisFormat },
      yAxis: { ticks: yTicks, format: model.yFormat },
      grid: { y: true },
      spline: { strokeWidth: 2, curve: curveStepAfter },
    }}
  >
    {#snippet tooltip()}
      <TrendTooltip {model} />
    {/snippet}
  </LineChart>
</Chart.Container>
