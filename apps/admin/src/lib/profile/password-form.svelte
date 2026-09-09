<!--
  Your own password.

  A superuser is not asked for the current one, and the field is not rendered at
  all rather than rendered-and-ignored. The reason is not convenience: the flag
  already sets any *other* operator's password with no proof about that account,
  so asking for the old one here guards nothing its holder could not route
  around from the access screen — while still blocking the case the check exists
  to serve, an administrator rotating a password they no longer remember.

  Everyone else proves ownership, because for them that route is closed. The
  same policy runs server-side in `modules/auth/service.ts`; this only decides
  which fields to draw.

  Saving signs you out everywhere, including here. That is the point of a
  password change — leaving live sessions on the account changes nothing — so it
  is stated before the button, not after.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { goto } from '$app/navigation';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { api } from '~/lib/api';
  import { focusFirstIssue, type GateField } from '~/lib/form-gate';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  interface Props {
    /** Decides whether the current-password field exists. */
    isSuperuser: boolean;
  }

  let { isSuperuser }: Props = $props();

  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  const needsCurrent = $derived(!isSuperuser);

  /** Screen order — `focusFirstIssue` walks this list, not the issue object. */
  const GATE: readonly GateField[] = [
    { key: 'currentPassword', id: 'profile-current-password' },
    { key: 'newPassword', id: 'profile-new-password' },
    { key: 'confirmPassword', id: 'profile-confirm-password' },
  ];

  function localIssues(): Record<string, string> {
    const issues: Record<string, string> = {};
    if (needsCurrent && currentPassword.length === 0) {
      issues.currentPassword = 'Enter your current password.';
    }
    if (newPassword.length < 12) issues.newPassword = 'Use at least 12 characters.';
    else if (needsCurrent && newPassword === currentPassword) {
      issues.newPassword = 'Choose a password you are not already using.';
    } else if (confirmPassword !== newPassword) {
      issues.confirmPassword = 'The two passwords do not match.';
    }
    return issues;
  }

  /**
   * Forgiving live: a revealed message disappears the moment its field is
   * right — clearing a mismatched repeat should not leave "the two passwords
   * do not match" sitting under an empty box. Only ever hides; nothing is
   * revealed before the operator asks to save.
   *
   * `fields` is read inside `untrack` because writing it is this effect's own
   * output; tracking it would make the effect its own trigger.
   */
  $effect(() => {
    const issues = localIssues();
    untrack(() => {
      const stale = Object.keys(fields).filter(
        (key) => GATE.some((field) => field.key === key) && !issues[key],
      );
      if (stale.length === 0) return;
      const next = { ...fields };
      for (const key of stale) delete next[key];
      fields = next;
    });
  });

  async function submit() {
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
        await api.api.auth.password.$post({
          json: {
            newPassword,
            confirmPassword,
            ...(needsCurrent ? { currentPassword } : {}),
          },
        }),
      );

      // The cookie is already cleared and every session row is gone, so there
      // is nothing left to revoke — drop the local copy rather than calling
      // logout against a session that no longer exists.
      session.clear();
      toast.success('Password changed. Sign in again with the new one.');
      await goto(routes.login);
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
      toast.error(error);
      saving = false;
    }
  }
</script>

<Card.Root class="py-0">
  <form
    class="space-y-5 p-5"
    onsubmit={(event) => {
      event.preventDefault();
      void submit();
    }}
  >
    <div>
      <h2 class="text-sm font-semibold">Password</h2>
      <p class="mt-0.5 text-sm text-muted-foreground">
        Changing it signs you out on every device, including this one.
      </p>
    </div>

    {#if error}
      <p class="rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
        {error}
      </p>
    {/if}

    {#if needsCurrent}
      <div>
        <Label class="mb-1.5" for="profile-current-password">Current password</Label>
        <Input
          id="profile-current-password"
          type="password"
          autocomplete="current-password"
          bind:value={currentPassword}
          aria-invalid={fields.currentPassword ? 'true' : undefined}
        />
        {#if fields.currentPassword}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.currentPassword}</p>
        {/if}
      </div>
    {/if}

    <div>
      <Label class="mb-1.5" for="profile-new-password">New password</Label>
      <Input
        id="profile-new-password"
        type="password"
        autocomplete="new-password"
        bind:value={newPassword}
        placeholder="At least 12 characters"
        aria-invalid={fields.newPassword ? 'true' : undefined}
      />
      {#if fields.newPassword}
        <p class="mt-1 text-xs text-destructive" role="alert">{fields.newPassword}</p>
      {/if}
    </div>

    <div>
      <Label class="mb-1.5" for="profile-confirm-password">Repeat new password</Label>
      <Input
        id="profile-confirm-password"
        type="password"
        autocomplete="new-password"
        bind:value={confirmPassword}
        aria-invalid={fields.confirmPassword ? 'true' : undefined}
      />
      {#if fields.confirmPassword}
        <p class="mt-1 text-xs text-destructive" role="alert">{fields.confirmPassword}</p>
      {/if}
    </div>

    <Button type="submit" disabled={saving}>
      {#if saving}<Spinner />{/if}
      {saving ? 'Saving…' : 'Change password'}
    </Button>
  </form>
</Card.Root>
