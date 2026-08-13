<script lang="ts">
  import { P } from '@mia/permissions';
  import FileSignatureIcon from '@lucide/svelte/icons/file-signature';
  import PlusIcon from '@lucide/svelte/icons/plus';
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
  import {
    CONTRACT_STATUS_ORDER,
    contractStatusMeta,
    variantLabel,
  } from '~/lib/contracts/status';
  import { formatDate, relativeTime } from '~/lib/format';
  import { QueryDraft, QueryState } from '~/lib/query-state.svelte';
  import { unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type ListResponse = InferResponseType<typeof api.api.admin.contracts.$get, 200>;

  const ANY = '__any';

  const query = new QueryState({ q: '', status: ANY, page: 1 });
  const draft = new QueryDraft(query);

  const contracts = new Resource(
    () => query.current,
    async (current, signal) =>
      unwrapFull<ListResponse>(
        await api.api.admin.contracts.$get(
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
    { enabled: () => session.can(P.CONTRACT_READ) },
  );

  const rows = $derived(contracts.data?.data ?? []);
</script>

<section class="admin-page">
  <PageHeader
    eyebrow="Sales"
    title="Contracts"
    description="Rental contracts generated from orders or created by hand. Track signing status and resend links."
  >
    {#snippet actions()}
      {#if session.can(P.CONTRACT_CREATE)}
        <Button href={routes.contractNew}>
          <PlusIcon />
          New contract
        </Button>
      {/if}
    {/snippet}
  </PageHeader>

  <div class="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
    {#each [ANY, ...CONTRACT_STATUS_ORDER] as value (value)}
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
          <span class={cn('size-1.5 rounded-full', contractStatusMeta(value).dot)}></span>
        {/if}
        {value === ANY ? 'All' : contractStatusMeta(value).label}
      </button>
    {/each}
  </div>

  <ListCard
    noun="contract"
    meta={contracts.data?.meta}
    loading={contracts.loading}
    error={contracts.error}
    isEmpty={rows.length === 0}
    onPage={(next) => query.set({ page: next })}
    onRetry={() => contracts.refresh()}
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
            placeholder="Contract, order, name, email, phone…"
            aria-label="Search contracts"
            class="h-8 w-72 pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">Apply</Button>
        {#if query.isFiltered}
          <Button type="button" variant="ghost" onclick={() => draft.clear()}>Clear</Button>
        {/if}
      </form>
    {/snippet}

    {#snippet table()}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Contract</Table.Head>
            <Table.Head>Customer</Table.Head>
            <Table.Head>Order</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Variant</Table.Head>
            <Table.Head>Sent</Table.Head>
            <Table.Head>Signed</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as contract (contract.id)}
            {@const meta = contractStatusMeta(contract.status)}
            <Table.Row
              class="cursor-pointer"
              onclick={() => window.location.assign(routes.contractDetail(contract.id))}
            >
              <Table.Cell class="font-mono font-medium">{contract.number}</Table.Cell>
              <Table.Cell>
                {#if contract.customerName || contract.customerEmail}
                  <div class="min-w-0">
                    <p class="truncate font-medium">{contract.customerName ?? '—'}</p>
                    {#if contract.customerEmail}
                      <p class="truncate text-xs text-muted-foreground">{contract.customerEmail}</p>
                    {/if}
                  </div>
                {:else}
                  <span class="text-muted-foreground">—</span>
                {/if}
              </Table.Cell>
              <Table.Cell>
                {#if contract.orderId}
                  <a
                    href={routes.orderDetail(contract.orderId)}
                    class="font-mono text-muted-foreground hover:underline"
                    onclick={(event) => event.stopPropagation()}
                  >
                    {contract.orderNumber}
                  </a>
                {:else}
                  <span class="text-muted-foreground">Manual</span>
                {/if}
              </Table.Cell>
              <Table.Cell>
                <Badge variant="outline" class={meta.tone}>
                  <span class={cn('size-1.5 rounded-full', meta.dot)}></span>
                  {meta.label}
                </Badge>
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">
                {variantLabel(contract.variant)}
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">
                {#if contract.sentAt}
                  <span title={formatDate(contract.sentAt)}>{relativeTime(contract.sentAt)}</span>
                {:else}
                  —
                {/if}
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">
                {#if contract.signedAt}
                  <span title={formatDate(contract.signedAt)}>
                    {relativeTime(contract.signedAt)}
                  </span>
                {:else}
                  —
                {/if}
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/snippet}

    {#snippet empty()}
      <Empty.Root class="border-0">
        <Empty.Header>
          <Empty.Media variant="icon"><FileSignatureIcon /></Empty.Media>
          <Empty.Title>
            {query.isFiltered ? 'No contracts match these filters' : 'No contracts yet'}
          </Empty.Title>
          <Empty.Description>
            {query.isFiltered
              ? 'Try a different status, or clear the filters.'
              : 'Contracts are generated automatically when orders are placed.'}
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
