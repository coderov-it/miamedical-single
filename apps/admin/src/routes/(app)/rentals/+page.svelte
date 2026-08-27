<script lang="ts">
  import { P } from '@mia/permissions';
  import BanknoteIcon from '@lucide/svelte/icons/banknote';
  import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import ClipboardIcon from '@lucide/svelte/icons/clipboard';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import FileSignatureIcon from '@lucide/svelte/icons/file-signature';
  import MailIcon from '@lucide/svelte/icons/mail';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import SearchIcon from '@lucide/svelte/icons/search';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { contractStatusMeta } from '~/lib/contracts/status';
  import { formatDate } from '~/lib/format';
  import { QueryDraft, QueryState } from '~/lib/query-state.svelte';
  import { RENTAL_STATUS_ORDER, rentalStatusMeta } from '~/lib/rentals/status';
  import { errorMessage, unwrap, unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type ListResponse = InferResponseType<typeof api.api.admin.rentals.$get, 200>;

  const ANY = '__any';

  const query = new QueryState({ q: '', status: ANY, page: 1 });
  const draft = new QueryDraft(query);

  const rentals = new Resource(
    () => query.current,
    async (current, signal) =>
      unwrapFull<ListResponse>(
        await api.api.admin.rentals.$get(
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
    { enabled: () => session.can(P.RENTAL_READ) },
  );

  const rows = $derived(rentals.data?.data ?? []);

  let acting = $state<string | null>(null);

  async function sendReminder(orderId: string, orderNumber: string) {
    acting = orderId;
    try {
      await unwrap(await api.api.admin.rentals[':id'].reminder.$post({ param: { id: orderId } }));
      toast.success(`Reminder sent for order ${orderNumber}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      acting = null;
    }
  }

  async function resendContract(orderId: string, orderNumber: string) {
    acting = orderId;
    try {
      await unwrap(await api.api.admin.rentals[':id'].contract.$post({ param: { id: orderId } }));
      toast.success(`Contract resent for order ${orderNumber}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      acting = null;
    }
  }

  async function finishRental(orderId: string, orderNumber: string) {
    acting = orderId;
    try {
      await unwrap(await api.api.admin.rentals[':id'].finish.$post({ param: { id: orderId } }));
      toast.success(`Rental ${orderNumber} marked as finished`);
      rentals.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      acting = null;
    }
  }

  async function copySigningLink(contractId: string) {
    try {
      const { url } = await unwrap<{ url: string }>(
        await api.api.admin.contracts[':id']['signing-link'].$post({
          param: { id: contractId },
        }),
      );
      await navigator.clipboard.writeText(url);
      toast.success('Signing link copied to clipboard');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  // --- renewal ---------------------------------------------------------------
  // Renewing is the one way to extend a rental, and it always issues a fresh
  // contract for the new period — the server refuses anything else.

  let renewDialogOpen = $state(false);
  let renewOrderId = $state('');
  let renewOrderNumber = $state('');
  let renewFrom = $state('');
  let renewTo = $state('');
  let renewTotal = $state('');
  let renewSubmitting = $state(false);

  function openRenewDialog(rental: (typeof rows)[number]) {
    renewOrderId = rental.orderId;
    renewOrderNumber = rental.orderNumber;
    // The natural renewal starts where the current period ends.
    renewFrom = rental.rentalEndDate ?? '';
    renewTo = '';
    renewTotal = '';
    renewDialogOpen = true;
  }

  async function submitRenew() {
    if (!renewFrom || !renewTo) return;
    renewSubmitting = true;
    try {
      await unwrap(
        await api.api.admin.rentals[':id'].renew.$post({
          param: { id: renewOrderId },
          json: {
            from: renewFrom,
            to: renewTo,
            ...(renewTotal.trim() ? { total: renewTotal.trim() } : {}),
          },
        }),
      );
      toast.success(
        `Rental ${renewOrderNumber} renewed — the new contract is out for signature.`,
      );
      renewDialogOpen = false;
      rentals.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      renewSubmitting = false;
    }
  }

  function sendPaymentLink(_orderId: string, orderNumber: string) {
    toast.info(`Payment link for ${orderNumber} — coming soon`);
  }

  function copyPaymentLink(_orderId: string, orderNumber: string) {
    toast.info(`Payment link for ${orderNumber} — coming soon`);
  }

</script>

<section class="admin-page">
  <PageHeader eyebrow="Sales" title="Rent Management" />

  <div class="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
    {#each [ANY, ...RENTAL_STATUS_ORDER] as value (value)}
      {@const active = query.current.status === value}
      <button
        type="button"
        onclick={() => query.set({ status: value, page: 1 })}
        aria-pressed={active}
        class={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
          active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
        )}
      >
        {#if value !== ANY}
          <span class={cn('size-1.5 rounded-full', rentalStatusMeta(value).dot)}></span>
        {/if}
        {value === ANY ? 'All' : rentalStatusMeta(value).label}
      </button>
    {/each}
  </div>

  <ListCard
    noun="rental"
    meta={rentals.data?.meta}
    loading={rentals.loading}
    error={rentals.error}
    isEmpty={rows.length === 0}
    onPage={(next) => query.set({ page: next })}
    onRetry={() => rentals.refresh()}
    skeletonColumns={8}
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
            placeholder="Order, name, email…"
            aria-label="Search rentals"
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
            <Table.Head>Product</Table.Head>
            <Table.Head>Period</Table.Head>
            <Table.Head>Due date</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Contract</Table.Head>
            <Table.Head class="w-10"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <!-- Keyed on the line, not the order: an order renting two products
               is two rows here, and duplicate keys crash a keyed each. -->
          {#each rows as rental (rental.orderItemId)}
            {@const meta = rentalStatusMeta(rental.status)}
            <Table.Row>
              <Table.Cell>
                <a
                  href={routes.orderDetail(rental.orderId)}
                  class="font-mono font-medium hover:underline"
                >
                  {rental.orderNumber}
                </a>
              </Table.Cell>
              <Table.Cell>
                <div class="min-w-0">
                  <p class="truncate font-medium">{rental.customerName || '—'}</p>
                  <p class="truncate text-xs text-muted-foreground">{rental.email}</p>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span class="max-w-48 truncate" title={rental.productTitle}>
                  {rental.productTitle}
                </span>
              </Table.Cell>
              <Table.Cell class="text-muted-foreground whitespace-nowrap">
                {formatDate(rental.rentalStartDate)} – {formatDate(rental.rentalEndDate)}
              </Table.Cell>
              <Table.Cell>
                <!-- The server already decided overdue-ness; re-deriving it here
                     from the raw date would be a second copy of the rule. -->
                <span
                  class={cn(
                    'whitespace-nowrap font-medium',
                    rental.status === 'overdue'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-muted-foreground',
                  )}
                >
                  {formatDate(rental.rentalEndDate)}
                </span>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="outline" class={meta.tone}>
                  <span class={cn('size-1.5 rounded-full', meta.dot)}></span>
                  {meta.label}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                {#if rental.contractId}
                  {@const cMeta = contractStatusMeta(rental.contractStatus ?? '')}
                  <a
                    href={routes.contractDetail(rental.contractId)}
                    class="inline-flex"
                    onclick={(e) => e.stopPropagation()}
                  >
                    <Badge variant="outline" class={cMeta.tone}>
                      <span class={cn('size-1.5 rounded-full', cMeta.dot)}></span>
                      {cMeta.label}
                    </Badge>
                  </a>
                  {#if rental.contractStatus !== 'signed'}
                    <p class="mt-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Not signed
                    </p>
                  {/if}
                {:else}
                  <span class="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Not signed
                  </span>
                {/if}
              </Table.Cell>
              <Table.Cell>
                {#if session.can(P.RENTAL_UPDATE) && rental.status !== 'completed'}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger
                      class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                      aria-label="Row actions"
                      disabled={acting === rental.orderId}
                    >
                      <EllipsisVerticalIcon class="size-4" />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item onSelect={() => openRenewDialog(rental)}>
                        <RefreshCwIcon class="size-4" />
                        Renew rental
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        onSelect={() => sendReminder(rental.orderId, rental.orderNumber)}
                      >
                        <MailIcon class="size-4" />
                        Send reminder
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onSelect={() => sendPaymentLink(rental.orderId, rental.orderNumber)}
                      >
                        <BanknoteIcon class="size-4" />
                        Send payment link
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onSelect={() => copyPaymentLink(rental.orderId, rental.orderNumber)}
                      >
                        <ClipboardIcon class="size-4" />
                        Copy payment link
                      </DropdownMenu.Item>
                      {#if rental.contractId}
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item
                          onSelect={() => resendContract(rental.orderId, rental.orderNumber)}
                        >
                          <FileSignatureIcon class="size-4" />
                          Resend contract
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() => copySigningLink(rental.contractId!)}
                        >
                          <ClipboardIcon class="size-4" />
                          Copy signing link
                        </DropdownMenu.Item>
                      {/if}
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        onSelect={() => finishRental(rental.orderId, rental.orderNumber)}
                      >
                        <CheckCircleIcon class="size-4" />
                        Finish rental
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
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
          <Empty.Media variant="icon"><CalendarClockIcon /></Empty.Media>
          <Empty.Title>
            {query.isFiltered ? 'No rentals match these filters' : 'No active rentals'}
          </Empty.Title>
          <Empty.Description>
            {query.isFiltered
              ? 'Try a different status, or clear the filters.'
              : 'Rentals appear here when orders with rental items are placed.'}
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

  <Dialog.Root bind:open={renewDialogOpen}>
    <Dialog.Content class="sm:max-w-md">
      <Dialog.Header>
        <Dialog.Title>Renew rental</Dialog.Title>
        <Dialog.Description>
          Set the renewed period for order {renewOrderNumber}. A new contract for exactly this
          period is generated, stored on the order, and emailed to the customer for signature.
        </Dialog.Description>
      </Dialog.Header>
      <form
        class="grid gap-4 py-2"
        onsubmit={(e) => {
          e.preventDefault();
          submitRenew();
        }}
      >
        <div class="grid gap-1.5">
          <label for="renew-from" class="text-sm font-medium">From</label>
          <Input id="renew-from" type="date" bind:value={renewFrom} required />
        </div>
        <div class="grid gap-1.5">
          <label for="renew-to" class="text-sm font-medium">To</label>
          <Input id="renew-to" type="date" bind:value={renewTo} required />
        </div>
        <div class="grid gap-1.5">
          <label for="renew-total" class="text-sm font-medium">
            Renewal price <span class="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="renew-total"
            inputmode="decimal"
            placeholder="e.g. 250.00"
            bind:value={renewTotal}
          />
          <p class="text-xs text-muted-foreground">
            Left empty, the contract quotes the rental's current amount.
          </p>
        </div>
        <Dialog.Footer>
          <Button type="button" variant="outline" onclick={() => (renewDialogOpen = false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!renewFrom || !renewTo || renewSubmitting}>
            {renewSubmitting ? 'Sending…' : 'Renew & send contract'}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog.Content>
  </Dialog.Root>
</section>
