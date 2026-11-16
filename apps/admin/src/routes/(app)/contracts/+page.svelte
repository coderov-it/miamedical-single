<script lang="ts">
  import { P } from '@mia/permissions';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import ClipboardIcon from '@lucide/svelte/icons/clipboard';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import FileSignatureIcon from '@lucide/svelte/icons/file-signature';
  import MailIcon from '@lucide/svelte/icons/mail';
  import PlusIcon from '@lucide/svelte/icons/plus';
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
  import { CONTRACT_STATUS_ORDER, contractStatusMeta, variantLabel } from '~/lib/contracts/status';
  import { formatDate, relativeTime } from '~/lib/format';
  import { QueryDraft, QueryState } from '~/lib/query-state.svelte';
  import { errorMessage, unwrap, unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';
  import BusyButton from '~/lib/components/busy-button.svelte';

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

  let periodDialogOpen = $state(false);
  let periodContractId = $state('');
  let periodContractNumber = $state('');
  let periodFrom = $state('');
  let periodTo = $state('');
  let periodSubmitting = $state(false);

  function openPeriodDialog(contractId: string, contractNumber: string) {
    periodContractId = contractId;
    periodContractNumber = contractNumber;
    periodFrom = '';
    periodTo = '';
    periodDialogOpen = true;
  }

  async function submitPeriodUpdate() {
    if (!periodFrom || !periodTo) return;
    periodSubmitting = true;
    try {
      await unwrap(
        await api.api.admin.contracts[':id']['update-period'].$post({
          param: { id: periodContractId },
          json: { from: periodFrom, to: periodTo },
        }),
      );
      toast.success(t('contracts.toastPeriodUpdated', { number: periodContractNumber }));
      periodDialogOpen = false;
      contracts.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      periodSubmitting = false;
    }
  }

  async function resendContract(contractId: string, contractNumber: string) {
    try {
      await unwrap(await api.api.admin.contracts[':id'].send.$post({ param: { id: contractId } }));
      toast.success(t('contracts.toastResent', { number: contractNumber }));
      contracts.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
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
      toast.success(t('contracts.toastLinkCopied'));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }
</script>

<section class="admin-page">
  <PageHeader
    eyebrow={t('contracts.eyebrowSales')}
    title={t('contracts.listTitle')}
    description={t('contracts.listDescription')}
  >
    {#snippet actions()}
      {#if session.can(P.CONTRACT_CREATE)}
        <Button href={routes.contractNew}>
          <PlusIcon />
          {t('contracts.newContract')}
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
        {value === ANY ? t('contracts.filterAll') : contractStatusMeta(value).label}
      </button>
    {/each}
  </div>

  <ListCard
    countKey="entities.contract"
    meta={contracts.data?.meta}
    loading={contracts.loading}
    error={contracts.error}
    isEmpty={rows.length === 0}
    onPage={(next) => query.set({ page: next })}
    onRetry={() => contracts.refresh()}
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
            placeholder={t('contracts.searchPlaceholder')}
            aria-label={t('contracts.searchLabel')}
            class="h-8 w-72 pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">{t('contracts.apply')}</Button>
        {#if query.isFiltered}
          <Button type="button" variant="ghost" onclick={() => draft.clear()}>
            {t('contracts.clear')}
          </Button>
        {/if}
      </form>
    {/snippet}

    {#snippet table()}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{t('contracts.colContract')}</Table.Head>
            <Table.Head>{t('contracts.colCustomer')}</Table.Head>
            <Table.Head>{t('contracts.colOrder')}</Table.Head>
            <Table.Head>{t('contracts.colStatus')}</Table.Head>
            <Table.Head>{t('contracts.colVariant')}</Table.Head>
            <Table.Head>{t('status.contractSent')}</Table.Head>
            <Table.Head>{t('status.contractSigned')}</Table.Head>
            <Table.Head class="w-10"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as contract (contract.id)}
            {@const meta = contractStatusMeta(contract.status)}
            <Table.Row>
              <Table.Cell>
                <a
                  href={routes.contractDetail(contract.id)}
                  class="font-mono font-medium hover:underline"
                >
                  {contract.number}
                </a>
              </Table.Cell>
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
                  >
                    {contract.orderNumber}
                  </a>
                {:else}
                  <span class="text-muted-foreground">{t('contracts.manual')}</span>
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
              <Table.Cell>
                {#if session.can(P.CONTRACT_UPDATE) && contract.status !== 'signed' && contract.status !== 'voided'}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger
                      class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                      aria-label={t('contracts.rowActions')}
                    >
                      <EllipsisVerticalIcon class="size-4" />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item
                        onSelect={() => resendContract(contract.id, contract.number)}
                      >
                        <MailIcon class="size-4" />
                        {t('contracts.sendSigningLink')}
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onSelect={() => copySigningLink(contract.id)}>
                        <ClipboardIcon class="size-4" />
                        {t('contracts.copySigningLink')}
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        onSelect={() => openPeriodDialog(contract.id, contract.number)}
                      >
                        <CalendarIcon class="size-4" />
                        {t('contracts.sendUpdated')}
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
          <Empty.Media variant="icon"><FileSignatureIcon /></Empty.Media>
          <Empty.Title>
            {query.isFiltered ? t('contracts.emptyFilteredTitle') : t('contracts.emptyTitle')}
          </Empty.Title>
          <Empty.Description>
            {query.isFiltered ? t('contracts.emptyFilteredHint') : t('contracts.emptyHint')}
          </Empty.Description>
        </Empty.Header>
        {#if query.isFiltered}
          <Empty.Content>
            <Button variant="outline" onclick={() => query.reset()}>
              {t('contracts.clearFilters')}
            </Button>
          </Empty.Content>
        {/if}
      </Empty.Root>
    {/snippet}
  </ListCard>

  <Dialog.Root bind:open={periodDialogOpen}>
    <Dialog.Content class="sm:max-w-md">
      <Dialog.Header>
        <Dialog.Title>{t('contracts.periodTitle')}</Dialog.Title>
        <Dialog.Description>
          {t('contracts.periodDescription', { number: periodContractNumber })}
        </Dialog.Description>
      </Dialog.Header>
      <form
        class="grid gap-4 py-2"
        onsubmit={(e) => {
          e.preventDefault();
          submitPeriodUpdate();
        }}
      >
        <div class="grid gap-1.5">
          <label for="period-from" class="text-sm font-medium">{t('contracts.periodFrom')}</label>
          <Input id="period-from" type="date" bind:value={periodFrom} required />
        </div>
        <div class="grid gap-1.5">
          <label for="period-to" class="text-sm font-medium">{t('contracts.periodTo')}</label>
          <Input id="period-to" type="date" bind:value={periodTo} required />
        </div>
        <Dialog.Footer>
          <Button type="button" variant="destructive" onclick={() => (periodDialogOpen = false)}>
            {t('common.cancel')}
          </Button>
          <BusyButton
            type="submit"
            busy={periodSubmitting}
            busyLabel={t('contracts.periodSending')}
            disabled={!periodFrom || !periodTo}
          >
            {t('contracts.periodSubmit')}
          </BusyButton>
        </Dialog.Footer>
      </form>
    </Dialog.Content>
  </Dialog.Root>
</section>
