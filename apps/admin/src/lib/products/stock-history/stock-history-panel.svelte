<!--
  The "Stock" tab of the product editor. Panels stay mounted behind `hidden`,
  so nothing is fetched until the tab has been shown once (`active`).
-->
<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { api } from '~/lib/api';
  import { addDays, type DayRange, todayRome } from '~/lib/analytics/range';
  import { unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { t } from '~/lib/ui-text';

  import MovementsTable from './movements-table.svelte';
  import StockChart from './stock-chart.svelte';
  import StockToolbar from './stock-toolbar.svelte';
  import type { StockHistory } from './types';

  interface Props {
    productId: string;
    active: boolean;
  }

  let { productId, active }: Props = $props();

  const today = todayRome();
  let range = $state<DayRange>({ from: addDays(today, -89), to: today });
  let page = $state(1);
  let seen = $state(false);

  $effect(() => {
    if (active) seen = true;
  });

  const history = new Resource(
    () => ({ id: productId, from: range.from, to: range.to, page }),
    async (key, signal) =>
      unwrap<StockHistory>(
        await api.api.admin.products[':id']['stock-history'].$get(
          {
            param: { id: key.id },
            query: { from: key.from, to: key.to, page: String(key.page) },
          },
          { init: { signal } },
        ),
      ),
    { enabled: () => seen },
  );

  const stale = $derived(history.loading && history.hasData);
  const hasLevels = $derived(history.data?.series.some((s) => s.stock !== null) ?? false);

  function setRange(next: DayRange) {
    range = next;
    page = 1;
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Description>{t('stock.title')}</Card.Description>
  </Card.Header>
  <Card.Content class="space-y-4">
    <StockToolbar {range} {today} loading={stale} onRange={setRange} />

    {#if history.error && !history.hasData}
      <div
        class="flex flex-col items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4"
      >
        <p class="text-sm text-destructive">{t('stock.loadFailed', { error: history.error })}</p>
        <Button variant="outline" size="sm" onclick={() => history.refresh()}>
          {t('common.retry')}
        </Button>
      </div>
    {:else if history.data === undefined}
      <Skeleton class="h-64 w-full" />
      <Skeleton class="h-48 w-full" />
    {:else}
      <div class={['space-y-4 transition-opacity', stale && 'opacity-60']} aria-busy={stale}>
        {#if hasLevels}<StockChart series={history.data.series} />{/if}
        <MovementsTable
          movements={history.data.movements}
          meta={history.data.movementsMeta}
          loading={history.loading}
          error={history.error}
          onPage={(next) => (page = next)}
          onRetry={() => history.refresh()}
        />
      </div>
    {/if}
  </Card.Content>
</Card.Root>
