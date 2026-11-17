<!-- The trend chart: one metric per bucket, as bars or a line. -->
<script lang="ts">
  import ChartColumnIcon from '@lucide/svelte/icons/chart-column';
  import ChartLineIcon from '@lucide/svelte/icons/chart-line';

  import * as Card from '$lib/components/ui/card/index.js';
  import * as Chart from '$lib/components/ui/chart/index.js';
  import { formatMoney, formatNumber } from '~/lib/format';
  import { type MessageKey, t } from '~/lib/ui-text';

  import { compactMoney, compactNumber, locale } from './format';
  import { bucketLabel, bucketTitle } from './range';
  import Segmented from './segmented.svelte';
  import TrendBars from './trend-bars.svelte';
  import TrendLine from './trend-line.svelte';
  import type { ChartKind, Metric, Sales, TrendModel } from './types';

  interface Props {
    data: Sales;
    kind: ChartKind;
    onKind: (kind: ChartKind) => void;
  }

  let { data, kind, onKind }: Props = $props();

  let metric = $state<Metric>('revenue');

  const METRIC_KEYS: Record<Metric, MessageKey> = {
    revenue: 'analytics.metricRevenue',
    orderCount: 'analytics.metricOrders',
    units: 'analytics.metricUnits',
  };
  const METRICS: Metric[] = ['revenue', 'orderCount', 'units'];

  const points = $derived(
    data.series.map((s) => ({
      key: s.key,
      axis: bucketLabel(s.key, s.start, data.bucket, locale()),
      title: bucketTitle(s.key, s.start, data.bucket, locale()),
      value: metric === 'revenue' ? Number(s.revenue) : s[metric],
    })),
  );
  const axisByKey = $derived(new Map(points.map((p) => [p.key, p.axis])));
  const titleByKey = $derived(new Map(points.map((p) => [p.key, p.title])));

  // At most ~8 labels fit side by side; thin the rest rather than rotate them.
  const ticks = $derived.by(() => {
    const step = Math.max(1, Math.ceil(points.length / 8));
    return points.filter((_, i) => i % step === 0).map((p) => p.key);
  });

  const config = $derived({
    value: { label: t(METRIC_KEYS[metric]), color: 'var(--chart-1)' },
  } satisfies Chart.ChartConfig);

  function tick(value: number): string {
    if (metric === 'revenue') return compactMoney(value, data.currency);
    return compactNumber(value);
  }

  function full(value: number): string {
    if (metric === 'revenue') return formatMoney(value.toFixed(2), data.currency);
    return formatNumber(value);
  }

  const model = $derived<TrendModel>({
    points,
    ticks,
    config,
    axisFormat: (key) => axisByKey.get(key) ?? key,
    titleFor: (key) => titleByKey.get(key) ?? key,
    yFormat: tick,
    fullFormat: full,
  });
</script>

<Card.Root>
  <Card.Header>
    <Card.Description>{t('analytics.trendTitle')}</Card.Description>
    <Card.Action class="flex flex-wrap justify-end gap-2">
      <Segmented
        value={metric}
        label={t('analytics.trendTitle')}
        options={METRICS.map((id) => ({ id, label: t(METRIC_KEYS[id]) }))}
        onChange={(next) => (metric = next)}
      />
      <Segmented
        value={kind}
        label={t('analytics.chartKindLabel')}
        options={[
          { id: 'bar', label: t('analytics.chartBars'), icon: ChartColumnIcon },
          { id: 'line', label: t('analytics.chartLine'), icon: ChartLineIcon },
        ]}
        onChange={onKind}
      />
    </Card.Action>
  </Card.Header>
  <Card.Content>
    <Chart.Container {config} class="aspect-auto h-72 w-full tabular-nums">
      {#if kind === 'line'}
        <TrendLine {model} />
      {:else}
        <TrendBars {model} />
      {/if}
    </Chart.Container>
  </Card.Content>
</Card.Root>
