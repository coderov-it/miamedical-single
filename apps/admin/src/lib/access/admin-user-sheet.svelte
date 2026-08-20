<!--
  The operator editor, as a right-side sheet.

  `open` is three-valued and load-bearing, the same way the category sheet's is:
    undefined → closed
    null      → create
    AdminUser → edit

  Profile and access are saved by two separate calls because they answer to two
  separate permissions — an operator holding only `admin:update` can fix a name
  here and never touch a grant. Access goes first: its refusals (the last
  superuser, granting past your own reach) are the ones worth hitting before
  anything at all has changed.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { api } from '~/lib/api';
  import { focusFirstIssue, type GateField } from '~/lib/form-gate';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import type { AdminUser } from './access';
  import PermissionPicker from './permission-picker.svelte';

  interface Props {
    /** `undefined` closed · `null` create · an operator to edit. */
    open: AdminUser | null | undefined;
    onClose: () => void;
    onSaved: () => void;
  }

  let { open, onClose, onSaved }: Props = $props();

  let email = $state('');
  let fullName = $state('');
  let phone = $state('');
  let password = $state('');
  let isActive = $state(true);
  let isSuperuser = $state(false);
  let codes = $state<number[]>([]);

  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  const isEdit = $derived(open !== null && open !== undefined);
  const isSelf = $derived(open != null && open.id === session.user?.id);
  const canAssign = $derived(session.can(P.ADMIN_PERMISSION_ASSIGN));
  /** Creating implies editing what you are creating; `admin:update` governs the rest. */
  const canEditProfile = $derived(!isEdit || session.can(P.ADMIN_UPDATE));
  /**
   * Nothing here is editable — an `admin:read` holder opening a row to see what
   * it holds. The sheet stays the way they look at it, so the footer offers a
   * Close rather than a Save that could only fail.
   */
  const readOnlyAll = $derived(!canEditProfile && (isSelf || !canAssign));

  const pickerReason = $derived.by(() => {
    if (isSelf) return 'You cannot change your own access. Ask another administrator.';
    if (!canAssign) {
      return 'You can edit this profile, but not what it reaches — that needs admin:permission_assign.';
    }
    return undefined;
  });

  // Re-seed only when the sheet is pointed at a different subject, so a list
  // refresh handing back an equal-but-new object cannot wipe work in progress.
  let seededFor = $state<string | null | undefined>(undefined);

  $effect(() => {
    const subject = open === undefined ? undefined : (open?.id ?? null);
    if (subject === seededFor) return;
    seededFor = subject;

    error = null;
    fields = {};
    password = '';

    if (open === undefined) return;

    email = open?.email ?? '';
    fullName = open?.fullName ?? '';
    phone = open?.phone ?? '';
    isActive = open?.isActive ?? true;
    isSuperuser = open?.isSuperuser ?? false;
    codes = [...(open?.permissions ?? [])];
  });

  const sameCodes = (a: readonly number[], b: readonly number[]) =>
    a.length === b.length && a.every((code, i) => code === b[i]);

  /**
   * Checked on click rather than gating the button: Save stays clickable and
   * says what is missing, at the field that is missing it. Keys match the
   * server's own `error.fields` paths so both render through one code path.
   */
  const GATE: readonly GateField[] = [
    { key: 'fullName', id: 'operator-name' },
    { key: 'email', id: 'operator-email' },
    { key: 'password', id: 'operator-password' },
  ];

  function localIssues(): Record<string, string> {
    const issues: Record<string, string> = {};
    if (fullName.trim().length < 2) issues.fullName = 'Enter a name of at least 2 characters.';
    if (!email.trim()) issues.email = 'Enter an email address.';
    if (!isEdit && password.length < 12) issues.password = 'Use at least 12 characters.';
    return issues;
  }

  /**
   * Forgiving live: a message that has been revealed disappears the moment its
   * field is right. Only ever hides — nothing is revealed before the operator
   * asks to save, so nobody is scolded for a field they have not reached.
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

  async function save() {
    const issues = localIssues();
    if (Object.keys(issues).length > 0) {
      fields = issues;
      error = null;
      focusFirstIssue(issues, GATE);
      return;
    }

    saving = true;
    error = null;
    fields = {};

    try {
      if (open) await saveExisting(open);
      else await createNew();

      toast.success(open ? `Saved ${email}.` : `Created ${email}.`);
      onSaved();
      onClose();
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
      toast.error(error);
    } finally {
      saving = false;
    }
  }

  async function createNew() {
    await unwrap(
      await api.api.admin.users.$post({
        json: {
          email: email.trim(),
          fullName: fullName.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
          password,
          isSuperuser,
          permissions: codes,
        },
      }),
    );
  }

  async function saveExisting(target: AdminUser) {
    const accessChanged =
      canAssign &&
      !isSelf &&
      (isSuperuser !== target.isSuperuser || !sameCodes(codes, target.permissions));

    if (accessChanged) {
      await unwrap(
        await api.api.admin.users[':id'].permissions.$put({
          param: { id: target.id },
          json: { isSuperuser, permissions: codes },
        }),
      );
    }

    const profile = {
      ...(email.trim() !== target.email ? { email: email.trim() } : {}),
      ...(fullName.trim() !== (target.fullName ?? '') ? { fullName: fullName.trim() } : {}),
      ...(phone.trim() !== (target.phone ?? '') ? { phone: phone.trim() } : {}),
      ...(isActive !== target.isActive ? { isActive } : {}),
    };

    if (Object.keys(profile).length > 0) {
      await unwrap(
        await api.api.admin.users[':id'].$patch({ param: { id: target.id }, json: profile }),
      );
    }
  }
</script>

<Sheet.Root
  open={open !== undefined}
  onOpenChange={(next) => {
    if (!next && !saving) onClose();
  }}
>
  <Sheet.Content
    side="right"
    class="gap-0 p-0 data-[side=right]:sm:max-w-4xl"
    showCloseButton={false}
  >
    <Sheet.Header class="border-b bg-muted/50">
      <Sheet.Title>{isEdit ? 'Edit operator' : 'New operator'}</Sheet.Title>
      <Sheet.Description>
        Back-office accounts only. Customers sign in through the storefront and share nothing with
        this list.
      </Sheet.Description>
    </Sheet.Header>

    <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
      {#if error}
        <p class="rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      {/if}

      {#if open && !open.hasPassword}
        <p class="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          This account has no password and cannot sign in. Use "Set password" on its row.
        </p>
      {/if}

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <Label class="mb-1.5" for="operator-name">Full name</Label>
          <Input
            id="operator-name"
            disabled={!canEditProfile}
            bind:value={fullName}
            placeholder="Giulia Rossi"
            aria-invalid={fields.fullName ? 'true' : undefined}
          />
          {#if fields.fullName}
            <p class="mt-1 text-xs text-destructive" role="alert">{fields.fullName}</p>
          {/if}
        </div>

        <div>
          <Label class="mb-1.5" for="operator-email">Email</Label>
          <Input
            id="operator-email"
            disabled={!canEditProfile}
            type="email"
            bind:value={email}
            placeholder="giulia@miamedical.it"
            aria-invalid={fields.email ? 'true' : undefined}
          />
          {#if fields.email}
            <p class="mt-1 text-xs text-destructive" role="alert">{fields.email}</p>
          {/if}
        </div>

        <div>
          <Label class="mb-1.5" for="operator-phone">Phone</Label>
          <Input
            id="operator-phone"
            disabled={!canEditProfile}
            bind:value={phone}
            placeholder="Optional"
          />
        </div>

        {#if isEdit}
          <div>
            <Label class="mb-1.5" for="operator-active">Account</Label>
            <div class="flex h-9 items-center gap-2">
              <Switch
                id="operator-active"
                checked={isActive}
                disabled={isSelf || !canEditProfile}
                onCheckedChange={(checked) => (isActive = checked)}
              />
              <span class="text-sm text-muted-foreground">
                {#if isSelf}
                  You cannot disable your own account
                {:else}
                  {isActive ? 'Can sign in' : 'Disabled — signed out everywhere'}
                {/if}
              </span>
            </div>
          </div>
        {:else}
          <div>
            <Label class="mb-1.5" for="operator-password">Password</Label>
            <Input
              id="operator-password"
              type="password"
              bind:value={password}
              autocomplete="new-password"
              placeholder="At least 12 characters"
              aria-invalid={fields.password ? 'true' : undefined}
            />
            {#if fields.password}
              <p class="mt-1 text-xs text-destructive" role="alert">{fields.password}</p>
            {/if}
          </div>
        {/if}
      </div>

      <div class="border-t pt-5">
        <PermissionPicker
          bind:codes
          bind:isSuperuser
          readOnly={isSelf || !canAssign}
          readOnlyReason={pickerReason}
          grantable={(code) => session.can(code)}
          canGrantSuperuser={session.user?.isSuperuser === true}
        />
      </div>
    </div>

    <Sheet.Footer class="flex-row items-center justify-between border-t bg-muted/50">
      {#if readOnlyAll}
        <Button variant="outline" class="ml-auto" onclick={onClose}>Close</Button>
      {:else}
        <Button variant="ghost" disabled={saving} onclick={onClose}>Cancel</Button>
        <Button disabled={saving} onclick={save}>
          {#if saving}<Spinner />{/if}
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create operator'}
        </Button>
      {/if}
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
