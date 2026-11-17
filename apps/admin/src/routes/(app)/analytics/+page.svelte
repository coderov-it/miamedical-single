<!--
  Sales analytics. Range and bucket live in the URL (`from`, `to`, `bucket`);
  everything below the toolbar is one fetch of the sales endpoint.
-->
<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { api } from '~/lib/api';
  import KpiTiles from '~/lib/analytics/kpi-tiles.svelte';
  import ModeSplitCard from '~/lib/analytics/mode-split-card.svelte';
  import {
    autoBucket,
    type Bucket,
    type DayRange,
    presetRange,
    resolveQuery,
    todayRome,
  } from '~/lib/analytics/range';
  import { createCache, salesKey } from '~/lib/analytics/sales-cache';
  import Toolbar from '~/lib/analytics/toolbar.svelte';
  import TopProductsCard from '~/lib/analytics/top-products-card.svelte';
  import TrendCard from '~/lib/analytics/trend-card.svelte';
  import type { ChartKind, Sales } from '~/lib/analytics/types';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { formatDate, formatTime } from '~/lib/format';
  import { QueryState } from '~/lib/query-state.svelte';
  import { unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { t } from '~/lib/ui-text';

  const today = todayRome();
  const query = new QueryState({ from: '', to: '', bucket: '', chart: 'bar' }, { pageKey: null });
  const resolved = $derived(resolveQuery(query.current, today));

  // The request itself is never aborted (a prefetch must survive the pointer
  // leaving); the Resource drops a superseded response by its own id.
  const cache = createCache<Sales>(async (key) => {
    const [from = '', to = '', bucket = 'day'] = key.split('|') as [string, string, Bucket];
    return unwrap<Sales>(await api.api.admin.analytics.sales.$get({ query: { from, to, bucket } }));
  });

  // A string key: `chart` changes `resolved` but not this, so it never refetches.
  const sales = new Resource(
    () => salesKey(resolved.range, resolved.bucket),
    (key) => cache.get(key),
  );

  const chartKind = $derived<ChartKind>(query.current.chart === 'line' ? 'line' : 'bar');

  function hint(range: DayRange, bucket: Bucket) {
    cache.prefetch(salesKey(range, bucket));
  }

  const stale = $derived(sales.loading && sales.hasData);

  const period = $derived.by(() => {
    const data = sales.data;
    if (!data) return '';
    const text = `${formatDate(`${data.range.from}T12:00:00`)} – ${formatDate(`${data.range.to}T12:00:00`)}`;
    if (!data.refreshedAt) return text;
    return t('analytics.periodUpdated', { period: text, time: formatTime(data.refreshedAt) });
  });

  const isEmpty = $derived(sales.data !== undefined && sales.data.totals.orderCount === 0);
</script>

<section class="admin-page">
  <PageHeader eyebrow={t('nav.analytics')} title={t('analytics.title')} />

  <Toolbar
    range={resolved.range}
    bucket={resolved.bucket}
    {today}
    onPreset={(id) => query.set({ ...presetRange(id, today), bucket: '' })}
    onRange={(range) => query.set({ ...range, bucket: '' })}
    onBucket={(bucket) => query.set({ bucket })}
    onHintPreset={(id) => hint(presetRange(id, today), autoBucket(presetRange(id, today)))}
    onHintBucket={(bucket) => hint(resolved.range, bucket)}
    loading={stale}
    {period}
  />

  {#if sales.error && !sales.hasData}
    <div
      class="flex flex-col items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4"
    >
      <p class="text-sm text-destructive">{t('analytics.loadFailed', { error: sales.error })}</p>
      <Button variant="outline" size="sm" onclick={() => sales.refresh()}>
        {t('common.retry')}
      </Button>
    </div>
  {:else if sales.data === undefined}
    <KpiTiles data={undefined} />
    <Skeleton class="h-80 w-full" />
    <div class="grid gap-4 lg:grid-cols-2">
      <Skeleton class="h-96 w-full" />
      <Skeleton class="h-48 w-full" />
    </div>
  {:else}
    <div class={['relative space-y-6 transition-opacity', stale && 'opacity-60']} aria-busy={stale}>
      <!-- Pinned over the gap above, so a refetch shifts nothing. -->
      <div class="pointer-events-none absolute inset-x-0 -top-3.5 h-0.5">
        {#if stale}<div class="admin-loading-bar"></div>{/if}
      </div>
      <KpiTiles data={sales.data} />
      {#if isEmpty}
        <Empty.Root>
          <Empty.Header>
            <Empty.Title>{t('analytics.emptyTitle')}</Empty.Title>
            <Empty.Description>{t('analytics.emptyDescription')}</Empty.Description>
          </Empty.Header>
        </Empty.Root>
      {:else}
        <TrendCard data={sales.data} kind={chartKind} onKind={(chart) => query.set({ chart })} />
        <div class="grid items-start gap-4 lg:grid-cols-2">
          <TopProductsCard data={sales.data} />
          <ModeSplitCard data={sales.data} />
        </div>
      {/if}
    </div>
  {/if}
</section>
