<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import StatusBadge from '~/lib/components/status-badge.svelte';
  import { formatDate } from '~/lib/format';
  import OrderDetailView from '~/lib/orders/order-detail-view.svelte';
  import type { OrderDetail } from '~/lib/orders/types';
  import type { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { t } from '~/lib/ui-text';

  interface Props {
    openId: string | null;
    detail: Resource<OrderDetail | undefined, string | null>;
    onClose: () => void;
    onUpdated: (order: OrderDetail) => void;
  }

  let { openId, detail, onClose, onUpdated }: Props = $props();
</script>

<Sheet.Root
  open={openId !== null}
  onOpenChange={(open) => {
    if (!open) onClose();
  }}
>
  <!--
    The width override has to carry the same `data-[side=right]:sm:` prefix the
    base class uses. A bare `sm:max-w-3xl` is a different variant group, so
    tailwind-merge keeps both and the more specific base wins — the drawer
    silently stays narrow.
  -->
  <Sheet.Content side="right" class="gap-0 p-0 data-[side=right]:sm:max-w-3xl">
    <Sheet.Header class="border-b">
      <Sheet.Title class="flex items-center gap-3">
        <span class="font-mono">{detail.data?.number ?? t('orders.orderFallback')}</span>
        {#if detail.data}
          <StatusBadge status={detail.data.status} dot />
          <StatusBadge status={detail.data.paymentStatus} kind="payment" />
        {/if}
      </Sheet.Title>
      <Sheet.Description>
        {#if detail.data}
          {t('orders.drawerPlaced', { date: formatDate(detail.data.placedAt) })} ·
          <a href={routes.orderDetail(detail.data.id)} class="underline underline-offset-4">
            {t('orders.openAsPageLink')}
          </a>
        {:else}
          {t('orders.drawerLoading')}
        {/if}
      </Sheet.Description>
    </Sheet.Header>

    <!-- `min-h-0` is what lets a flex child actually scroll instead of growing. -->
    <div class="min-h-0 flex-1 overflow-y-auto p-4">
      {#if detail.error}
        <p class="text-sm text-destructive" role="alert">{detail.error}</p>
      {:else if !detail.data}
        <div class="space-y-3">
          {#each { length: 8 } as _, row (row)}
            <Skeleton class="h-6 w-full" />
          {/each}
        </div>
      {:else}
        <OrderDetailView order={detail.data} {onUpdated} compact />
      {/if}
    </div>
  </Sheet.Content>
</Sheet.Root>
