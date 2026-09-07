<!--
  Per-language completeness for one record, compact enough for a table cell.

  Replaces the `EN complete` / `EN partial` / `EN missing` badge trio, which
  needed one badge per language and so grew a column per language.

  Reading it: every target language is listed, and its weight is its state.
    complete — normal ink, no decoration. Done is not news.
    partial  — amber. Someone started and stopped; no fallback can fix a
               record that serves a French title over Italian prose.
    missing  — faint. Nothing has been written, the storefront falls back
               cleanly, and this is a perfectly shippable state.

  The source language is never shown. It is mandatory, always present, and
  listing it would put a permanent green tick next to every row.
-->
<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { languageOf, type LanguageProgress } from '~/lib/i18n';

  interface Props {
    progress: LanguageProgress[];
    class?: string;
  }

  let { progress, class: className }: Props = $props();

  const targets = $derived(progress.filter((entry) => !entry.isSource));

  const TONE: Record<string, string> = {
    complete: 'text-foreground',
    partial: 'text-amber-600 dark:text-amber-400',
    missing: 'text-muted-foreground/45',
  };

  const WORD: Record<string, string> = {
    complete: 'translated',
    partial: 'partly translated',
    missing: 'not translated',
  };
</script>

{#if targets.length > 0}
  <span class={cn('inline-flex items-center gap-1.5 font-mono text-xs', className)}>
    {#each targets as entry (entry.code)}
      <span
        class={cn('uppercase', TONE[entry.state])}
        title="{languageOf(entry.code).label}: {WORD[entry.state]}"
      >
        {entry.code}
      </span>
    {/each}
  </span>
{/if}
