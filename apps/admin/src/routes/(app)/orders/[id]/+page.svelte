<!--
  The routed order page. It is a thin frame around `OrderDetailView` — the same
  component the queue's drawer renders — so a shared link and a triage glance
  can never disagree about what an order says.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import type { InferResponseType } from 'hono/client';

  import { page } from '$app/state';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { api } from '~/lib/api';
  import PageHeader from '~/lib/components/page-header.svelte';
  import StatusBadge from '~/lib/components/status-badge.svelte';
  import { formatDateTime } from '~/lib/format';
  import OrderDetailView from '~/lib/orders/order-detail-view.svelte';
  import { unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type OrderDetail = InferResponseType<(typeof api.api.admin.orders)[':id']['$get'], 200>['data'];

  const order = new Resource(
    () => page.params.id,
    async (id, signal) =>
      unwrap<OrderDetail>(
        await api.api.admin.orders[':id'].$get({ param: { id: id! } }, { init: { signal } }),
      ),
    { enabled: () => session.can(P.ORDER_READ) },
  );
</script>

<section class="admin-page">
  <PageHeader
    eyebrow="Sales"
    title={order.data?.number ?? 'Order'}
    description={order.data ? `Placed ${formatDateTime(order.data.placedAt)}` : ''}
  >
    {#snippet actions()}
      <Button href={routes.orders} variant="outline">
        <ArrowLeftIcon />
        Back to queue
      </Button>
    {/snippet}
  </PageHeader>

  {#if order.error}
    <Empty.Root class="border bg-card">
      <Empty.Header>
        <Empty.Title>This order could not be loaded</Empty.Title>
        <Empty.Description>{order.error}</Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button variant="outline" onclick={() => order.refresh()}>Try again</Button>
      </Empty.Content>
    </Empty.Root>
  {:else if !order.data}
    <div class="space-y-4">
      <Skeleton class="h-20 w-full" />
      <Skeleton class="h-64 w-full" />
    </div>
  {:else}
    <div class="flex flex-wrap items-center gap-2">
      <StatusBadge status={order.data.status} dot />
      <StatusBadge status={order.data.paymentStatus} kind="payment" dot />
    </div>

    <OrderDetailView order={order.data} onUpdated={(updated) => order.set(updated)} compact />
  {/if}
</section>
