<!--
  Dashboard. The recent-orders table is fed by the *same* endpoint the orders
  queue uses, so the two can never quietly disagree about what is in the queue.

  Every tile says what it counts. "Revenue" in particular is not a self-evident
  word — the basis line comes from the server alongside the figure, so the
  definition and the number can never drift apart.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import BanknoteIcon from '@lucide/svelte/icons/banknote';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import PackageIcon from '@lucide/svelte/icons/package';
  import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
  import type { Component } from 'svelte';
  import type { InferResponseType } from 'hono/client';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { api } from '~/lib/api';
  import PageHeader from '~/lib/components/page-header.svelte';
  import StatusBadge from '~/lib/components/status-badge.svelte';
  import { formatMoney, formatNumber, relativeTime } from '~/lib/format';
  import { unwrap, unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type Stats = InferResponseType<typeof api.api.admin.orders.stats.$get, 200>['data'];
  type OrderList = InferResponseType<typeof api.api.admin.orders.$get, 200>;
  type ProductList = InferResponseType<typeof api.api.admin.products.$get, 200>;

  const canReadOrders = $derived(session.can(P.ORDER_READ));

  const stats = new Resource(
    () => null,
    async (_key, signal) =>
      unwrap<Stats>(await api.api.admin.orders.stats.$get(undefined, { init: { signal } })),
    { enabled: () => canReadOrders },
  );

  const recent = new Resource(
    () => null,
    async (_key, signal) =>
      unwrapFull<OrderList>(
        await api.api.admin.orders.$get({ query: { perPage: '5' } }, { init: { signal } }),
      ),
    { enabled: () => canReadOrders },
  );

  // Only the count is wanted, so ask for the smallest page the API allows and
  // read `meta.total` — no reporting endpoint needed for a number the list
  // already computes.
  const activeProducts = new Resource(
    () => null,
    async (_key, signal) =>
      unwrapFull<ProductList>(
        await api.api.admin.products.$get(
          { query: { perPage: '1', status: 'active' } },
          { init: { signal } },
        ),
      ),
    { enabled: () => session.can(P.PRODUCT_READ) },
  );

  interface Tile {
    label: string;
    value: string | undefined;
    hint: string;
    icon: Component;
    href?: string;
  }

  const tiles = $derived<Tile[]>([
    {
      label: `Revenue (${stats.data?.windowDays ?? 30} days)`,
      value: stats.data ? formatMoney(stats.data.revenue, stats.data.currency) : undefined,
      hint: stats.data?.revenueBasis ?? 'Paid and fulfilled orders only',
      icon: BanknoteIcon,
    },
    {
      label: `Orders (${stats.data?.windowDays ?? 30} days)`,
      value: stats.data ? formatNumber(stats.data.orderCount) : undefined,
      hint: 'Counted on the same basis as revenue',
      icon: ShoppingCartIcon,
      href: routes.orders,
    },
    {
      label: 'Waiting to accept',
      value: stats.data ? formatNumber(stats.data.awaitingCount) : undefined,
      hint: 'Orders still pending',
      icon: ClockIcon,
      href: routes.orders,
    },
    {
      label: 'Active products',
      value: activeProducts.data ? formatNumber(activeProducts.data.meta.total) : undefined,
      hint: 'Live on the storefront',
      icon: PackageIcon,
      href: routes.products,
    },
  ]);

  const rows = $derived(recent.data?.data ?? []);
</script>

<section class="admin-page">
  <PageHeader
    eyebrow="Dashboard"
    title="Overview"
    description="Today's activity across the catalog and the order queue."
  />

  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {#each tiles as tile (tile.label)}
      {@const Icon = tile.icon}
      <Card.Root>
        <Card.Header>
          <Card.Description>{tile.label}</Card.Description>
          <Card.Action><Icon class="size-4 text-muted-foreground" /></Card.Action>
        </Card.Header>
        <Card.Content>
          {#if tile.value === undefined}
            <Skeleton class="h-8 w-24" />
          {:else}
            <p class="text-2xl leading-tight font-semibold tracking-tight tabular-nums">
              {tile.value}
            </p>
          {/if}
          <p class="mt-1 text-xs text-muted-foreground">{tile.hint}</p>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>

  {#if canReadOrders}
    <Card.Root class="gap-0 overflow-hidden py-0">
      <div class="flex items-center justify-between border-b px-4 py-3">
        <p class="text-sm font-medium">Recent orders</p>
        <Button href={routes.orders} variant="ghost" size="sm">
          Open the queue
          <ArrowRightIcon />
        </Button>
      </div>

      {#if recent.error}
        <p class="px-4 py-6 text-sm text-destructive" role="alert">{recent.error}</p>
      {:else if !recent.data}
        <div class="space-y-3 p-4">
          {#each { length: 5 } as _, row (row)}
            <Skeleton class="h-5 w-full" />
          {/each}
        </div>
      {:else if rows.length === 0}
        <p class="px-4 py-8 text-center text-sm text-muted-foreground">
          No orders yet. They appear here as soon as the storefront takes one.
        </p>
      {:else}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Order</Table.Head>
              <Table.Head>Customer</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Placed</Table.Head>
              <Table.Head class="text-right">Total</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each rows as order (order.id)}
              <Table.Row>
                <Table.Cell class="font-mono font-medium">
                  <a href={routes.orderDetail(order.id)} class="hover:underline">{order.number}</a>
                </Table.Cell>
                <Table.Cell class="text-muted-foreground">{order.email}</Table.Cell>
                <Table.Cell><StatusBadge status={order.status} dot /></Table.Cell>
                <Table.Cell class="text-muted-foreground">
                  {relativeTime(order.placedAt)}
                </Table.Cell>
                <Table.Cell class="text-right tabular-nums">
                  {formatMoney(order.total, order.currency)}
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {/if}
    </Card.Root>
  {/if}
</section>
