<!-- Ranked top products with a proportional bar, switchable between revenue and units. -->
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { formatMoney } from '~/lib/format';
  import { routes } from '~/lib/routes';
  import { t, tn } from '~/lib/ui-text';

  import { modeLabel } from './mode-label';
  import Segmented from './segmented.svelte';
  import type { Sales, TopProduct } from './types';

  interface Props {
    data: Sales;
  }

  let { data }: Props = $props();

  type Ranking = 'byRevenue' | 'byUnits';
  let ranking = $state<Ranking>('byRevenue');

  const rows = $derived(data.topProducts[ranking]);

  function weight(product: TopProduct): number {
    if (ranking === 'byRevenue') return Number(product.revenue);
    return product.units;
  }

  const max = $derived(Math.max(1, ...rows.map(weight)));
</script>

<Card.Root>
  <Card.Header>
    <Card.Description>{t('analytics.topTitle')}</Card.Description>
    <Card.Action>
      <Segmented
        value={ranking}
        label={t('analytics.topTitle')}
        options={[
          { id: 'byRevenue', label: t('analytics.topByRevenue') },
          { id: 'byUnits', label: t('analytics.topByUnits') },
        ]}
        onChange={(next) => (ranking = next)}
      />
    </Card.Action>
  </Card.Header>
  <Card.Content>
    <ol class="space-y-4">
      {#each rows as product, index (`${product.productId ?? product.title}-${product.pricingMode}`)}
        <li class="space-y-1.5">
          <div class="flex items-baseline gap-3">
            <span class="w-5 text-sm text-muted-foreground tabular-nums">{index + 1}</span>
            <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              {#if product.productId}
                <a
                  href={routes.productDetail(product.productId)}
                  class="truncate text-sm font-medium hover:underline"
                >
                  {product.title}
                </a>
              {:else}
                <span class="truncate text-sm font-medium">{product.title}</span>
              {/if}
              <Badge variant="outline">
                {modeLabel(product.pricingMode)}
              </Badge>
            </div>
            <div class="text-right text-sm tabular-nums">
              <p class="font-medium">{formatMoney(product.revenue, data.currency)}</p>
              <p class="text-xs text-muted-foreground">
                {tn('analytics.unitsCount', product.units)}
              </p>
            </div>
          </div>
          <div class="ml-8 h-1.5 overflow-hidden rounded-sm bg-muted">
            <div
              class="h-full rounded-sm bg-(--chart-1)"
              style:width="{(weight(product) / max) * 100}%"
            ></div>
          </div>
        </li>
      {/each}
    </ol>
  </Card.Content>
</Card.Root>
