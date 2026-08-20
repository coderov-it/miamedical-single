<!--
  Setting someone else's password.

  Separate from the editor sheet because it is not an edit: it revokes every
  session the account has, which is the point — a password is reset when the old
  one is suspect, and leaving live sessions behind resets nothing. The operator
  is told that before they commit, not after.

  There is no "current password" field, and that is not a shortcut: the caller
  is proving `admin:update` on someone else's account, not proving they are its
  owner. Changing your OWN password goes through the profile menu, which does
  ask for the current one — and this dialog refuses a self-target for exactly
  that reason.
-->
<script lang="ts">
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { api } from '~/lib/api';
  import { focusFirstIssue, type GateField } from '~/lib/form-gate';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import type { AdminUser } from './access';

  interface Props {
    /** The operator whose password is being set, or `undefined` when closed. */
    open: AdminUser | undefined;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  let password = $state('');
  let confirm = $state('');
  let saving = $state(false);
  let fields = $state<Record<string, string>>({});
  let error = $state<string | null>(null);

  let seededFor = $state<string | undefined>(undefined);

  $effect(() => {
    if (open?.id === seededFor) return;
    seededFor = open?.id;
    password = '';
    confirm = '';
    fields = {};
    error = null;
  });

  const GATE: readonly GateField[] = [
    { key: 'password', id: 'set-password' },
    { key: 'confirm', id: 'set-password-confirm' },
  ];

  function localIssues(): Record<string, string> {
    const issues: Record<string, string> = {};
    if (password.length < 12) issues.password = 'Use at least 12 characters.';
    else if (confirm !== password) issues.confirm = 'The two passwords do not match.';
    return issues;
  }

  async function submit() {
    const target = open;
    if (!target) return;

    const issues = localIssues();
    if (Object.keys(issues).length > 0) {
      fields = issues;
      focusFirstIssue(issues, GATE);
      return;
    }

    saving = true;
    error = null;
    fields = {};
    try {
      await unwrap(
        await api.api.admin.users[':id'].password.$post({
          param: { id: target.id },
          json: { password },
        }),
      );
      toast.success(`Password set. ${target.email} was signed out everywhere.`);
      onClose();
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
      toast.error(error);
    } finally {
      saving = false;
    }
  }
</script>

<Dialog.Root
  open={open !== undefined}
  onOpenChange={(next) => {
    if (!next && !saving) onClose();
  }}
>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Set a password</Dialog.Title>
      <Dialog.Description>
        For {open?.email}. Every session they have open is ended.
      </Dialog.Description>
    </Dialog.Header>

    <form
      class="space-y-4"
      onsubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {#if error}
        <p class="rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      {/if}

      <div>
        <Label class="mb-1.5" for="set-password">New password</Label>
        <Input
          id="set-password"
          type="password"
          autocomplete="new-password"
          bind:value={password}
          placeholder="At least 12 characters"
          aria-invalid={fields.password ? 'true' : undefined}
        />
        {#if fields.password}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.password}</p>
        {/if}
      </div>

      <div>
        <Label class="mb-1.5" for="set-password-confirm">Repeat password</Label>
        <Input
          id="set-password-confirm"
          type="password"
          autocomplete="new-password"
          bind:value={confirm}
          aria-invalid={fields.confirm ? 'true' : undefined}
        />
        {#if fields.confirm}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.confirm}</p>
        {/if}
      </div>

      <Dialog.Footer>
        <Button type="button" variant="ghost" disabled={saving} onclick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {#if saving}<Spinner />{/if}
          {saving ? 'Saving…' : 'Set password'}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
