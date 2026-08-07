<!--
  The one language switcher a bilingual editor puts at its top: tab-style
  IT/EN wired to that editor's own ContentLang. One control per form instead
  of one per field — the fields only *report* translation debt (the
  "EN missing" chip), they no longer switch.

  Styled to sit flush on a `border-b` strip, matching the product tab bar.
-->
<script lang="ts">
  import { cn } from '$lib/utils.js';
  import type { ContentLang } from '~/lib/content-lang.svelte';

  interface Props {
    lang: ContentLang;
    /** Marks the English tab with an amber dot — translation debt at a glance. */
    enMissing?: boolean;
    class?: string;
  }

  let { lang, enMissing = false, class: className }: Props = $props();

  const TABS = [
    { code: 'it', label: 'Italiano' },
    { code: 'en', label: 'English' },
  ] as const;
</script>

<div class={cn('flex items-center', className)} role="group" aria-label="Content language">
  {#each TABS as tab (tab.code)}
    {@const active = lang.current === tab.code}
    <button
      type="button"
      onclick={() => lang.set(tab.code)}
      aria-pressed={active}
      class={cn(
        'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors',
        active
          ? 'border-primary font-medium text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {tab.label}
      {#if tab.code === 'en' && enMissing}
        <span
          class="size-1.5 rounded-full bg-amber-500"
          title="English translation incomplete"
        ></span>
      {/if}
    </button>
  {/each}
</div>
