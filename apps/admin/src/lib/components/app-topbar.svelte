<!--
  Sticky page band: sidebar toggle, breadcrumb, then the two controls that are
  genuinely global — the *interface* language and the theme.

  The dropdown is the UI language: what the admin presents in (list names,
  and eventually the chrome itself). Which language a form *edits* is not
  global — each bilingual editor carries its own IT/EN tabs — so nothing up
  here can silently re-target inputs on a screen you are not looking at.
-->
<script lang="ts">
  import LanguagesIcon from '@lucide/svelte/icons/languages';
  import MoonIcon from '@lucide/svelte/icons/moon';
  import SunIcon from '@lucide/svelte/icons/sun';
  import { toggleMode } from 'mode-watcher';

  import { page } from '$app/state';

  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { navTitleFor } from '~/lib/nav';
  import { routes } from '~/lib/routes';
  import { UI_LANGUAGES, uiLang, type UiLanguage } from '~/lib/ui-lang.svelte';

  const sectionTitle = $derived(navTitleFor(page.url.pathname));
</script>

<!--
  `bg-sidebar`, opaque, so the topbar is literally the same colour as the
  sidebar it sits beside — `bg-card/90` composited over the canvas behind it,
  which landed a shade off white and showed as a seam at the corner where the
  two meet. Opaque is what makes them identical; a translucent bar takes a tint
  from whatever is under it.
-->
<header class="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-sidebar px-4">
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
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        class={buttonVariants({ variant: 'ghost', size: 'sm' })}
        aria-label="Interface language"
      >
        <LanguagesIcon class="size-4" />
        <span class="text-xs font-medium uppercase">{uiLang.current}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Label>Interface language</DropdownMenu.Label>
        <DropdownMenu.RadioGroup
          value={uiLang.current}
          onValueChange={(value) => uiLang.set(value as UiLanguage)}
        >
          {#each UI_LANGUAGES as language (language.code)}
            <DropdownMenu.RadioItem value={language.code}>
              {language.label}
            </DropdownMenu.RadioItem>
          {/each}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <Button onclick={toggleMode} variant="ghost" size="icon" class="size-8">
      <SunIcon class="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonIcon
        class="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
      />
      <span class="sr-only">Toggle theme</span>
    </Button>
  </div>
</header>
