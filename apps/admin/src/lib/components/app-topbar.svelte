<!--
  Sticky page band: sidebar toggle, breadcrumb, then the two controls that are
  global rather than per-page — the IT/EN editing language and the theme.

  The language switch lives here because it changes what every Translated*
  field on the page is editing. It used to be copy-pasted into four separate
  screens, which meant four places to get out of step.
-->
<script lang="ts">
  import MoonIcon from '@lucide/svelte/icons/moon';
  import SunIcon from '@lucide/svelte/icons/sun';
  import { toggleMode } from 'mode-watcher';

  import { page } from '$app/state';

  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { editorLang } from '~/lib/editor-lang.svelte';
  import { navTitleFor } from '~/lib/nav';
  import { routes } from '~/lib/routes';

  const sectionTitle = $derived(navTitleFor(page.url.pathname));
</script>

<header
  class="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-card/90 px-4 backdrop-blur-md"
>
  <Sidebar.Trigger class="-ml-1.5 text-muted-foreground" />
  <Separator orientation="vertical" class="mr-1 h-4" />

  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item class="hidden sm:block">
        <Breadcrumb.Link href={routes.dashboard}>Admin</Breadcrumb.Link>
      </Breadcrumb.Item>
      {#if sectionTitle}
        <Breadcrumb.Separator class="hidden sm:block" />
        <Breadcrumb.Item>
          <Breadcrumb.Page>{sectionTitle}</Breadcrumb.Page>
        </Breadcrumb.Item>
      {/if}
    </Breadcrumb.List>
  </Breadcrumb.Root>

  <div class="ml-auto flex items-center gap-2">
    <div
      class="flex items-center rounded-md border p-0.5"
      role="group"
      aria-label="Editing language"
    >
      {#each ['it', 'en'] as const as lang (lang)}
        <button
          type="button"
          onclick={() => editorLang.set(lang)}
          aria-pressed={editorLang.current === lang}
          class="rounded-sm px-2 py-0.5 text-xs font-medium transition-colors
            {editorLang.current === lang
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'}"
        >
          {lang.toUpperCase()}
        </button>
      {/each}
    </div>

    <Button onclick={toggleMode} variant="ghost" size="icon" class="size-8">
      <SunIcon class="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonIcon
        class="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
      />
      <span class="sr-only">Toggle theme</span>
    </Button>
  </div>
</header>
