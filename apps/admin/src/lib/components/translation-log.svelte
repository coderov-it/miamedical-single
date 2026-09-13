<!--
  The run log. A checklist, not a console: each language gets one line that
  appears while its request is in flight and is then rewritten in place, so the
  operator watches "Translating details to English…" turn into "English — 5 of 5
  fields translated" rather than watching two lines about the same language.

  The animation is doing work rather than decoration. A run over three languages
  can take several seconds, and a screen that changes nothing in that time reads
  as broken; a line arriving, a spinner turning and a progress bar filling are
  what distinguish "working" from "stuck".

  `aria-live="polite"` so the same news reaches a screen reader, which cannot
  see a line slide in.
-->
<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import { cn } from '$lib/utils.js';
  import type { TranslationLogLine } from '~/lib/i18n';
  import { Spinner } from '$lib/components/ui/spinner/index.js';

  interface Props {
    lines: TranslationLogLine[];
    /** Shown as a bar above the list; below 100 while a run is in flight. */
    progress?: number;
  }

  let { lines, progress }: Props = $props();

  let viewport = $state<HTMLDivElement | null>(null);

  // Follow the tail as lines arrive. Reading `lines.length` first is what makes
  // this the dependency — the effect has to re-run for an append, not for any
  // change to the array.
  $effect(() => {
    void lines.length;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  });
</script>

<div class="flex min-h-32 flex-col overflow-hidden rounded-lg border bg-muted/30">
  {#if progress !== undefined}
    <div class="h-0.5 w-full bg-muted">
      <div
        class="h-full bg-primary transition-[width] duration-500 ease-out"
        style="width: {Math.min(100, Math.max(0, progress))}%"
      ></div>
    </div>
  {/if}

  <div
    bind:this={viewport}
    class="max-h-56 flex-1 space-y-1.5 overflow-y-auto p-3 font-mono text-xs"
    aria-live="polite"
  >
    {#each lines as line (line.id)}
      <p
        class="flex animate-in items-start gap-2 duration-300 fade-in-0 slide-in-from-bottom-2"
        class:text-muted-foreground={line.tone === 'skipped'}
        class:text-amber-600={line.tone === 'error'}
        class:dark:text-amber-400={line.tone === 'error'}
      >
        {#if line.tone === 'pending'}
          <Spinner class="mt-0.5 size-3 shrink-0" />
        {:else if line.tone === 'done'}
          <CheckIcon class="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        {:else if line.tone === 'error'}
          <CircleAlertIcon class="mt-0.5 size-3.5 shrink-0" />
        {:else}
          <MinusIcon class="mt-0.5 size-3.5 shrink-0" />
        {/if}
        <span class={cn('min-w-0 break-words', line.tone === 'pending' && 'text-foreground')}>
          {line.text}
        </span>
      </p>
    {/each}
  </div>
</div>
