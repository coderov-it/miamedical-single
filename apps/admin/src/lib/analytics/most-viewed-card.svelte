<!-- Products ranked by page views, with how many of those views ended in an order. -->
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { EM_DASH, formatNumber } from '~/lib/format';
  import { routes } from '~/lib/routes';
  import { t, tn } from '~/lib/ui-text';

  import { formatPercent } from './format';
  import { modeLabel } from './mode-label';
  import type { Views } from './types';

  interface Props {
    views: Views | undefined;
    loading: boolean;
  }

  let { views, loading }: Props = $props();

  /** `conversionRate` is orders ÷ views as a fraction (0.034 = 3.4%); null when nothing was viewed. */
  function conversion(rate: number | null): string {
    if (rate === null) return EM_DASH;
    return formatPercent(rate * 100);
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Description>{t('analytics.mostViewedTitle')}</Card.Description>
  </Card.Header>
  <Card.Content>
    {#if !views && loading}
      <div class="space-y-3">
        {#each [0, 1, 2, 3, 4] as n (n)}<Skeleton class="h-10 w-full" />{/each}
      </div>
    {:else if !views || views.topViewed.length === 0}
      <p class="text-sm text-muted-foreground">{EM_DASH}</p>
    {:else}
      <ol class="space-y-4">
        {#each views.topViewed as product, index (product.productId)}
          <li class="flex items-baseline gap-3">
            <span class="w-5 text-sm text-muted-foreground tabular-nums">{index + 1}</span>
            <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              <a
                href={routes.productDetail(product.productId)}
                class="truncate text-sm font-medium hover:underline"
              >
                {product.title}
              </a>
              <Badge variant="outline">{modeLabel(product.pricingMode)}</Badge>
            </div>
            <div class="text-right text-sm tabular-nums">
              <p class="font-medium">{formatNumber(product.views)}</p>
              <p class="text-xs text-muted-foreground">
                {t('analytics.mostViewedOrders', {
                  orders: tn('entities.order', product.orders),
                  rate: conversion(product.conversionRate),
                })}
              </p>
            </div>
          </li>
        {/each}
      </ol>
    {/if}
  </Card.Content>
</Card.Root>
