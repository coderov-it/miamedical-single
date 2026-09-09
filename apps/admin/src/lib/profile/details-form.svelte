<!--
  Your own name, phone and email.

  Email is the field with a rule on it: it is what you sign in with rather than
  a preference, so only a superuser may change their own. For everyone else it
  is shown read-only with the reason next to it — rendering it and saying who
  can change it beats hiding the address an operator came here to check.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { api } from '~/lib/api';
  import { focusFirstIssue, type GateField } from '~/lib/form-gate';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import type { Profile } from './profile';

  interface Props {
    profile: Profile;
    /** Hands back the saved record so the page holds one copy, not two. */
    onSaved: (next: Profile) => void;
  }

  let { profile, onSaved }: Props = $props();

  /**
   * Seeded once, then owned by the form. `untrack` because these are the
   * *initial* values of an editable copy — without it Svelte warns, rightly,
   * that a plain read here looks like it should track the prop, and tracking it
   * is exactly what must not happen: the page re-hands the record after every
   * save, which would overwrite whatever is half-typed in the next field.
   */
  let fullName = $state(untrack(() => profile.fullName ?? ''));
  let phone = $state(untrack(() => profile.phone ?? ''));
  let email = $state(untrack(() => profile.email));
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  const canEditEmail = $derived(profile.isSuperuser);

  const GATE: readonly GateField[] = [
    { key: 'fullName', id: 'profile-name' },
    { key: 'phone', id: 'profile-phone' },
    { key: 'email', id: 'profile-email' },
  ];

  function localIssues(): Record<string, string> {
    const issues: Record<string, string> = {};
    if (fullName.trim().length < 2) issues.fullName = 'Enter a name of at least 2 characters.';
    if (canEditEmail && !email.trim()) issues.email = 'Enter an email address.';
    return issues;
  }

  /**
   * Forgiving live: a revealed message disappears the moment its field is
   * right. Only ever hides — nothing is revealed before Save is clicked, so
   * nobody is scolded for a field they have not reached. Same effect as the
   * operator sheet, for the same reason.
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
      const next = await unwrap<Profile>(
        await api.api.auth.profile.$patch({
          json: { fullName, phone, ...(canEditEmail ? { email } : {}) },
        }),
      );

      // The sidebar prints the name, so the session has to pick up the change
      // or the save looks like it failed. `refreshUser`, never `load`: the
      // latter flips the flag the root layout gates on and would unmount this
      // component — and this toast — mid-save.
      await session.refreshUser();
      onSaved(next);
      toast.success('Details saved.');
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
      toast.error(error);
    } finally {
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
      <h2 class="text-sm font-semibold">Your details</h2>
      <p class="mt-0.5 text-sm text-muted-foreground">How you are named across the back office.</p>
    </div>

    {#if error}
      <p class="rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
        {error}
      </p>
    {/if}

    <div>
      <Label class="mb-1.5" for="profile-name">Full name</Label>
      <Input
        id="profile-name"
        bind:value={fullName}
        autocomplete="name"
        aria-invalid={fields.fullName ? 'true' : undefined}
      />
      {#if fields.fullName}
        <p class="mt-1 text-xs text-destructive" role="alert">{fields.fullName}</p>
      {/if}
    </div>

    <div>
      <Label class="mb-1.5" for="profile-phone">Phone</Label>
      <Input
        id="profile-phone"
        bind:value={phone}
        autocomplete="tel"
        placeholder="Mobile, desk or extension"
        aria-invalid={fields.phone ? 'true' : undefined}
      />
      {#if fields.phone}
        <p class="mt-1 text-xs text-destructive" role="alert">{fields.phone}</p>
      {/if}
    </div>

    <div>
      <Label class="mb-1.5" for="profile-email">Email</Label>
      <Input
        id="profile-email"
        type="email"
        bind:value={email}
        autocomplete="email"
        readonly={!canEditEmail}
        class={canEditEmail ? undefined : 'bg-muted text-muted-foreground'}
        aria-invalid={fields.email ? 'true' : undefined}
      />
      {#if fields.email}
        <p class="mt-1 text-xs text-destructive" role="alert">{fields.email}</p>
      {:else if !canEditEmail}
        <p class="mt-1 text-xs text-muted-foreground">
          This is what you sign in with. Ask an administrator to change it.
        </p>
      {/if}
    </div>

    <Button type="submit" disabled={saving}>
      {#if saving}<Spinner />{/if}
      {saving ? 'Saving…' : 'Save details'}
    </Button>
  </form>
</Card.Root>
