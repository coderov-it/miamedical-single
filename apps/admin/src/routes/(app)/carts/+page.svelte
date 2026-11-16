<!--
  Carts, read-only. A cart is a pre-order, so it reuses ORDER_READ rather than
  minting a permission of its own — and there is nothing here to authorise
  beyond looking.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
  import SearchIcon from '@lucide/svelte/icons/search';
  import type { InferResponseType } from 'hono/client';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { EM_DASH, formatMoney, relativeTime } from '~/lib/format';
  import { QueryDraft, QueryState } from '~/lib/query-state.svelte';
  import { unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import { type MessageKey, t, tn } from '~/lib/ui-text';

  type ListResponse = InferResponseType<typeof api.api.admin.carts.$get, 200>;

  const ANY = '__any';

  const STATES: readonly { value: string; labelKey: MessageKey }[] = [
    { value: ANY, labelKey: 'carts.filterAll' },
    { value: 'active', labelKey: 'carts.stateActive' },
    { value: 'abandoned', labelKey: 'carts.stateAbandoned' },
  ];

  const query = new QueryState({ q: '', state: ANY, page: 1 });
  const draft = new QueryDraft(query);

  const carts = new Resource(
    () => query.current,
    async (current, signal) =>
      unwrapFull<ListResponse>(
        await api.api.admin.carts.$get(
          {
            query: {
              page: String(current.page),
              ...(current.q ? { q: current.q } : {}),
              ...(current.state !== ANY ? { state: current.state } : {}),
            },
          },
          { init: { signal } },
        ),
      ),
    { enabled: () => session.can(P.ORDER_READ) },
  );

  const rows = $derived(carts.data?.data ?? []);
</script>

<section class="admin-page">
  <PageHeader
    eyebrow={t('nav.sales')}
    title={t('nav.carts')}
    description={t('carts.description')}
  />

  <div class="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
    {#each STATES as option (option.value)}
      {@const active = query.current.state === option.value}
      <button
        type="button"
        onclick={() => query.set({ state: option.value })}
        aria-pressed={active}
        class={cn(
          'rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
          active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
        )}
      >
        {t(option.labelKey)}
      </button>
    {/each}
  </div>

  <ListCard
    countKey="entities.cart"
    meta={carts.data?.meta}
    loading={carts.loading}
    error={carts.error}
    isEmpty={rows.length === 0}
    onPage={(next) => query.set({ page: next })}
    onRetry={() => carts.refresh()}
    skeletonColumns={5}
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
            placeholder={t('carts.searchPlaceholder')}
            aria-label={t('carts.searchLabel')}
            class="h-8 w-56 pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">{t('carts.apply')}</Button>
        {#if query.isFiltered}
          <Button type="button" variant="ghost" onclick={() => draft.clear()}>
            {t('carts.clear')}
          </Button>
        {/if}
      </form>
    {/snippet}

    {#snippet table()}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{t('carts.colCart')}</Table.Head>
            <Table.Head>{t('carts.colCustomer')}</Table.Head>
            <Table.Head class="text-right">{t('carts.colItems')}</Table.Head>
            <Table.Head>{t('carts.colState')}</Table.Head>
            <Table.Head>{t('carts.colLastTouched')}</Table.Head>
            <Table.Head>{t('carts.colAge')}</Table.Head>
            <Table.Head class="text-right">{t('carts.colValue')}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as cart (cart.id)}
            <Table.Row>
              <Table.Cell class="font-mono text-xs">{cart.token}</Table.Cell>
              <Table.Cell class="text-muted-foreground">
                {cart.customerEmail ?? t('carts.guest')}
              </Table.Cell>
              <Table.Cell class="text-right tabular-nums">{cart.itemCount}</Table.Cell>
              <Table.Cell>
                {#if cart.isAbandoned}
                  <Badge variant="outline" class="border-border text-muted-foreground">
                    {t('carts.stateAbandoned')}
                  </Badge>
                {:else}
                  <Badge
                    variant="outline"
                    class="border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  >
                    {t('carts.stateActive')}
                  </Badge>
                {/if}
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">{relativeTime(cart.updatedAt)}</Table.Cell>
              <Table.Cell class="text-muted-foreground">{relativeTime(cart.createdAt)}</Table.Cell>
              <Table.Cell class="text-right tabular-nums">
                {cart.itemCount === 0 ? EM_DASH : formatMoney(cart.subtotal, cart.currency)}
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/snippet}

    {#snippet empty()}
      <Empty.Root class="border-0">
        <Empty.Header>
          <Empty.Media variant="icon"><ShoppingCartIcon /></Empty.Media>
          <Empty.Title>
            {query.isFiltered ? t('carts.emptyFiltered') : t('carts.emptyNone')}
          </Empty.Title>
          <Empty.Description>
            {query.isFiltered ? t('carts.emptyFilteredHint') : t('carts.emptyNoneHint')}
          </Empty.Description>
        </Empty.Header>
      </Empty.Root>
    {/snippet}
  </ListCard>

  {#if rows.length > 0}
    <p class="text-xs text-muted-foreground">
      {tn('carts.footnote', rows.length)}
    </p>
  {/if}
</section>
