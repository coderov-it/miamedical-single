<script lang="ts">
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import type { InferResponseType } from 'hono/client';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { api } from '~/lib/api';
  import StatusBadge from '~/lib/components/status-badge.svelte';
  import { formatDate, formatMoney, relativeTime } from '~/lib/format';
  import { routes } from '~/lib/routes';
  import { rowClick } from '~/lib/row-click';
  import { t } from '~/lib/ui-text';

  type Rows = InferResponseType<typeof api.api.admin.orders.$get, 200>['data'];

  interface Props {
    rows: Rows;
    openId: string | null;
    onOpen: (id: string) => void;
  }

  let { rows, openId, onOpen }: Props = $props();
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{t('orders.colOrder')}</Table.Head>
      <Table.Head>{t('orders.colCustomer')}</Table.Head>
      <Table.Head>{t('orders.colStatus')}</Table.Head>
      <Table.Head>{t('orders.colPayment')}</Table.Head>
      <Table.Head>{t('orders.colContract')}</Table.Head>
      <Table.Head class="text-right">{t('orders.colItems')}</Table.Head>
      <Table.Head>{t('orders.colPlaced')}</Table.Head>
      <Table.Head class="text-right">{t('orders.colNet')}</Table.Head>
      <Table.Head class="w-10"></Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each rows as order (order.id)}
      <Table.Row
        class="cursor-pointer"
        onclick={rowClick(() => onOpen(order.id))}
        aria-selected={openId === order.id}
      >
        <Table.Cell class="font-mono font-medium">{order.number}</Table.Cell>
        <Table.Cell class="text-muted-foreground">{order.email}</Table.Cell>
        <Table.Cell><StatusBadge status={order.status} dot /></Table.Cell>
        <Table.Cell><StatusBadge status={order.paymentStatus} kind="payment" /></Table.Cell>
        <Table.Cell>
          <!-- Only rentals owe a contract, so a sale shows a dash rather
               than a warning it could never clear. -->
          {#if !order.hasRental}
            <span class="text-muted-foreground">—</span>
          {:else if order.contractStatus === 'signed'}
            <span class="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {t('status.contractSigned')}
            </span>
          {:else}
            <span class="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {t('orders.contractNotSigned')}
            </span>
          {/if}
        </Table.Cell>
        <Table.Cell class="text-right tabular-nums">{order.itemCount}</Table.Cell>
        <Table.Cell class="text-muted-foreground">
          <span title={formatDate(order.placedAt)}>{relativeTime(order.placedAt)}</span>
        </Table.Cell>
        <Table.Cell class="text-right tabular-nums">
          <span class="font-medium">{formatMoney(order.netTotal, order.currency)}</span>
          {#if Number(order.refundedTotal) > 0 || Number(order.extensionTotal) > 0}
            <span
              class={[
                'block text-xs text-muted-foreground',
                Number(order.netTotal) < Number(order.total) && 'line-through',
              ]}
            >
              {formatMoney(order.total, order.currency)}
            </span>
          {/if}
        </Table.Cell>
        <Table.Cell>
          <!-- A real link out of a row that is otherwise a drawer trigger,
               so the order can still be opened in a new tab. The row's
               handler steps aside for it; see lib/row-click.ts. -->
          <Button
            href={routes.orderDetail(order.id)}
            variant="ghost"
            size="icon-sm"
            aria-label={t('orders.openAsPageNamed', { number: order.number })}
          >
            <ExternalLinkIcon />
          </Button>
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
