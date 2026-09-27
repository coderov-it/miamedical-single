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
  import { api } from '~/lib/api';
  import PageHeader from '~/lib/components/page-header.svelte';
  import StatusBadge from '~/lib/components/status-badge.svelte';
  import ResourceView from '~/lib/components/resource-view.svelte';
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

  <ResourceView resource={order} noun="order">
    {#snippet children(current)}
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge status={current.status} dot />
        <StatusBadge status={current.paymentStatus} kind="payment" dot />
      </div>

      <OrderDetailView order={current} onUpdated={(updated) => order.set(updated)} compact />
    {/snippet}
  </ResourceView>
</section>
