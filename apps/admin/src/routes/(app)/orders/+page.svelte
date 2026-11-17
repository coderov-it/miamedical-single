<script lang="ts">
  import { P } from '@mia/permissions';
  import InboxIcon from '@lucide/svelte/icons/inbox';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import SearchIcon from '@lucide/svelte/icons/search';
  import type { InferResponseType } from 'hono/client';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import OrderDrawer from '~/lib/orders/list/order-drawer.svelte';
  import OrdersKpiStrip from '~/lib/orders/list/orders-kpi-strip.svelte';
  import OrdersTable from '~/lib/orders/list/orders-table.svelte';
  import { ORDER_STATUS_ORDER, orderStatusMeta } from '~/lib/orders/status';
  import { QueryDraft, QueryState } from '~/lib/query-state.svelte';
  import { unwrap, unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';
  import { type MessageKey, t } from '~/lib/ui-text';

  type ListResponse = InferResponseType<typeof api.api.admin.orders.$get, 200>;
  type OrderDetail = InferResponseType<(typeof api.api.admin.orders)[':id']['$get'], 200>['data'];

  const ANY = '__any';

  const TYPE_OPTIONS: readonly { value: string; labelKey: MessageKey }[] = [
    { value: ANY, labelKey: 'orders.filterAll' },
    { value: 'rental', labelKey: 'orders.typeRental' },
    { value: 'fixed', labelKey: 'orders.typeSale' },
  ];

  const query = new QueryState({ q: '', status: ANY, type: ANY, page: 1 });
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
              ...(current.type !== ANY ? { type: current.type } : {}),
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
    eyebrow={t('nav.sales')}
    title={t('nav.orders')}
    description={t('orders.description')}
  >
    {#snippet actions()}
      <!-- Stays clickable while a fetch is in flight: a second click supersedes
           the first, and a control that vanishes mid-load reads as broken. -->
      <Button variant="outline" onclick={() => orders.refresh()}>
        <RefreshCwIcon class={cn(orders.loading && 'animate-spin')} />
        {t('orders.refresh')}
      </Button>
      {#if session.can(P.ORDER_CREATE)}
        <Button href={routes.orderNew}>
          <PlusIcon />
          {t('newOrder.newOrder')}
        </Button>
      {/if}
    {/snippet}
  </PageHeader>

  <OrdersKpiStrip
    total={orders.data?.meta.total}
    awaitingCount={stats?.awaitingCount}
    pageValue={stats ? { amount: stats.pageValue, currency: stats.currency } : undefined}
    rowCount={orders.data ? rows.length : undefined}
  />

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
        {value === ANY ? t('orders.filterAll') : orderStatusMeta(value).label}
      </button>
    {/each}
  </div>

  <div class="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
    {#each TYPE_OPTIONS as opt (opt.value)}
      {@const active = query.current.type === opt.value}
      <button
        type="button"
        onclick={() => query.set({ type: opt.value })}
        aria-pressed={active}
        class={cn(
          'rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
          active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
        )}
      >
        {t(opt.labelKey)}
      </button>
    {/each}
  </div>

  <ListCard
    countKey="entities.order"
    meta={orders.data?.meta}
    loading={orders.loading}
    error={orders.error}
    isEmpty={rows.length === 0}
    onPage={(next) => query.set({ page: next })}
    onRetry={() => orders.refresh()}
    skeletonColumns={7}
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
            placeholder={t('orders.searchPlaceholder')}
            aria-label={t('orders.searchLabel')}
            class="h-8 w-64 pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">{t('orders.apply')}</Button>
        {#if query.isFiltered}
          <Button type="button" variant="ghost" onclick={() => draft.clear()}>
            {t('orders.clear')}
          </Button>
        {/if}
      </form>
    {/snippet}

    {#snippet table()}
      <OrdersTable {rows} {openId} onOpen={openDrawer} />
    {/snippet}

    {#snippet empty()}
      <Empty.Root class="border-0">
        <Empty.Header>
          <Empty.Media variant="icon"><InboxIcon /></Empty.Media>
          <Empty.Title>
            {query.isFiltered ? t('orders.emptyFiltered') : t('orders.emptyNone')}
          </Empty.Title>
          <Empty.Description>
            {query.isFiltered ? t('orders.emptyFilteredHint') : t('orders.emptyNoneHint')}
          </Empty.Description>
        </Empty.Header>
        {#if query.isFiltered}
          <Empty.Content>
            <Button variant="outline" onclick={() => query.reset()}>
              {t('orders.clearFilters')}
            </Button>
          </Empty.Content>
        {/if}
      </Empty.Root>
    {/snippet}
  </ListCard>
</section>

<OrderDrawer {openId} {detail} onClose={closeDrawer} {onUpdated} />
