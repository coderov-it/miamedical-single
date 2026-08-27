<script lang="ts">
  import { P } from '@mia/permissions';
  import BanknoteIcon from '@lucide/svelte/icons/banknote';
  import ClipboardIcon from '@lucide/svelte/icons/clipboard';
  import CreditCardIcon from '@lucide/svelte/icons/credit-card';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import SearchIcon from '@lucide/svelte/icons/search';
  import WalletIcon from '@lucide/svelte/icons/wallet';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { cn } from '$lib/utils.js';
  import { api, API_BASE } from '~/lib/api';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { formatDate, formatMoney, formatNumber } from '~/lib/format';
  import { orderStatusMeta, paymentStatusMeta } from '~/lib/orders/status';
  import { datePresets, PAYMENT_STATUS_ORDER } from '~/lib/payments/status';
  import { QueryDraft, QueryState } from '~/lib/query-state.svelte';
  import { errorMessage, unwrap, unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type ListResponse = InferResponseType<typeof api.api.admin.payments.$get, 200>;

  const ANY = '__any';
  const TYPE_OPTIONS = [
    { value: ANY, label: 'All' },
    { value: 'rental', label: 'Noleggio' },
    { value: 'fixed', label: 'Vendita' },
  ] as const;

  const presets = datePresets();

  const query = new QueryState({
    q: '',
    paymentStatus: ANY,
    type: ANY,
    from: '',
    to: '',
    page: 1,
  });
  const draft = new QueryDraft(query);

  const payments = new Resource(
    () => query.current,
    async (current, signal) =>
      unwrapFull<ListResponse>(
        await api.api.admin.payments.$get(
          {
            query: {
              page: String(current.page),
              ...(current.q ? { q: current.q } : {}),
              ...(current.paymentStatus !== ANY ? { paymentStatus: current.paymentStatus } : {}),
              ...(current.type !== ANY ? { type: current.type } : {}),
              ...(current.from ? { from: current.from } : {}),
              ...(current.to ? { to: current.to } : {}),
            },
          },
          { init: { signal } },
        ),
      ),
    { enabled: () => session.can(P.PAYMENT_READ) },
  );

  const rows = $derived(payments.data?.data ?? []);
  const stats = $derived(payments.data?.stats);

  let exporting = $state(false);

  async function exportCsv() {
    exporting = true;
    try {
      const current = query.current;
      const params = new URLSearchParams();
      if (current.q) params.set('q', current.q);
      if (current.paymentStatus !== ANY) params.set('paymentStatus', current.paymentStatus);
      if (current.type !== ANY) params.set('type', current.type);
      if (current.from) params.set('from', current.from);
      if (current.to) params.set('to', current.to);

      const response = await fetch(`${API_BASE}/api/admin/payments/export?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      exporting = false;
    }
  }

  function sendPaymentLink(_orderId: string, orderNumber: string) {
    toast.info(`Payment link for ${orderNumber} — coming soon`);
  }

  function copyPaymentLink(_orderId: string, orderNumber: string) {
    toast.info(`Payment link for ${orderNumber} — coming soon`);
  }

  async function markAsPaid(orderId: string, orderNumber: string) {
    try {
      await unwrap(
        await api.api.admin.orders[':id'].payment.$post({
          param: { id: orderId },
          json: { to: 'paid' },
        }),
      );
      toast.success(`Order ${orderNumber} marked as paid`);
      payments.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }
</script>

<section class="admin-page">
  <PageHeader eyebrow="Finance" title="Payments">
    {#snippet actions()}
      <Button variant="outline" onclick={exportCsv} disabled={exporting}>
        <DownloadIcon class="size-4" />
        {exporting ? 'Exporting…' : 'Export CSV'}
      </Button>
    {/snippet}
  </PageHeader>

  {#if stats}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="rounded-lg border bg-card p-4">
        <p class="text-sm text-muted-foreground">Total revenue (paid)</p>
        <p class="text-2xl font-semibold">{formatMoney(stats.totalRevenue, stats.currency)}</p>
      </div>
      <div class="rounded-lg border bg-card p-4">
        <p class="text-sm text-muted-foreground">Pending payments</p>
        <p class="text-2xl font-semibold">{formatNumber(stats.pendingCount)}</p>
      </div>
      <div class="rounded-lg border bg-card p-4">
        <p class="text-sm text-muted-foreground">Paid orders</p>
        <p class="text-2xl font-semibold">{formatNumber(stats.paidCount)}</p>
      </div>
    </div>
  {/if}

  <!-- Date presets -->
  <div class="flex flex-wrap items-center gap-2">
    {#each presets as preset (preset.label)}
      {@const active = query.current.from === preset.from && query.current.to === preset.to}
      <Button
        variant={active ? 'default' : 'outline'}
        size="sm"
        onclick={() => query.set({ from: preset.from, to: preset.to, page: 1 })}
      >
        {preset.label}
      </Button>
    {/each}
    <div class="flex items-center gap-1.5">
      <Input
        type="date"
        value={query.current.from}
        onchange={(e) => query.set({ from: e.currentTarget.value, page: 1 })}
        class="h-8 w-36"
        aria-label="From date"
      />
      <span class="text-muted-foreground">–</span>
      <Input
        type="date"
        value={query.current.to}
        onchange={(e) => query.set({ to: e.currentTarget.value, page: 1 })}
        class="h-8 w-36"
        aria-label="To date"
      />
    </div>
    {#if query.current.from || query.current.to}
      <Button variant="ghost" size="sm" onclick={() => query.set({ from: '', to: '', page: 1 })}>
        Clear dates
      </Button>
    {/if}
  </div>

  <!-- Payment status bar -->
  <div class="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
    {#each [ANY, ...PAYMENT_STATUS_ORDER] as value (value)}
      {@const active = query.current.paymentStatus === value}
      <button
        type="button"
        onclick={() => query.set({ paymentStatus: value, page: 1 })}
        aria-pressed={active}
        class={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
          active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
        )}
      >
        {#if value !== ANY}
          <span class={cn('size-1.5 rounded-full', paymentStatusMeta(value).dot)}></span>
        {/if}
        {value === ANY ? 'All' : paymentStatusMeta(value).label}
      </button>
    {/each}
  </div>

  <!-- Type bar -->
  <div class="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
    {#each TYPE_OPTIONS as opt (opt.value)}
      {@const active = query.current.type === opt.value}
      <button
        type="button"
        onclick={() => query.set({ type: opt.value, page: 1 })}
        aria-pressed={active}
        class={cn(
          'rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
          active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
        )}
      >
        {opt.label}
      </button>
    {/each}
  </div>

  <ListCard
    noun="payment"
    meta={payments.data?.meta}
    loading={payments.loading}
    error={payments.error}
    isEmpty={rows.length === 0}
    onPage={(next) => query.set({ page: next })}
    onRetry={() => payments.refresh()}
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
            placeholder="Order number or email…"
            aria-label="Search payments"
            class="h-8 w-64 pl-8"
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
            <Table.Head>Order</Table.Head>
            <Table.Head>Customer</Table.Head>
            <Table.Head>Type</Table.Head>
            <Table.Head>Amount</Table.Head>
            <Table.Head>Payment</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Date</Table.Head>
            <Table.Head class="w-10"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as payment (payment.orderId)}
            {@const pMeta = paymentStatusMeta(payment.paymentStatus)}
            {@const oMeta = orderStatusMeta(payment.orderStatus)}
            <Table.Row>
              <Table.Cell>
                <a
                  href={routes.orderDetail(payment.orderId)}
                  class="font-mono font-medium hover:underline"
                >
                  {payment.orderNumber}
                </a>
              </Table.Cell>
              <Table.Cell>
                <div class="min-w-0">
                  <p class="truncate font-medium">{payment.customerName || '—'}</p>
                  <p class="truncate text-xs text-muted-foreground">{payment.email}</p>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {payment.type === 'rental' ? 'Noleggio' : 'Vendita'}
                </span>
              </Table.Cell>
              <Table.Cell class="font-medium">
                {formatMoney(payment.total, payment.currency)}
              </Table.Cell>
              <Table.Cell>
                <Badge variant="outline" class={pMeta.tone}>
                  <span class={cn('size-1.5 rounded-full', pMeta.dot)}></span>
                  {pMeta.label}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="outline" class={oMeta.tone}>
                  <span class={cn('size-1.5 rounded-full', oMeta.dot)}></span>
                  {oMeta.label}
                </Badge>
              </Table.Cell>
              <Table.Cell class="whitespace-nowrap text-muted-foreground">
                {formatDate(payment.placedAt)}
              </Table.Cell>
              <Table.Cell>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                    aria-label="Row actions"
                  >
                    <EllipsisVerticalIcon class="size-4" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">
                    <DropdownMenu.Item
                      onSelect={() =>
                        window.location.assign(routes.orderDetail(payment.orderId))}
                    >
                      <ExternalLinkIcon class="size-4" />
                      View order
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={() =>
                        sendPaymentLink(payment.orderId, payment.orderNumber)}
                    >
                      <CreditCardIcon class="size-4" />
                      Send payment link
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={() =>
                        copyPaymentLink(payment.orderId, payment.orderNumber)}
                    >
                      <ClipboardIcon class="size-4" />
                      Copy payment link
                    </DropdownMenu.Item>
                    {#if payment.paymentStatus !== 'paid' && payment.paymentStatus !== 'refunded' && session.can(P.ORDER_UPDATE)}
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        onSelect={() => markAsPaid(payment.orderId, payment.orderNumber)}
                      >
                        <BanknoteIcon class="size-4" />
                        Mark as paid
                      </DropdownMenu.Item>
                    {/if}
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/snippet}

    {#snippet empty()}
      <Empty.Root class="border-0">
        <Empty.Header>
          <Empty.Media variant="icon"><WalletIcon /></Empty.Media>
          <Empty.Title>
            {query.isFiltered ? 'No payments match these filters' : 'No payments yet'}
          </Empty.Title>
          <Empty.Description>
            {query.isFiltered
              ? 'Try different filters, or clear them.'
              : 'Payments appear here when orders are placed.'}
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
