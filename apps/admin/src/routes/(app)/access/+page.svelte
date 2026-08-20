<script lang="ts">
  import { P } from '@mia/permissions';
  import KeyRoundIcon from '@lucide/svelte/icons/key-round';
  import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SearchIcon from '@lucide/svelte/icons/search';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import UserCheckIcon from '@lucide/svelte/icons/user-check';
  import UserXIcon from '@lucide/svelte/icons/user-x';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { toast } from 'svelte-sonner';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { api } from '~/lib/api';
  import { groupSummary, type AdminUser, type AdminUserList } from '~/lib/access/access';
  import AdminUserSheet from '~/lib/access/admin-user-sheet.svelte';
  import SetPasswordDialog from '~/lib/access/set-password-dialog.svelte';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { orDash, pluralize, relativeTime } from '~/lib/format';
  import { QueryDraft, QueryState } from '~/lib/query-state.svelte';
  import { errorMessage, unwrap, unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';

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
  const canUpdate = $derived(session.can(P.ADMIN_UPDATE));
  const canDelete = $derived(session.can(P.ADMIN_DELETE));

  const statuses = [
    { value: 'all', label: 'All accounts' },
    { value: 'active', label: 'Active' },
    { value: 'disabled', label: 'Disabled' },
  ];
  const statusLabel = $derived(
    statuses.find((option) => option.value === draft.values.status)?.label ?? 'All accounts',
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
    user.isSuperuser ? 'Everything' : pluralize(user.permissions.length, 'permission');

  async function toggleActive(user: AdminUser) {
    busy = true;
    try {
      await unwrap(
        await api.api.admin.users[':id'].$patch({
          param: { id: user.id },
          json: { isActive: !user.isActive },
        }),
      );
      toast.success(`${user.email} ${user.isActive ? 'disabled' : 'enabled'}.`);
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
      toast.success(`Deleted ${target.email}.`);
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
    eyebrow="Settings"
    title="Admin users"
    description="Who can open the back office, and what each of them may reach. Access is a set of permissions per account — there are no roles."
  >
    {#snippet actions()}
      {#if canCreate}
        <Button onclick={() => (editing = null)}>
          <PlusIcon />
          New operator
        </Button>
      {/if}
    {/snippet}
  </PageHeader>

  <ListCard
    noun="operator"
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
            placeholder="Search name or email…"
            aria-label="Search operators"
            class="h-8 w-56 pl-8"
          />
        </div>

        <Select.Root type="single" bind:value={draft.values.status}>
          <Select.Trigger class="w-36" aria-label="Filter by account state">
            {statusLabel}
          </Select.Trigger>
          <Select.Content>
            {#each statuses as option (option.value)}
              <Select.Item value={option.value}>{option.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <Button type="submit" variant="outline" size="sm">Apply</Button>
      </form>
    {/snippet}

    {#snippet table()}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-[32%]">Operator</Table.Head>
            <Table.Head>Access</Table.Head>
            <Table.Head>Account</Table.Head>
            <Table.Head>Last sign-in</Table.Head>
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
                  <Badge>Superuser</Badge>
                {:else}
                  <span class="text-sm">{accessLabel(user)}</span>
                  <p class="text-xs text-muted-foreground">{groupSummary(user.permissions)}</p>
                {/if}
              </Table.Cell>

              <Table.Cell>
                <div class="flex flex-wrap items-center gap-1.5">
                  {#if user.isActive}
                    <Badge variant="secondary">Active</Badge>
                  {:else}
                    <Badge variant="outline" class="border-destructive/40 text-destructive">
                      Disabled
                    </Badge>
                  {/if}
                  {#if !user.hasPassword}
                    <Badge
                      variant="outline"
                      class="border-amber-500/40 text-amber-600 dark:text-amber-400"
                    >
                      No password
                    </Badge>
                  {/if}
                  {#if isSelf(user)}
                    <Badge variant="outline">You</Badge>
                  {/if}
                </div>
              </Table.Cell>

              <Table.Cell class="text-muted-foreground">
                {user.lastLoginAt ? relativeTime(user.lastLoginAt) : 'Never'}
              </Table.Cell>

              <Table.Cell>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                    aria-label="Row actions"
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">
                    <DropdownMenu.Item onSelect={() => (editing = user)}>
                      <PencilIcon />
                      {canUpdate ? 'Edit' : 'View access'}
                    </DropdownMenu.Item>

                    <!--
                      Every action below is one the server refuses on your own
                      row — you cannot lock yourself out or reset your own
                      password without the current one. Hidden rather than shown
                      failing.
                    -->
                    {#if canUpdate && !isSelf(user)}
                      <DropdownMenu.Item onSelect={() => (passwordFor = user)}>
                        <KeyRoundIcon />
                        Set password
                      </DropdownMenu.Item>
                      <DropdownMenu.Item disabled={busy} onSelect={() => void toggleActive(user)}>
                        {#if user.isActive}
                          <UserXIcon />
                          Disable account
                        {:else}
                          <UserCheckIcon />
                          Enable account
                        {/if}
                      </DropdownMenu.Item>
                    {/if}

                    {#if canDelete && !isSelf(user)}
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item variant="destructive" onSelect={() => (deleting = user)}>
                        <Trash2Icon />
                        Delete
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
          <Empty.Media variant="icon"><UsersIcon /></Empty.Media>
          <Empty.Title>No operators match</Empty.Title>
          <Empty.Description>
            {query.isFiltered
              ? 'Clear the filters to see every account.'
              : 'The first superuser is created from the command line — see script/create-admin.ts.'}
          </Empty.Description>
        </Empty.Header>
        {#if query.isFiltered}
          <Empty.Content>
            <Button variant="outline" onclick={() => draft.clear()}>Clear filters</Button>
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
      <AlertDialog.Title>Delete this operator?</AlertDialog.Title>
      <AlertDialog.Description>
        {deleting?.email} loses access immediately and every session they have open ends. Disabling the
        account keeps the record and is reversible.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={busy}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        disabled={busy}
        class={buttonVariants({ variant: 'destructive' })}
        onclick={(event) => {
          event.preventDefault();
          void confirmDelete();
        }}
      >
        {busy ? 'Deleting…' : 'Delete operator'}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
