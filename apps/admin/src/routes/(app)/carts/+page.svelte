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
  import { EM_DASH, formatMoney, pluralize, relativeTime } from '~/lib/format';
  import { QueryDraft, QueryState } from '~/lib/query-state.svelte';
  import { unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';

  type ListResponse = InferResponseType<typeof api.api.admin.carts.$get, 200>;

  const ANY = '__any';

  const STATES = [
    { value: ANY, label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'abandoned', label: 'Abandoned' },
  ] as const;

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
    eyebrow="Sales"
    title="Carts"
    description="What is sitting in baskets right now, and what has been left behind."
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
        {option.label}
      </button>
    {/each}
  </div>

  <ListCard
    noun="cart"
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
            placeholder="Cart token…"
            aria-label="Search carts"
            class="h-8 w-56 pl-8"
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
            <Table.Head>Cart</Table.Head>
            <Table.Head>Customer</Table.Head>
            <Table.Head class="text-right">Items</Table.Head>
            <Table.Head>State</Table.Head>
            <Table.Head>Last touched</Table.Head>
            <Table.Head>Age</Table.Head>
            <Table.Head class="text-right">Value</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as cart (cart.id)}
            <Table.Row>
              <Table.Cell class="font-mono text-xs">{cart.token}</Table.Cell>
              <Table.Cell class="text-muted-foreground">
                {cart.userEmail ?? 'Guest'}
              </Table.Cell>
              <Table.Cell class="text-right tabular-nums">{cart.itemCount}</Table.Cell>
              <Table.Cell>
                {#if cart.isAbandoned}
                  <Badge variant="outline" class="border-border text-muted-foreground">
                    Abandoned
                  </Badge>
                {:else}
                  <Badge variant="outline" class="border-emerald-500/40 text-emerald-600">
                    Active
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
            {query.isFiltered ? 'No carts match these filters' : 'No carts yet'}
          </Empty.Title>
          <Empty.Description>
            {query.isFiltered
              ? 'Try a different state, or clear the filters.'
              : 'Carts appear as soon as someone adds a product on the storefront.'}
          </Empty.Description>
        </Empty.Header>
      </Empty.Root>
    {/snippet}
  </ListCard>

  {#if rows.length > 0}
    <p class="text-xs text-muted-foreground">
      Showing {pluralize(rows.length, 'cart')}. Carts are read-only here — they belong to the
      shopper until checkout turns one into an order.
    </p>
  {/if}
</section>
