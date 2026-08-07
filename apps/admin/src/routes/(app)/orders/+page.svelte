<script lang="ts">
  import { P } from '@mia/permissions';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import InboxIcon from '@lucide/svelte/icons/inbox';
  import SearchIcon from '@lucide/svelte/icons/search';
  import type { InferResponseType } from 'hono/client';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import StatusBadge from '~/lib/components/status-badge.svelte';
  import { formatDate, formatMoney, pluralize, relativeTime } from '~/lib/format';
  import OrderDetailView from '~/lib/orders/order-detail-view.svelte';
  import { ORDER_STATUS_ORDER, orderStatusMeta } from '~/lib/orders/status';
  import { QueryDraft, QueryState } from '~/lib/query-state.svelte';
  import { unwrap, unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type ListResponse = InferResponseType<typeof api.api.admin.orders.$get, 200>;
  type OrderDetail = InferResponseType<(typeof api.api.admin.orders)[':id']['$get'], 200>['data'];

  const ANY = '__any';

  const query = new QueryState({ q: '', status: ANY, page: 1 });
  const draft = new QueryDraft(query);

  const orders = new Resource(
    () => query.current,
    async (current, signal) =>
      unwrapFull<ListResponse>(
        await api.api.admin.orders.$get(
          {
            query: {
              page: String(current.page),
              ...(current.q ? { q: current.q } : {}),
              ...(current.status !== ANY ? { status: current.status } : {}),
            },
          },
          { init: { signal } },
        ),
      ),
    { enabled: () => session.can(P.ORDER_READ) },
  );

  const rows = $derived(orders.data?.data ?? []);
  const stats = $derived(orders.data?.stats);

  /**
   * `?order=<id>` opens the drawer. Keeping it in the URL rather than in local
   * state is what makes a triage view shareable: paste the link and the other
   * person lands on the same order, filters and all.
   */
  const openId = $derived(page.url.searchParams.get('order'));

  const detail = new Resource(
    () => openId,
    async (id, signal) => {
      if (!id) return undefined;
      return unwrap<OrderDetail>(
        await api.api.admin.orders[':id'].$get({ param: { id } }, { init: { signal } }),
      );
    },
    { enabled: () => session.can(P.ORDER_READ) },
  );

  function openDrawer(id: string) {
    const params = new URLSearchParams(page.url.search);
    params.set('order', id);
    void goto(`${page.url.pathname}?${params}`, { noScroll: true, keepFocus: true });
  }

  function closeDrawer() {
    const params = new URLSearchParams(page.url.search);
    params.delete('order');
    const search = params.toString();
    void goto(`${page.url.pathname}${search ? `?${search}` : ''}`, {
      noScroll: true,
      keepFocus: true,
    });
  }

  /**
   * A status change from inside the drawer moves the row in the list too, so
   * the two cannot show different states while both are on screen.
   */
  function onUpdated(updated: OrderDetail) {
    detail.set(updated);
    orders.refresh();
  }
</script>

<section class="admin-page">
  <PageHeader
    eyebrow="Sales"
    title="Orders"
    description="The queue, oldest work first. Open an order to move it along."
  />

  <!-- KPI strip. `pageValue` is labelled "this page" because that is exactly
       what it sums — a money figure must never imply more than it covers. -->
  <div class="grid gap-4 sm:grid-cols-3">
    {#each [{ label: 'Total orders', value: orders.data?.meta.total, hint: 'All time' }, { label: 'Waiting to accept', value: stats?.awaitingCount, hint: 'Status is pending' }] as tile (tile.label)}
      <Card.Root>
        <Card.Header><Card.Description>{tile.label}</Card.Description></Card.Header>
        <Card.Content>
          {#if tile.value === undefined}
            <Skeleton class="h-8 w-16" />
          {:else}
            <p class="text-2xl leading-tight font-semibold tabular-nums">{tile.value}</p>
          {/if}
          <p class="mt-1 text-xs text-muted-foreground">{tile.hint}</p>
        </Card.Content>
      </Card.Root>
    {/each}

    <Card.Root>
      <Card.Header><Card.Description>Value on this page</Card.Description></Card.Header>
      <Card.Content>
        {#if !stats}
          <Skeleton class="h-8 w-24" />
        {:else}
          <p class="text-2xl leading-tight font-semibold tabular-nums">
            {formatMoney(stats.pageValue, stats.currency)}
          </p>
        {/if}
        <p class="mt-1 text-xs text-muted-foreground">
          {orders.data ? pluralize(rows.length, 'order') : 'This page only'} — not the whole queue
        </p>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Segmented status bar: one click, no Apply. It is a single choice, and
       making people confirm it would be friction with nothing behind it. -->
  <div class="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
    {#each [ANY, ...ORDER_STATUS_ORDER] as value (value)}
      {@const active = query.current.status === value}
      <button
        type="button"
        onclick={() => query.set({ status: value })}
        aria-pressed={active}
        class={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
          active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
        )}
      >
        {#if value !== ANY}
          <span class={cn('size-1.5 rounded-full', orderStatusMeta(value).dot)}></span>
        {/if}
        {value === ANY ? 'All' : orderStatusMeta(value).label}
      </button>
    {/each}
  </div>

  <ListCard
    noun="order"
    meta={orders.data?.meta}
    loading={orders.loading}
    error={orders.error}
    isEmpty={rows.length === 0}
    onPage={(next) => query.set({ page: next })}
    onRetry={() => orders.refresh()}
    skeletonColumns={6}
  >
    {#snippet filters()}
      <form
        class="flex items-center gap-2"
        onsubmit={(event) => {
          event.preventDefault();
          draft.apply();
        }}
      >
        <div class="relative">
          <SearchIcon
            class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            bind:value={draft.values.q}
            placeholder="Order number or email…"
            aria-label="Search orders"
            class="h-8 w-64 pl-8"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">Apply</Button>
        {#if query.isFiltered}
          <Button type="button" variant="ghost" size="sm" onclick={() => draft.clear()}>
            Clear
          </Button>
        {/if}
      </form>
    {/snippet}

    {#snippet table()}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Order</Table.Head>
            <Table.Head>Customer</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Payment</Table.Head>
            <Table.Head class="text-right">Items</Table.Head>
            <Table.Head>Placed</Table.Head>
            <Table.Head class="text-right">Total</Table.Head>
            <Table.Head class="w-10"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as order (order.id)}
            <Table.Row
              class="cursor-pointer"
              onclick={() => openDrawer(order.id)}
              aria-selected={openId === order.id}
            >
              <Table.Cell class="font-mono font-medium">{order.number}</Table.Cell>
              <Table.Cell class="text-muted-foreground">{order.email}</Table.Cell>
              <Table.Cell><StatusBadge status={order.status} dot /></Table.Cell>
              <Table.Cell><StatusBadge status={order.paymentStatus} kind="payment" /></Table.Cell>
              <Table.Cell class="text-right tabular-nums">{order.itemCount}</Table.Cell>
              <Table.Cell class="text-muted-foreground">
                <span title={formatDate(order.placedAt)}>{relativeTime(order.placedAt)}</span>
              </Table.Cell>
              <Table.Cell class="text-right font-medium tabular-nums">
                {formatMoney(order.total, order.currency)}
              </Table.Cell>
              <Table.Cell>
                <!-- A real link out of a row that is otherwise a drawer trigger,
                     so the order can still be opened in a new tab. -->
                <Button
                  href={routes.orderDetail(order.id)}
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Open {order.number} as a page"
                  onclick={(event) => event.stopPropagation()}
                >
                  <ExternalLinkIcon />
                </Button>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/snippet}

    {#snippet empty()}
      <Empty.Root class="border-0">
        <Empty.Header>
          <Empty.Media variant="icon"><InboxIcon /></Empty.Media>
          <Empty.Title>
            {query.isFiltered ? 'No orders match these filters' : 'No orders yet'}
          </Empty.Title>
          <Empty.Description>
            {query.isFiltered
              ? 'Try a different status, or clear the filters.'
              : 'Orders placed on the storefront land here.'}
          </Empty.Description>
        </Empty.Header>
        {#if query.isFiltered}
          <Empty.Content>
            <Button variant="outline" onclick={() => query.reset()}>Clear filters</Button>
          </Empty.Content>
        {/if}
      </Empty.Root>
    {/snippet}
  </ListCard>
</section>

<Sheet.Root
  open={openId !== null}
  onOpenChange={(open) => {
    if (!open) closeDrawer();
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
        <span class="font-mono">{detail.data?.number ?? 'Order'}</span>
        {#if detail.data}
          <StatusBadge status={detail.data.status} dot />
          <StatusBadge status={detail.data.paymentStatus} kind="payment" />
        {/if}
      </Sheet.Title>
      <Sheet.Description>
        {#if detail.data}
          Placed {formatDate(detail.data.placedAt)} ·
          <a href={routes.orderDetail(detail.data.id)} class="underline underline-offset-4">
            open as a page
          </a>
        {:else}
          Loading the order…
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
