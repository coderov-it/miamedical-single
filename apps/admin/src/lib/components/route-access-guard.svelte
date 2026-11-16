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
  import { permissionLabelByCode } from '~/lib/access/permission-labels';
  import { resolveRouteAccess } from '~/lib/route-access';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';
  import { languageOf } from '~/lib/i18n/languages';
  import { uiLang } from '~/lib/ui-lang.svelte';

  let { children }: { children: Snippet } = $props();

  const entry = $derived(resolveRouteAccess(page.url.pathname));
  const allowed = $derived(
    !entry || entry.requiredAny.length === 0 || entry.requiredAny.some((c) => session.can(c)),
  );

  // Naming the exact missing permission turns a dead end into something the
  // visitor can act on — they can ask for it by name.
  const missing = $derived(
    (entry?.requiredAny ?? [])
      .map((code) => permissionLabelByCode(code))
      .filter((label): label is string => Boolean(label))
      .map((label) => t('shell.quoted', { text: label })),
  );
  const missingList = $derived(
    new Intl.ListFormat(languageOf(uiLang.current).tag, { type: 'disjunction' }).format(missing),
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
      <Empty.Title>{t('shell.lockedTitle')}</Empty.Title>
      <Empty.Description>
        {#if missing.length > 0}
          {t('shell.lockedNeeds', { permission: missingList })}
        {:else}
          {t('shell.lockedNoAccess')}
        {/if}
      </Empty.Description>
    </Empty.Header>
  </Empty.Root>
{/if}
