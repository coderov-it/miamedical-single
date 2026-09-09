<!--
  The per-operator action menu.

  Split out of the access table because the table's job is to render rows and
  this is the policy about which actions a row even offers — the same four
  invariants the server enforces in `modules/admin-users/service.ts`, read back
  as menu items so nothing on screen is a button that will 403.

  It reads its own permissions from the session rather than taking them as
  props: the answer is global, and passing it down invites two rows disagreeing.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import CircleUserIcon from '@lucide/svelte/icons/circle-user';
  import KeyRoundIcon from '@lucide/svelte/icons/key-round';
  import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import UserCheckIcon from '@lucide/svelte/icons/user-check';
  import UserXIcon from '@lucide/svelte/icons/user-x';

  import { buttonVariants } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';
  import type { AdminUser } from './access';

  interface Props {
    user: AdminUser;
    /** True while a row request is in flight, so a second one cannot be sent. */
    busy: boolean;
    onEdit: () => void;
    /** Set someone else's password — no current password, needs `admin:update`. */
    onSetPassword: () => void;
    onToggleActive: () => void;
    onDelete: () => void;
  }

  let { user, busy, onEdit, onSetPassword, onToggleActive, onDelete }: Props = $props();

  const isSelf = $derived(user.id === session.user?.id);
  const canUpdate = $derived(session.can(P.ADMIN_UPDATE));
  const canDelete = $derived(session.can(P.ADMIN_DELETE));
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
    aria-label="Row actions"
  >
    <MoreHorizontalIcon />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onSelect={onEdit}>
      <PencilIcon />
      {canUpdate ? 'Edit' : 'View access'}
    </DropdownMenu.Item>

    <!--
      Your own row sends you to your own account instead of offering the actions
      below, every one of which the server refuses on it: you cannot lock
      yourself out, and your password is changed where a current one can be
      asked for. A superuser is not asked for it there — the waiver lives in
      `modules/auth/service.ts`, not in this menu.
    -->
    {#if isSelf}
      <DropdownMenu.Item>
        {#snippet child({ props })}
          <a href={routes.profile} {...props}>
            <CircleUserIcon />
            My account
          </a>
        {/snippet}
      </DropdownMenu.Item>
    {/if}

    {#if canUpdate && !isSelf}
      <DropdownMenu.Item onSelect={onSetPassword}>
        <KeyRoundIcon />
        Set password
      </DropdownMenu.Item>
      <DropdownMenu.Item disabled={busy} onSelect={onToggleActive}>
        {#if user.isActive}
          <UserXIcon />
          Disable account
        {:else}
          <UserCheckIcon />
          Enable account
        {/if}
      </DropdownMenu.Item>
    {/if}

    {#if canDelete && !isSelf}
      <DropdownMenu.Separator />
      <DropdownMenu.Item variant="destructive" onSelect={onDelete}>
        <Trash2Icon />
        Delete
      </DropdownMenu.Item>
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>
