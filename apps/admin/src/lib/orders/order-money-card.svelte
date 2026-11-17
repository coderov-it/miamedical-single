<!--
  What the order is finally worth: total, paid extensions, refunds, net — plus
  the refund history. Rules and worked examples: docs/code/order-money.md.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  import * as Alert from '$lib/components/ui/alert/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { formatDateTime, formatMoney } from '~/lib/format';
  import OrderRefundDialog from '~/lib/orders/order-refund-dialog.svelte';
  import type { OrderDetail } from '~/lib/orders/types';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';

  interface Props {
    order: OrderDetail;
    onUpdated: (order: OrderDetail) => void;
  }

  let { order, onUpdated }: Props = $props();

  let dialogOpen = $state(false);

  const money = (amount: string) => formatMoney(amount, order.totals.currency);
  const hasExtensions = $derived(Number(order.extensionTotal) > 0);
  const hasRefunds = $derived(Number(order.refundedTotal) > 0);
  const canRefund = $derived(session.can(P.ORDER_REFUND) && Number(order.netTotal) > 0);
</script>

<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">{t('orders.moneyTitle')}</div>
  <div class="space-y-3 p-4 text-sm">
    {#if order.refundAmountMissing}
      <Alert.Root>
        <TriangleAlertIcon />
        <Alert.Description>{t('orders.refundMissingWarning')}</Alert.Description>
      </Alert.Root>
    {/if}

    <dl class="space-y-1.5 tabular-nums">
      <div class="flex justify-between gap-4">
        <dt class="text-muted-foreground">{t('orders.moneyTotal')}</dt>
        <dd>{money(order.totals.total)}</dd>
      </div>
      {#if hasExtensions}
        <div class="flex justify-between gap-4">
          <dt class="text-muted-foreground">{t('orders.moneyExtensions')}</dt>
          <dd>+ {money(order.extensionTotal)}</dd>
        </div>
      {/if}
      {#if hasRefunds}
        <div class="flex justify-between gap-4">
          <dt class="text-muted-foreground">{t('orders.moneyRefunded')}</dt>
          <dd>− {money(order.refundedTotal)}</dd>
        </div>
      {/if}
      <div class="flex justify-between gap-4 border-t pt-1.5 font-semibold">
        <dt>{t('orders.moneyNet')}</dt>
        <dd>{money(order.netTotal)}</dd>
      </div>
    </dl>

    {#if order.refunds.length > 0}
      <ul class="space-y-2 border-t pt-3">
        {#each order.refunds as refund (refund.id)}
          <li class="space-y-0.5">
            <div class="flex items-baseline justify-between gap-4">
              <span class="flex flex-wrap items-center gap-2 font-medium tabular-nums">
                − {money(refund.amount)}
                {#if refund.rentalExtensionId}
                  <Badge variant="outline">{t('orders.refundForExtension')}</Badge>
                {/if}
              </span>
              <span class="text-xs text-muted-foreground">{formatDateTime(refund.createdAt)}</span>
            </div>
            <p class="whitespace-pre-wrap text-muted-foreground">{refund.reason}</p>
            {#if refund.actorName}
              <p class="text-xs text-muted-foreground">
                {t('orders.refundBy', { name: refund.actorName })}
              </p>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}

    {#if canRefund}
      <Button variant="outline" size="sm" class="w-full" onclick={() => (dialogOpen = true)}>
        {t('orders.refundRecord')}
      </Button>
    {/if}
  </div>
</Card.Root>

<OrderRefundDialog {order} open={dialogOpen} onClose={() => (dialogOpen = false)} {onUpdated} />
