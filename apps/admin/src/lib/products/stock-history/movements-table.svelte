<!-- The stock movements of the range, newest first, with the shared list chrome and pager. -->
<script lang="ts">
  import PackageIcon from '@lucide/svelte/icons/package';

  import * as Empty from '$lib/components/ui/empty/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import InfoHint from '~/lib/components/info-hint.svelte';
  import ListCard from '~/lib/components/list-card.svelte';
  import { EM_DASH, formatDateTime, formatNumber } from '~/lib/format';
  import { routes } from '~/lib/routes';
  import { t } from '~/lib/ui-text';

  import { actorLabel, reasonLabel } from './labels';
  import { signedDelta } from './stock-math';
  import type { StockHistory } from './types';

  interface Props {
    movements: StockHistory['movements'];
    meta: StockHistory['movementsMeta'] | undefined;
    loading: boolean;
    error: string | null;
    onPage: (page: number) => void;
    onRetry: () => void;
  }

  let { movements, meta, loading, error, onPage, onRetry }: Props = $props();

  const listMeta = $derived(
    meta && { ...meta, pageCount: Math.max(1, Math.ceil(meta.total / meta.perPage)) },
  );
</script>

<ListCard
  countKey="stock.movementCount"
  meta={listMeta}
  {loading}
  {error}
  isEmpty={movements.length === 0 && !loading}
  {onPage}
  {onRetry}
  skeletonColumns={6}
>
  {#snippet table()}
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>{t('stock.colWhen')}</Table.Head>
          <Table.Head>{t('stock.colReason')}</Table.Head>
          <Table.Head class="text-right">{t('stock.colChange')}</Table.Head>
          <Table.Head class="text-right">{t('stock.colAfter')}</Table.Head>
          <Table.Head>{t('stock.colOrder')}</Table.Head>
          <Table.Head>{t('stock.colBy')}</Table.Head>
          <Table.Head>{t('stock.colNote')}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each movements as movement (movement.id)}
          <Table.Row>
            <Table.Cell class="text-muted-foreground tabular-nums">
              {formatDateTime(movement.at)}
            </Table.Cell>
            <Table.Cell>
              {#if movement.reason === 'unknown'}
                <span class="inline-flex items-center gap-1 text-muted-foreground">
                  {reasonLabel(movement.reason)}
                  <InfoHint label={t('stock.reasonUnknown')}>{t('stock.unknownInfo')}</InfoHint>
                </span>
              {:else}
                {reasonLabel(movement.reason)}
              {/if}
            </Table.Cell>
            <Table.Cell
              class={[
                'text-right font-medium tabular-nums',
                movement.delta > 0 && 'text-emerald-600 dark:text-emerald-400',
                movement.delta < 0 && 'text-destructive',
              ]}
            >
              {signedDelta(movement.delta)}
            </Table.Cell>
            <Table.Cell class="text-right tabular-nums"
              >{formatNumber(movement.stockAfter)}</Table.Cell
            >
            <Table.Cell class="font-mono">
              {#if movement.order}
                <a href={routes.orderDetail(movement.order.id)} class="hover:underline">
                  {movement.order.number}
                </a>
              {:else}
                <span class="text-muted-foreground">{EM_DASH}</span>
              {/if}
            </Table.Cell>
            <Table.Cell class="text-muted-foreground">
              {actorLabel(movement.reason, movement.actorName)}
            </Table.Cell>
            <Table.Cell class="max-w-56 truncate text-muted-foreground" title={movement.note ?? ''}>
              {movement.note ?? EM_DASH}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  {/snippet}

  {#snippet empty()}
    <Empty.Root class="border-0">
      <Empty.Header>
        <Empty.Media variant="icon"><PackageIcon /></Empty.Media>
        <Empty.Title>{t('stock.emptyTitle')}</Empty.Title>
      </Empty.Header>
    </Empty.Root>
  {/snippet}
</ListCard>
