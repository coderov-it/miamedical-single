<script lang="ts">
  import { P } from '@mia/permissions';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SearchIcon from '@lucide/svelte/icons/search';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { toast } from 'svelte-sonner';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { api } from '~/lib/api';
  import { groupSummary, type AdminUser, type AdminUserList } from '~/lib/access/access';
  import AdminUserSheet from '~/lib/access/admin-user-sheet.svelte';
  import RowActions from '~/lib/access/row-actions.svelte';
  import SetPasswordDialog from '~/lib/access/set-password-dialog.svelte';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { orDash, relativeTime } from '~/lib/format';
  import { QueryDraft, QueryState } from '~/lib/query-state.svelte';
  import { errorMessage, unwrap, unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import { t, tn, type MessageKey } from '~/lib/ui-text';
  import BusyLabel from '~/lib/components/busy-label.svelte';

  const query = new QueryState({ q: '', status: 'all', page: 1 });
  const draft = new QueryDraft(query);

  const operators = new Resource(
    () => query.current,
    async (current, signal) =>
      unwrapFull<AdminUserList>(
        await api.api.admin.users.$get(
          {
            query: {
              page: String(current.page),
              ...(current.q ? { q: current.q } : {}),
              ...(current.status !== 'all' ? { status: current.status } : {}),
            },
          },
          { init: { signal } },
        ),
      ),
    { enabled: () => session.can(P.ADMIN_READ) },
  );

  const rows = $derived(operators.data?.data ?? []);
  const canCreate = $derived(session.can(P.ADMIN_CREATE));

  const statuses: { value: string; labelKey: MessageKey }[] = [
    { value: 'all', labelKey: 'access.stateAll' },
    { value: 'active', labelKey: 'access.stateActive' },
    { value: 'disabled', labelKey: 'access.stateDisabled' },
  ];
  const statusLabel = $derived(
    t(
      statuses.find((option) => option.value === draft.values.status)?.labelKey ??
        'access.stateAll',
    ),
  );

  /** `undefined` closed · `null` create · a row to edit. */
  let editing = $state<AdminUser | null | undefined>(undefined);
  let passwordFor = $state<AdminUser | undefined>(undefined);
  let deleting = $state<AdminUser | null>(null);
  let busy = $state(false);

  const isSelf = (user: AdminUser) => user.id === session.user?.id;

  /**
   * One line naming what the account reaches. A superuser is not "48
   * permissions" — it is a different kind of grant, and flattening the two
   * would hide the one that keeps growing on its own.
   */
  const accessLabel = (user: AdminUser) =>
    user.isSuperuser
      ? t('access.accessEverything')
      : tn('shell.permissionCount', user.permissions.length);

  async function toggleActive(user: AdminUser) {
    busy = true;
    try {
      await unwrap(
        await api.api.admin.users[':id'].$patch({
          param: { id: user.id },
          json: { isActive: !user.isActive },
        }),
      );
      toast.success(
        t(user.isActive ? 'access.toastDisabled' : 'access.toastEnabled', { email: user.email }),
      );
      operators.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      busy = false;
    }
  }

  async function confirmDelete() {
    const target = deleting;
    if (!target) return;

    busy = true;
    try {
      await unwrap(await api.api.admin.users[':id'].$delete({ param: { id: target.id } }));
      toast.success(t('access.toastDeleted', { email: target.email }));
      deleting = null;
      operators.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      busy = false;
    }
  }
</script>

<section class="admin-page">
  <PageHeader
    eyebrow={t('nav.settings')}
    title={t('nav.adminUsers')}
    description={t('access.pageDescription')}
  >
    {#snippet actions()}
      {#if canCreate}
        <Button onclick={() => (editing = null)}>
          <PlusIcon />
          {t('access.newOperator')}
        </Button>
      {/if}
    {/snippet}
  </PageHeader>

  <ListCard
    countKey="entities.operator"
    meta={operators.data?.meta}
    loading={operators.loading}
    error={operators.error}
    isEmpty={rows.length === 0}
    onPage={(page) => query.set({ page })}
    onRetry={() => operators.refresh()}
    skeletonColumns={5}
  >
    {#snippet filters()}
      <form
        class="flex flex-wrap items-center gap-2"
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
            placeholder={t('access.searchPlaceholder')}
            aria-label={t('access.searchLabel')}
            class="h-8 w-56 pl-8"
          />
        </div>

        <Select.Root type="single" bind:value={draft.values.status}>
          <Select.Trigger class="w-36" aria-label={t('access.stateFilterLabel')}>
            {statusLabel}
          </Select.Trigger>
          <Select.Content>
            {#each statuses as option (option.value)}
              <Select.Item value={option.value}>{t(option.labelKey)}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <Button type="submit" variant="outline" size="sm">
          {t('access.apply')}
        </Button>
      </form>
    {/snippet}

    {#snippet table()}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-[32%]">{t('access.colOperator')}</Table.Head>
            <Table.Head>{t('access.colAccess')}</Table.Head>
            <Table.Head>{t('access.colAccount')}</Table.Head>
            <Table.Head>{t('access.colLastSignIn')}</Table.Head>
            <Table.Head class="w-10"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as user (user.id)}
            <Table.Row>
              <Table.Cell>
                <button
                  type="button"
                  class="block text-left font-medium hover:underline"
                  onclick={() => (editing = user)}
                >
                  {orDash(user.fullName)}
                </button>
                <p class="text-xs text-muted-foreground">{user.email}</p>
              </Table.Cell>

              <Table.Cell>
                {#if user.isSuperuser}
                  <Badge>{t('shell.superuser')}</Badge>
                {:else}
                  <span class="text-sm">{accessLabel(user)}</span>
                  <p class="text-xs text-muted-foreground">{groupSummary(user.permissions)}</p>
                {/if}
              </Table.Cell>

              <Table.Cell>
                <div class="flex flex-wrap items-center gap-1.5">
                  {#if user.isActive}
                    <Badge variant="secondary">{t('access.stateActive')}</Badge>
                  {:else}
                    <Badge variant="outline" class="border-destructive/40 text-destructive">
                      {t('access.stateDisabled')}
                    </Badge>
                  {/if}
                  {#if !user.hasPassword}
                    <Badge
                      variant="outline"
                      class="border-amber-500/40 text-amber-600 dark:text-amber-400"
                    >
                      {t('access.badgeNoPassword')}
                    </Badge>
                  {/if}
                  {#if isSelf(user)}
                    <Badge variant="outline">{t('access.badgeYou')}</Badge>
                  {/if}
                </div>
              </Table.Cell>

              <Table.Cell class="text-muted-foreground">
                {user.lastLoginAt ? relativeTime(user.lastLoginAt) : t('access.never')}
              </Table.Cell>

              <Table.Cell>
                <RowActions
                  {user}
                  {busy}
                  onEdit={() => (editing = user)}
                  onSetPassword={() => (passwordFor = user)}
                  onToggleActive={() => void toggleActive(user)}
                  onDelete={() => (deleting = user)}
                />
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/snippet}

    {#snippet empty()}
      <Empty.Root class="border-0">
        <Empty.Header>
          <Empty.Media variant="icon"><UsersIcon /></Empty.Media>
          <Empty.Title>{t('access.emptyTitle')}</Empty.Title>
          <Empty.Description>
            {query.isFiltered ? t('access.emptyFiltered') : t('access.emptyFirst')}
          </Empty.Description>
        </Empty.Header>
        {#if query.isFiltered}
          <Empty.Content>
            <Button variant="outline" onclick={() => draft.clear()}>
              {t('access.clearFilters')}
            </Button>
          </Empty.Content>
        {/if}
      </Empty.Root>
    {/snippet}
  </ListCard>
</section>

<AdminUserSheet
  open={editing}
  onClose={() => (editing = undefined)}
  onSaved={() => operators.refresh()}
/>

<SetPasswordDialog open={passwordFor} onClose={() => (passwordFor = undefined)} />

<AlertDialog.Root
  open={deleting !== null}
  onOpenChange={(open) => {
    if (!open) deleting = null;
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{t('access.deleteTitle')}</AlertDialog.Title>
      <AlertDialog.Description>
        {t('access.deleteDescription', { email: deleting?.email ?? '' })}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={busy}>{t('common.cancel')}</AlertDialog.Cancel>
      <AlertDialog.Action
        disabled={busy}
        class={buttonVariants({ variant: 'destructive' })}
        onclick={(event) => {
          event.preventDefault();
          void confirmDelete();
        }}
      >
        <BusyLabel {busy} label={t('access.deleting')}>{t('access.deleteOperator')}</BusyLabel>
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
