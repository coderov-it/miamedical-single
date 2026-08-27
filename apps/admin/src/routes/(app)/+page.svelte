<!--
  Dashboard. KPI tiles, a rental calendar, and a paginated orders table.
  The orders table is fed by the same endpoint the orders queue uses,
  so the two can never quietly disagree about what is in the queue.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import BanknoteIcon from '@lucide/svelte/icons/banknote';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import InboxIcon from '@lucide/svelte/icons/inbox';
  import PackageIcon from '@lucide/svelte/icons/package';
  import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
  import type { Component } from 'svelte';
  import type { InferResponseType } from 'hono/client';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { api } from '~/lib/api';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import RentalCalendar from '~/lib/components/rental-calendar.svelte';
  import StatusBadge from '~/lib/components/status-badge.svelte';
  import { formatDate, formatMoney, formatNumber, relativeTime } from '~/lib/format';
  import { QueryState } from '~/lib/query-state.svelte';
  import { unwrap, unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type Stats = InferResponseType<typeof api.api.admin.orders.stats.$get, 200>['data'];
  type OrderList = InferResponseType<typeof api.api.admin.orders.$get, 200>;
  type ProductList = InferResponseType<typeof api.api.admin.products.$get, 200>;
  type CalendarResponse = InferResponseType<typeof api.api.admin.orders.calendar.$get, 200>;

  const canReadOrders = $derived(session.can(P.ORDER_READ));

  const stats = new Resource(
    () => null,
    async (_key, signal) =>
      unwrap<Stats>(await api.api.admin.orders.stats.$get(undefined, { init: { signal } })),
    { enabled: () => canReadOrders },
  );

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

  // --- calendar state -------------------------------------------------------

  let calMonth = $state(new Date().getMonth());
  let calYear = $state(new Date().getFullYear());

  function calendarRange(year: number, month: number) {
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7;
    const from = new Date(year, month, 1 - startDow);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const endDow = (new Date(year, month, daysInMonth).getDay() + 6) % 7;
    const to = new Date(year, month, daysInMonth + (6 - endDow));
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`,
      to: `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`,
    };
  }

  const calRange = $derived(calendarRange(calYear, calMonth));

  const calendarEvents = new Resource(
    () => calRange,
    async (range, signal) =>
      unwrap<CalendarResponse['data']>(
        await api.api.admin.orders.calendar.$get({ query: range }, { init: { signal } }),
      ),
    { enabled: () => canReadOrders },
  );

  function onCalendarNavigate(year: number, month: number) {
    calYear = year;
    calMonth = month;
  }

  // --- orders table ---------------------------------------------------------

  const query = new QueryState({ page: 1, day: '' });

  const orders = new Resource(
    () => query.current,
    async (current, signal) =>
      unwrapFull<OrderList>(
        await api.api.admin.orders.$get(
          {
            query: {
              page: String(current.page),
              perPage: '10',
              ...(current.day ? { from: current.day, to: current.day } : {}),
            },
          },
          { init: { signal } },
        ),
      ),
    { enabled: () => canReadOrders },
  );

  const rows = $derived(orders.data?.data ?? []);

  function filterByDay(date: string) {
    query.set({ day: date });
  }
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
    <Card.Root>
      <Card.Header>
        <Card.Description>Rental calendar</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if calendarEvents.loading && !calendarEvents.hasData}
          <div class="space-y-3">
            {#each { length: 5 } as _, row (row)}
              <Skeleton class="h-12 w-full" />
            {/each}
          </div>
        {:else if calendarEvents.error}
          <!-- Surfaced, never swallowed: an empty grid and a failed fetch must
               not look the same, or a broken endpoint reads as a quiet month. -->
          <div
            class="flex flex-col items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4"
          >
            <p class="text-sm text-destructive">
              The calendar could not load: {calendarEvents.error}
            </p>
            <Button variant="outline" size="sm" onclick={() => calendarEvents.refresh()}>
              Try again
            </Button>
          </div>
        {:else}
          <RentalCalendar
            events={calendarEvents.data ?? []}
            month={calMonth}
            year={calYear}
            onNavigate={onCalendarNavigate}
            onDayFilter={filterByDay}
          />
        {/if}
      </Card.Content>
    </Card.Root>

    <ListCard
      noun="order"
      meta={orders.data?.meta}
      loading={orders.loading}
      error={orders.error}
      isEmpty={rows.length === 0 && !orders.loading}
      onPage={(p) => query.set({ page: p })}
      onRetry={() => orders.refresh()}
    >
      {#snippet filters()}
        {#if query.current.day}
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">
              Placed on {formatDate(query.current.day)}
            </span>
            <Button variant="ghost" size="sm" onclick={() => query.set({ day: '' })}>Clear</Button>
          </div>
        {/if}
      {/snippet}

      {#snippet table()}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Order</Table.Head>
              <Table.Head>Customer</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Payment</Table.Head>
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
                <Table.Cell
                  ><StatusBadge status={order.paymentStatus} kind="payment" dot /></Table.Cell
                >
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
      {/snippet}

      {#snippet empty()}
        <Empty.Root class="py-12">
          <Empty.Media>
            <InboxIcon class="size-8 text-muted-foreground" />
          </Empty.Media>
          <Empty.Header>
            <Empty.Title>No orders yet</Empty.Title>
            <Empty.Description>
              They appear here as soon as the storefront takes one.
            </Empty.Description>
          </Empty.Header>
        </Empty.Root>
      {/snippet}
    </ListCard>
  {/if}
</section>
