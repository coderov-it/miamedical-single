<!--
  Disputed orders: someone followed the "I did not place this order" link in an
  order email and told us so.

  Read the row before touching the order. The reported number is the one to call —
  the number on the order itself may be the fraudster's, which is exactly why the
  form asks for it again.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
  import type { InferResponseType } from 'hono/client';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { api } from '~/lib/api';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { EM_DASH, formatMoney, relativeTime } from '~/lib/format';
  import { ApiError, unwrap, unwrapFull } from '~/lib/request';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type ListResponse = InferResponseType<(typeof api.api.admin)['order-disputes']['$get'], 200>;
  type Row = ListResponse['data'][number];
  type DisputeDetail = InferResponseType<
    (typeof api.api.admin)['order-disputes'][':id']['$get'],
    200
  >['data'];

  const STATUSES = [
    { value: 'open', label: 'Open' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'confirmed_fraud', label: 'Confirmed fraud' },
  ] as const;

  /** Open is the only state that means "somebody still has to do something". */
  const TONE: Record<string, 'destructive' | 'secondary' | 'outline'> = {
    open: 'destructive',
    contacted: 'secondary',
    resolved: 'outline',
    confirmed_fraud: 'destructive',
  };

  let rows = $state<Row[]>([]);
  let openCount = $state(0);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let meta = $state<
    { page: number; perPage: number; total: number; pageCount: number } | undefined
  >(undefined);

  let selectedId = $state<string | null>(null);
  let detail = $state<DisputeDetail | null>(null);
  let notes = $state('');
  let busy = $state(false);

  const canResolve = $derived(session.can(P.ORDER_DISPUTE_UPDATE));

  async function load() {
    loading = true;
    try {
      const payload = await unwrapFull<ListResponse>(
        await api.api.admin['order-disputes'].$get({ query: { page: '1', perPage: '50' } }),
      );
      rows = payload.data;
      openCount = payload.meta.openCount;
      meta = {
        page: payload.meta.page,
        perPage: payload.meta.perPage,
        total: payload.meta.total,
        pageCount: Math.max(1, Math.ceil(payload.meta.total / payload.meta.perPage)),
      };
    } catch (caught) {
      error = caught instanceof ApiError ? caught.message : 'Could not load disputes.';
    } finally {
      loading = false;
    }
  }

  async function open(id: string) {
    selectedId = id;
    detail = null;
    try {
      detail = await unwrap<DisputeDetail>(
        await api.api.admin['order-disputes'][':id'].$get({ param: { id } }),
      );
      notes = detail.adminNotes ?? '';
    } catch (caught) {
      error = caught instanceof ApiError ? caught.message : 'Could not load the dispute.';
    }
  }

  async function move(status: string) {
    if (!selectedId) return;
    busy = true;
    try {
      await unwrap<unknown>(
        await api.api.admin['order-disputes'][':id'].$patch({
          param: { id: selectedId },
          json: { status: status as 'open', adminNotes: notes },
        }),
      );
      await load();
      await open(selectedId);
    } catch (caught) {
      error = caught instanceof ApiError ? caught.message : 'Could not update the dispute.';
    } finally {
      busy = false;
    }
  }

  void load();
</script>

<PageHeader title="Disputed Orders">
  {#snippet actions()}
    {#if openCount > 0}
      <Badge variant="destructive">{openCount} open</Badge>
    {/if}
  {/snippet}
</PageHeader>

<ListCard
  noun="dispute"
  {meta}
  {loading}
  {error}
  isEmpty={rows.length === 0}
  onPage={() => load()}
  onRetry={() => load()}
  skeletonColumns={5}
>
  {#snippet table()}
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Order</Table.Head>
          <Table.Head>Order email</Table.Head>
          <Table.Head>Reported number</Table.Head>
          <Table.Head>Status</Table.Head>
          <Table.Head>Raised</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each rows as row (row.id)}
          <Table.Row
            class="cursor-pointer {selectedId === row.id ? 'bg-muted/50' : ''}"
            onclick={() => open(row.id)}
          >
            <Table.Cell class="font-medium">{row.orderNumber}</Table.Cell>
            <Table.Cell class="text-muted-foreground">{row.orderEmail}</Table.Cell>
            <Table.Cell class="font-mono text-xs">{row.reportedPhone}</Table.Cell>
            <Table.Cell>
              <Badge variant={TONE[row.status] ?? 'outline'}>
                {STATUSES.find((s) => s.value === row.status)?.label ?? row.status}
              </Badge>
            </Table.Cell>
            <Table.Cell class="text-muted-foreground">{relativeTime(row.createdAt)}</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  {/snippet}

  {#snippet empty()}
    <Empty.Root class="py-12">
      <Empty.Media variant="icon"><ShieldAlertIcon /></Empty.Media>
      <Empty.Title>No disputes</Empty.Title>
      <Empty.Description>Nobody has reported an order they did not place.</Empty.Description>
    </Empty.Root>
  {/snippet}
</ListCard>

{#if selectedId && detail}
  <Card.Root class="mt-5 py-0">
    <div class="space-y-4 p-5">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <h2 class="text-base font-medium">
          Order
          <a class="underline" href={routes.orders}>{detail.orderNumber}</a>
        </h2>
        <span class="tabular-nums">
          {formatMoney(String(detail.orderTotal), String(detail.orderCurrency))}
        </span>
      </div>

      <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-muted-foreground">Order email</dt>
          <dd>{detail.orderEmail}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground">Account on the order</dt>
          <dd>{detail.accountEmail ?? EM_DASH}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground">Phone on the order</dt>
          <dd class="font-mono text-xs">{detail.orderPhone ?? EM_DASH}</dd>
        </div>
        <div>
          <!-- The one to call. Spelled out because the two numbers differing is
               the whole signal here. -->
          <dt class="text-muted-foreground">Number the reporter gave</dt>
          <dd class="font-mono text-xs font-medium">{detail.reportedPhone}</dd>
        </div>
      </dl>

      <div>
        <p class="mb-1 text-sm text-muted-foreground">What they wrote</p>
        <p class="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-line">{detail.message}</p>
      </div>

      {#if canResolve}
        <div>
          <p class="mb-1 text-sm text-muted-foreground">Internal notes</p>
          <Textarea bind:value={notes} rows={3} placeholder="What happened on the call…" />
        </div>

        <div class="flex flex-wrap gap-2">
          {#each STATUSES as status (status.value)}
            <Button
              variant={detail.status === status.value ? 'default' : 'outline'}
              size="sm"
              disabled={busy}
              onclick={() => move(status.value)}
            >
              {status.label}
            </Button>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-muted-foreground">You can view disputes but not resolve them.</p>
      {/if}
    </div>
  </Card.Root>
{/if}
