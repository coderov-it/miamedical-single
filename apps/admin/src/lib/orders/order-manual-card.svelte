<!--
  Who raised a manual order, where it waits, and the two things an agent does next:
  send the customer the link, or record a payment taken outside the gateway.
  Docs: docs/code/manual-orders.md.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import { toast } from 'svelte-sonner';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { api } from '~/lib/api';
  import { STAGE_LABELS, isOpenManual } from '~/lib/orders/manual-order';
  import OrderLinkDialog from '~/lib/orders/order-link-dialog.svelte';
  import OrderPaymentDialog from '~/lib/orders/order-payment-dialog.svelte';
  import type { OrderDetail } from '~/lib/orders/types';
  import { errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';

  interface Props {
    order: OrderDetail;
    onUpdated: (order: OrderDetail) => void;
  }

  let { order, onUpdated }: Props = $props();

  let linkOpen = $state(false);
  let paymentOpen = $state(false);

  const stageKey = $derived(order.manualStage ? STAGE_LABELS[order.manualStage] : undefined);
  const open = $derived(isOpenManual(order));

  /** A link writes a timeline entry, so the order is read again. */
  async function reload() {
    try {
      onUpdated(
        await unwrap<OrderDetail>(
          await api.api.admin.orders[':id'].$get({ param: { id: order.id } }),
        ),
      );
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }
</script>

<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">{t('newOrder.manualTitle')}</div>
  <div class="space-y-3 p-4 text-sm">
    <p class="text-muted-foreground">
      {order.createdByName
        ? t('newOrder.createdBy', { name: order.createdByName })
        : t('newOrder.sourceManual')}
    </p>
    {#if stageKey}
      <Badge variant="outline" class="border-amber-500/40 text-amber-600 dark:text-amber-400">
        {t(stageKey)}
      </Badge>
    {/if}

    {#if open}
      <div class="flex flex-wrap gap-2">
        {#if session.can(P.ORDER_CREATE)}
          <Button size="sm" onclick={() => (linkOpen = true)}>{t('newOrder.sendLink')}</Button>
        {/if}
        {#if session.can(P.ORDER_UPDATE)}
          <Button size="sm" variant="outline" onclick={() => (paymentOpen = true)}>
            {t('newOrder.recordPayment')}
          </Button>
        {/if}
      </div>
    {/if}
  </div>
</Card.Root>

{#if linkOpen}
  <OrderLinkDialog {order} open onClose={() => (linkOpen = false)} onSent={reload} />
{/if}
{#if paymentOpen}
  <OrderPaymentDialog {order} open onClose={() => (paymentOpen = false)} {onUpdated} />
{/if}
