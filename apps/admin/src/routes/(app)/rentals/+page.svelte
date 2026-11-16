<script lang="ts">
  import { P } from '@mia/permissions';
  import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
  import CalendarPlusIcon from '@lucide/svelte/icons/calendar-plus';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import ClipboardIcon from '@lucide/svelte/icons/clipboard';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import FileSignatureIcon from '@lucide/svelte/icons/file-signature';
  import MailIcon from '@lucide/svelte/icons/mail';
  import SearchIcon from '@lucide/svelte/icons/search';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { goto } from '$app/navigation';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
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
  import ExtendDialog from '~/lib/rentals/extend-dialog.svelte';
  import { extensionStatusMeta } from '~/lib/rentals/extension-status';
  import { RENTAL_STATUS_ORDER, rentalStatusMeta } from '~/lib/rentals/status';
  import { errorMessage, unwrap, unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';

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
      toast.success(t('rentals.toastReminderSent', { number: orderNumber }));
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
      toast.success(t('rentals.toastContractResent', { number: orderNumber }));
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
      toast.success(t('rentals.toastReturnConfirmed', { number: orderNumber }));
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
      toast.success(t('rentals.toastLinkCopied'));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  // --- extension -------------------------------------------------------------
  // Opens an extension waiting for payment; the order page carries it from
  // there (record payment → contract → signed). See docs/code/rental-extensions.md.

  let extendTarget = $state<{ orderId: string; orderNumber: string } | undefined>(undefined);
</script>

<section class="admin-page">
  <PageHeader eyebrow={t('rentals.eyebrowSales')} title={t('rentals.title')} />

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
        {value === ANY ? t('rentals.filterAll') : rentalStatusMeta(value).label}
      </button>
    {/each}
  </div>

  <ListCard
    countKey="entities.rental"
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
            placeholder={t('rentals.searchPlaceholder')}
            aria-label={t('rentals.searchLabel')}
            class="h-8 w-64 pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">{t('rentals.apply')}</Button>
        {#if query.isFiltered}
          <Button type="button" variant="ghost" onclick={() => draft.clear()}>
            {t('rentals.clear')}
          </Button>
        {/if}
      </form>
    {/snippet}

    {#snippet table()}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{t('rentals.colOrder')}</Table.Head>
            <Table.Head>{t('rentals.colCustomer')}</Table.Head>
            <Table.Head>{t('rentals.colProduct')}</Table.Head>
            <Table.Head>{t('rentals.colPeriod')}</Table.Head>
            <Table.Head>{t('rentals.colDueDate')}</Table.Head>
            <Table.Head>{t('rentals.colStatus')}</Table.Head>
            <Table.Head>{t('rentals.colContract')}</Table.Head>
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
              <Table.Cell class="whitespace-nowrap text-muted-foreground">
                {formatDate(rental.rentalStartDate)} – {formatDate(rental.rentalEndDate)}
              </Table.Cell>
              <Table.Cell>
                <!-- The server already decided overdue-ness; re-deriving it here
                     from the raw date would be a second copy of the rule. -->
                <span
                  class={cn(
                    'font-medium whitespace-nowrap',
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
                {#if rental.openExtensionStatus}
                  {@const eMeta = extensionStatusMeta(rental.openExtensionStatus)}
                  <p class={cn('mt-0.5 text-[11px] font-semibold', eMeta.tone)}>
                    {t('rentals.extensionLine', { status: eMeta.label })}
                  </p>
                {/if}
              </Table.Cell>
              <Table.Cell>
                {#if rental.contractId}
                  {@const cMeta = contractStatusMeta(rental.contractStatus ?? '')}
                  <a href={routes.contractDetail(rental.contractId)} class="inline-flex">
                    <Badge variant="outline" class={cMeta.tone}>
                      <span class={cn('size-1.5 rounded-full', cMeta.dot)}></span>
                      {cMeta.label}
                    </Badge>
                  </a>
                  {#if rental.contractStatus !== 'signed'}
                    <p class="mt-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      {t('rentals.notSigned')}
                    </p>
                  {/if}
                {:else}
                  <span class="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {t('rentals.notSigned')}
                  </span>
                {/if}
              </Table.Cell>
              <Table.Cell>
                {#if session.can(P.RENTAL_UPDATE) && rental.status !== 'completed'}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger
                      class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                      aria-label={t('rentals.rowActions')}
                      disabled={acting === rental.orderId}
                    >
                      <EllipsisVerticalIcon class="size-4" />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      {#if !rental.openExtensionStatus}
                        <DropdownMenu.Item
                          onSelect={() =>
                            (extendTarget = {
                              orderId: rental.orderId,
                              orderNumber: rental.orderNumber,
                            })}
                        >
                          <CalendarPlusIcon class="size-4" />
                          {t('rentals.extendRental')}
                        </DropdownMenu.Item>
                      {:else}
                        <DropdownMenu.Item
                          onSelect={() => goto(routes.orderDetail(rental.orderId))}
                        >
                          <CalendarPlusIcon class="size-4" />
                          {t('rentals.openExtension')}
                        </DropdownMenu.Item>
                      {/if}
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        onSelect={() => sendReminder(rental.orderId, rental.orderNumber)}
                      >
                        <MailIcon class="size-4" />
                        {t('rentals.sendReminder')}
                      </DropdownMenu.Item>
                      {#if rental.contractId}
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item
                          onSelect={() => resendContract(rental.orderId, rental.orderNumber)}
                        >
                          <FileSignatureIcon class="size-4" />
                          {t('rentals.resendContract')}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onSelect={() => copySigningLink(rental.contractId!)}>
                          <ClipboardIcon class="size-4" />
                          {t('rentals.copySigningLink')}
                        </DropdownMenu.Item>
                      {/if}
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        onSelect={() => finishRental(rental.orderId, rental.orderNumber)}
                      >
                        <CheckCircleIcon class="size-4" />
                        {t('rentals.confirmReturn')}
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
            {query.isFiltered ? t('rentals.emptyFilteredTitle') : t('rentals.emptyTitle')}
          </Empty.Title>
          <Empty.Description>
            {query.isFiltered ? t('rentals.emptyFilteredHint') : t('rentals.emptyHint')}
          </Empty.Description>
        </Empty.Header>
        {#if query.isFiltered}
          <Empty.Content>
            <Button variant="outline" onclick={() => query.reset()}>
              {t('rentals.clearFilters')}
            </Button>
          </Empty.Content>
        {/if}
      </Empty.Root>
    {/snippet}
  </ListCard>

  <ExtendDialog
    target={extendTarget}
    onClose={() => (extendTarget = undefined)}
    onDone={() => rentals.refresh()}
  />
</section>
