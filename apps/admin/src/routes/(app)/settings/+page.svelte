<!--
  Platform settings, one panel per area: General (alert recipients) and Database
  (backup log, download, manual backup). A sub-sidebar of real links switches
  between them; the panel lives in `?tab=`, so a reload or a shared link lands
  on the same one.

  The page is a shim; each panel is a component in `~/lib/settings`.
-->
<script lang="ts">
  import { page } from '$app/state';
  import { P } from '@mia/permissions';
  import DatabaseIcon from '@lucide/svelte/icons/database';
  import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';

  import { DatabaseTab, GeneralTab } from '~/lib/settings';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';

  const canSeeDatabase = $derived(session.can(P.BACKUP_READ));
  const activeTab = $derived(
    page.url.searchParams.get('tab') === 'database' && canSeeDatabase ? 'database' : 'general',
  );

  const linkBase = 'flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap';
  const linkActive = 'bg-sidebar-accent font-medium text-sidebar-accent-foreground';
  const linkIdle = 'text-muted-foreground hover:bg-accent/50 hover:text-foreground';
</script>

<section class="admin-page">
  <div class="mx-auto w-full max-w-6xl">
    <!-- The sub-sidebar's divider runs from the topbar (h-14) to the screen's bottom edge:
         -my-6 cancels the layout's py-6, and both columns put that padding back inside. -->
    <div class="flex flex-col gap-6 md:-my-6 md:min-h-[calc(100svh-3.5rem)] md:flex-row">
      <nav
        aria-label={t('nav.settings')}
        class="md:relative md:w-52 md:shrink-0 md:border-r md:bg-[color-mix(in_oklch,var(--sidebar)_30%,var(--background))] md:pt-6 md:pr-4 md:before:absolute md:before:inset-y-0 md:before:right-full md:before:w-screen md:before:bg-[color-mix(in_oklch,var(--sidebar)_30%,var(--background))] md:before:content-['']"
      >
        <div class="flex gap-1 overflow-x-auto md:flex-col">
          <a
            href="?tab=general"
            class={[linkBase, activeTab === 'general' ? linkActive : linkIdle]}
            aria-current={activeTab === 'general' ? 'page' : undefined}
          >
            <SlidersHorizontalIcon class="size-4" />{t('settings.tabGeneral')}
          </a>
          {#if canSeeDatabase}
            <a
              href="?tab=database"
              class={[linkBase, activeTab === 'database' ? linkActive : linkIdle]}
              aria-current={activeTab === 'database' ? 'page' : undefined}
            >
              <DatabaseIcon class="size-4" />{t('settings.tabDatabase')}
            </a>
          {/if}
        </div>
      </nav>
      <div class="min-w-0 flex-1 md:py-6">
        {#if activeTab === 'database'}
          <DatabaseTab />
        {:else}
          <GeneralTab />
        {/if}
      </div>
    </div>
  </div>
</section>
