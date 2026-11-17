<!-- Rental vs sale as shares of revenue: one stacked bar, two figures. -->
<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { formatMoney } from '~/lib/format';
  import { t } from '~/lib/ui-text';

  import { formatPercent } from './format';
  import { modeLabel } from './mode-label';
  import type { Sales } from './types';

  interface Props {
    data: Sales;
  }

  let { data }: Props = $props();

  const COLORS = { rental: 'var(--chart-1)', fixed: 'var(--chart-2)' } as const;

  const total = $derived(data.modeSplit.reduce((sum, row) => sum + Number(row.revenue), 0));
  const rows = $derived(
    data.modeSplit.map((row) => ({
      ...row,
      share: total > 0 ? (Number(row.revenue) / total) * 100 : 0,
    })),
  );
</script>

<Card.Root>
  <Card.Header>
    <Card.Description>{t('analytics.splitTitle')}</Card.Description>
  </Card.Header>
  <Card.Content class="space-y-4">
    <div class="flex h-3 gap-0.5 overflow-hidden rounded-sm bg-card">
      {#each rows.filter((row) => row.share > 0) as row (row.pricingMode)}
        <div
          class="h-full"
          style:width="{row.share}%"
          style:background={COLORS[row.pricingMode]}
        ></div>
      {/each}
    </div>
    <dl class="grid gap-3 sm:grid-cols-2">
      {#each rows as row (row.pricingMode)}
        <div class="flex items-start gap-2">
          <span class="mt-1 size-2.5 shrink-0 rounded-sm" style:background={COLORS[row.pricingMode]}
          ></span>
          <div>
            <dt class="text-sm text-muted-foreground">{modeLabel(row.pricingMode)}</dt>
            <dd class="text-lg font-semibold tabular-nums">
              {formatMoney(row.revenue, data.currency)}
            </dd>
            <dd class="text-xs text-muted-foreground tabular-nums">
              {t('analytics.splitShare', { percent: formatPercent(row.share).replace('%', '') })}
            </dd>
          </div>
        </div>
      {/each}
    </dl>
  </Card.Content>
</Card.Root>
