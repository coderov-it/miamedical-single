<!-- KPI strip. `pageValue` is labelled "this page" because that is exactly
     what it sums — a money figure must never imply more than it covers. -->
<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { formatMoney } from '~/lib/format';
  import { t, tn } from '~/lib/ui-text';

  interface Props {
    total: number | undefined;
    awaitingCount: number | undefined;
    pageValue: { amount: string; currency: string } | undefined;
    /** Rows on this page, or undefined before the first load. */
    rowCount: number | undefined;
  }

  let { total, awaitingCount, pageValue, rowCount }: Props = $props();
</script>

<div class="grid gap-4 sm:grid-cols-3">
  {#each [{ label: t('orders.kpiTotal'), value: total, hint: t('orders.kpiTotalHint') }, { label: t('orders.kpiAwaiting'), value: awaitingCount, hint: t('orders.kpiAwaitingHint') }] as tile (tile.label)}
    <Card.Root>
      <Card.Header><Card.Description>{tile.label}</Card.Description></Card.Header>
      <Card.Content>
        {#if tile.value === undefined}
          <Skeleton class="h-8 w-16" />
        {:else}
          <p class="text-2xl leading-tight font-semibold tabular-nums">{tile.value}</p>
        {/if}
        <p class="mt-1 text-xs text-muted-foreground">{tile.hint}</p>
      </Card.Content>
    </Card.Root>
  {/each}

  <Card.Root>
    <Card.Header><Card.Description>{t('orders.kpiPageValue')}</Card.Description></Card.Header>
    <Card.Content>
      {#if !pageValue}
        <Skeleton class="h-8 w-24" />
      {:else}
        <p class="text-2xl leading-tight font-semibold tabular-nums">
          {formatMoney(pageValue.amount, pageValue.currency)}
        </p>
      {/if}
      <p class="mt-1 text-xs text-muted-foreground">
        {rowCount === undefined ? t('orders.pageValueOnly') : tn('orders.pageValueCount', rowCount)}
      </p>
    </Card.Content>
  </Card.Root>
</div>
