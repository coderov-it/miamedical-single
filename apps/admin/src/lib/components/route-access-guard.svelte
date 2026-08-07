<!--
  Renders the locked state *in place*, keeping the sidebar and topbar, rather
  than bouncing to the dashboard. A redirect reads as "that link was broken";
  an in-shell message reads as "this page is locked", which is the truth and
  lets the visitor go somewhere else without re-orienting.

  This replaces the two competing idioms the admin used to carry — some pages
  wrapped themselves in <PermissionGate>, others hand-rolled an {#if}.
-->
<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';
  import type { Snippet } from 'svelte';

  import { page } from '$app/state';

  import * as Empty from '$lib/components/ui/empty/index.js';
  import { permissionByCode } from '@mia/permissions';
  import { resolveRouteAccess } from '~/lib/route-access';
  import { session } from '~/lib/session.svelte';

  let { children }: { children: Snippet } = $props();

  const entry = $derived(resolveRouteAccess(page.url.pathname));
  const allowed = $derived(
    !entry || entry.requiredAny.length === 0 || entry.requiredAny.some((c) => session.can(c)),
  );

  // Naming the exact missing permission turns a dead end into something the
  // visitor can act on — they can ask for it by name.
  const missing = $derived(
    (entry?.requiredAny ?? [])
      .map((code) => permissionByCode(code)?.key)
      .filter((key): key is string => Boolean(key))
      .join(' or '),
  );
</script>

{#if allowed}
  {@render children()}
{:else}
  <Empty.Root class="mx-auto mt-16 max-w-md border bg-card">
    <Empty.Header>
      <Empty.Media variant="icon">
        <LockIcon />
      </Empty.Media>
      <Empty.Title>This page is locked</Empty.Title>
      <Empty.Description>
        {#if missing}
          You need <code class="font-mono">{missing}</code> to open it. Ask an administrator to grant
          it.
        {:else}
          You do not have access to this page.
        {/if}
      </Empty.Description>
    </Empty.Header>
  </Empty.Root>
{/if}
