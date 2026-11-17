<!-- Four KPI tiles, each with its change against the previous period. -->
<script lang="ts">
  import BanknoteIcon from '@lucide/svelte/icons/banknote';
  import BoxesIcon from '@lucide/svelte/icons/boxes';
  import ReceiptIcon from '@lucide/svelte/icons/receipt';
  import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
  import type { Component } from 'svelte';

  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import InfoHint from '~/lib/components/info-hint.svelte';
  import { EM_DASH, formatMoney, formatNumber } from '~/lib/format';
  import { t } from '~/lib/ui-text';

  import { formatPercent } from './format';
  import { percentChange } from './range';
  import type { Sales } from './types';

  interface Props {
    data: Sales | undefined;
  }

  let { data }: Props = $props();

  interface Tile {
    label: string;
    icon: Component;
    value: string;
    change: number | null;
    info?: boolean;
    note?: string;
  }

  const tiles = $derived.by<Tile[] | undefined>(() => {
    if (!data) return undefined;
    const { totals: now, previousTotals: before, currency } = data;
    const extensions = Number(now.extensionRevenue);
    const refunds = Number(now.refundedTotal);
    const parts: string[] = [];
    if (extensions > 0) {
      parts.push(
        t('analytics.noteExtensions', { amount: formatMoney(now.extensionRevenue, currency) }),
      );
    }
    if (refunds > 0) {
      parts.push(t('analytics.noteRefunds', { amount: formatMoney(now.refundedTotal, currency) }));
    }
    return [
      {
        label: t('analytics.tileRevenue'),
        icon: BanknoteIcon,
        value: formatMoney(now.revenue, currency),
        change: percentChange(Number(now.revenue), Number(before.revenue)),
        info: true,
        ...(parts.length > 0 ? { note: parts.join(', ') } : {}),
      },
      {
        label: t('analytics.tileOrders'),
        icon: ShoppingCartIcon,
        value: formatNumber(now.orderCount),
        change: percentChange(now.orderCount, before.orderCount),
      },
      {
        label: t('analytics.tileAverageOrder'),
        icon: ReceiptIcon,
        value: formatMoney(now.averageOrderValue, currency),
        change: percentChange(Number(now.averageOrderValue), Number(before.averageOrderValue)),
      },
      {
        label: t('analytics.tileUnits'),
        icon: BoxesIcon,
        value: formatNumber(now.units),
        change: percentChange(now.units, before.units),
      },
    ];
  });

  const placeholders = [0, 1, 2, 3];
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  {#if tiles}
    {#each tiles as tile (tile.label)}
      {@const Icon = tile.icon}
      <Card.Root>
        <Card.Header>
          <Card.Description class="flex items-center gap-1">
            {tile.label}
            {#if tile.info}
              <InfoHint label={t('analytics.revenueBasisLabel')}>
                {t('analytics.revenueBasis')}
              </InfoHint>
            {/if}
          </Card.Description>
          <Card.Action><Icon class="size-4 text-muted-foreground" /></Card.Action>
        </Card.Header>
        <Card.Content>
          <p class="text-2xl leading-tight font-semibold tracking-tight tabular-nums">
            {tile.value}
          </p>
          {#if tile.note}
            <p class="mt-0.5 text-xs text-muted-foreground tabular-nums">{tile.note}</p>
          {/if}
          <p class="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            {#if tile.change === null}
              <span>{EM_DASH}</span>
            {:else if tile.change >= 0}
              <span class="font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                ▲ {formatPercent(tile.change)}
              </span>
            {:else}
              <span class="font-medium text-destructive tabular-nums">
                ▼ {formatPercent(tile.change)}
              </span>
            {/if}
            {t('analytics.vsPrevious')}
          </p>
        </Card.Content>
      </Card.Root>
    {/each}
  {:else}
    {#each placeholders as n (n)}
      <Card.Root>
        <Card.Header><Skeleton class="h-4 w-24" /></Card.Header>
        <Card.Content class="space-y-2">
          <Skeleton class="h-8 w-28" />
          <Skeleton class="h-3 w-32" />
        </Card.Content>
      </Card.Root>
    {/each}
  {/if}
</div>
