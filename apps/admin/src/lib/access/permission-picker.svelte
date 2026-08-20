<!--
  The grant surface: a checkbox per permission, grouped, plus the sets that
  cover a whole job at once.

  Everything visible here is a string — the label, and the `order:update` key
  under it. Everything bound is a number: `codes` is the `int[]` that lands in
  `admin_users.permissions` and is compared as integers by every guard. The two
  never meet, which is the point of the catalog.
-->
<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import {
    PERMISSION_BUNDLES,
    PERMISSION_LIST,
    bundleCoverage,
    permissionsByGroup,
    type PermissionBundle,
  } from '@mia/permissions';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import InfoHint from '~/lib/components/info-hint.svelte';

  interface Props {
    codes: number[];
    isSuperuser: boolean;
    /** No `admin:permission_assign` — the whole picker is a read-only summary. */
    readOnly?: boolean;
    /** Why it is read-only, when it is. One sentence, shown above the groups. */
    readOnlyReason?: string;
    /** False for a code the operator does not hold: the server would refuse it. */
    grantable?: (code: number) => boolean;
    /** Only a superuser may hand out the flag that has no code. */
    canGrantSuperuser?: boolean;
  }

  let {
    codes = $bindable(),
    isSuperuser = $bindable(),
    readOnly = false,
    readOnlyReason,
    grantable = () => true,
    canGrantSuperuser = false,
  }: Props = $props();

  const groups = permissionsByGroup();
  const total = PERMISSION_LIST.length;

  const held = $derived(new Set(codes));
  // The flag makes the boxes inert rather than wrong — see the note under the
  // switch — so they stay readable and stop being editable.
  const frozen = $derived(readOnly || isSuperuser);
  const lockedCount = $derived(PERMISSION_LIST.filter((p) => !grantable(p.code)).length);

  function set(next: Iterable<number>) {
    codes = [...new Set(next)].sort((a, b) => a - b);
  }

  function toggle(code: number) {
    const next = new Set(codes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    set(next);
  }

  /** Applies a whole set, or clears it when it is already fully held. */
  function toggleBundle(bundle: PermissionBundle) {
    const next = new Set(codes);
    const remove = bundleCoverage(bundle, codes) === 'full';
    for (const code of bundle.codes) {
      if (remove) next.delete(code);
      else if (grantable(code)) next.add(code);
    }
    set(next);
  }

  function toggleGroup(groupCodes: readonly number[], select: boolean) {
    const next = new Set(codes);
    for (const code of groupCodes) {
      if (select) {
        if (grantable(code)) next.add(code);
      } else {
        next.delete(code);
      }
    }
    set(next);
  }
</script>

<div class="space-y-4">
  <!-- The one attribute that is not a code, so it gets its own well. -->
  <div class="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
    <Switch
      id="access-superuser"
      checked={isSuperuser}
      disabled={readOnly || !canGrantSuperuser}
      onCheckedChange={(checked) => (isSuperuser = checked)}
    />
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5">
        <Label for="access-superuser">Superuser</Label>
        <InfoHint label="About superuser">
          A superuser passes every check, including permissions added to the panel later — which is
          why granting the whole list by hand is not the same thing. There must always be at least
          one, or nobody can grant access again.
        </InfoHint>
      </div>
      <p class="mt-0.5 text-xs text-muted-foreground">
        {#if isSuperuser}
          Holds everything, now and in future. The selection below is kept but not consulted.
        {:else if canGrantSuperuser}
          Off — access is exactly the permissions selected below.
        {:else}
          Only a superuser can hand this out.
        {/if}
      </p>
    </div>
  </div>

  {#if readOnlyReason && readOnly}
    <p class="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{readOnlyReason}</p>
  {/if}

  {#if !readOnly}
    <div>
      <div class="mb-2 flex items-center gap-1.5">
        <span class="text-sm font-medium">Sets</span>
        <InfoHint label="About permission sets">
          A set is a shortcut, not a role: clicking it copies its permissions into the selection and
          is then forgotten. Nothing at runtime resolves a set, so editing one later never changes
          what an existing account can reach.
        </InfoHint>
      </div>
      <div class="flex flex-wrap gap-2">
        {#each PERMISSION_BUNDLES as bundle (bundle.key)}
          {@const coverage = bundleCoverage(bundle, codes)}
          <Button
            type="button"
            variant={coverage === 'full' ? 'secondary' : 'outline'}
            size="sm"
            disabled={frozen}
            title={bundle.description}
            onclick={() => toggleBundle(bundle)}
          >
            {#if coverage === 'full'}<CheckIcon />{/if}
            {bundle.label}
            <span class="text-muted-foreground">
              {coverage === 'partial' ? 'part' : bundle.codes.length}
            </span>
          </Button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="flex items-center justify-between gap-3 border-t pt-3">
    <p class="text-sm font-medium tabular-nums">
      {codes.length} of {total} permissions
    </p>
    {#if !frozen && codes.length > 0}
      <Button type="button" variant="ghost" size="sm" onclick={() => set([])}>Clear all</Button>
    {/if}
  </div>

  {#if lockedCount > 0 && !readOnly}
    <p class="text-xs text-muted-foreground">
      {lockedCount} permissions are dimmed: you cannot grant access you do not hold yourself.
    </p>
  {/if}

  <div class="grid gap-3 md:grid-cols-2" class:opacity-60={isSuperuser}>
    {#each groups as group (group.group)}
      {@const groupCodes = group.permissions.map((p) => p.code)}
      {@const selected = groupCodes.filter((code) => held.has(code)).length}
      <div class="rounded-lg border">
        <div class="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
          <span class="text-sm font-medium">{group.group}</span>
          <span class="text-xs text-muted-foreground tabular-nums">
            {selected}/{groupCodes.length}
          </span>
          {#if !frozen}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="ml-auto h-7 px-2 text-xs"
              onclick={() => toggleGroup(groupCodes, selected < groupCodes.length)}
            >
              {selected < groupCodes.length ? 'Select all' : 'Clear'}
            </Button>
          {/if}
        </div>

        <div class="p-1.5">
          {#each group.permissions as permission (permission.code)}
            {@const locked = frozen || !grantable(permission.code)}
            <Label
              class="flex items-start gap-2.5 rounded-md px-1.5 py-1.5 font-normal {locked
                ? 'opacity-55'
                : 'cursor-pointer hover:bg-muted/60'}"
            >
              <Checkbox
                class="mt-0.5"
                checked={held.has(permission.code)}
                disabled={locked}
                onCheckedChange={() => toggle(permission.code)}
              />
              <span class="min-w-0 flex-1">
                <span class="block text-sm leading-tight">{permission.label}</span>
                <code class="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                  {permission.key}
                </code>
              </span>
            </Label>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
