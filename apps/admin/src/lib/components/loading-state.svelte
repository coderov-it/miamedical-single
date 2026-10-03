<!--
  The one way the back office says "wait": a heartbeat trace running across a
  faint baseline, and a line that names WHAT is on its way ("Loading the
  rental…"). Same trace, timing and layouts as the storefront's
  `apps/website/src/components/primitives/LoadingState.svelte` — change one,
  change the other.

  Variants are the layout, chosen by how much is missing:
    block  — trace above text, both centred; a page, a dialog body, a whole list
    inline — trace beside text, centred as a pair; one card, one field, a row
  `framed` adds the card, for a block that has no surface of its own.

  Not for a control the operator just clicked: that feedback belongs on the
  control (BusyButton / BusyLabel), not on the page.
-->
<script lang="ts">
  import { cn } from '$lib/utils.js';

  interface Props {
    /** What is loading, as a sentence. Spoken once through `role="status"`. */
    label: string;
    variant?: 'block' | 'inline';
    framed?: boolean;
    class?: string;
  }

  const { label, variant = 'block', framed = false, class: className }: Props = $props();

  const LAYOUT = {
    block: 'min-h-48 flex-col gap-3 py-12',
    inline: 'gap-3 py-4',
  } as const;

  const block = $derived(variant === 'block');

  /* One ECG beat: flat, a small bump, the spike, the dip, flat again. */
  const BEAT = 'M2 16 H17 L20 13 L23 16 H26 L30 3 L35 29 L39 16 H62';
</script>

<div
  class={cn(
    'flex items-center justify-center text-center',
    LAYOUT[variant],
    framed && 'rounded-xl border bg-card px-8',
    className,
  )}
  role="status"
  aria-live="polite"
>
  <svg
    class={cn('flex-none', block ? 'h-12 w-24' : 'h-6 w-12')}
    viewBox="0 0 64 32"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width={block ? 2.5 : 3}
    aria-hidden="true"
  >
    <path class="stroke-primary/15 dark:stroke-primary/30" d={BEAT} />
    <path class="loading-pulse stroke-primary" d={BEAT} pathLength="100" />
  </svg>
  <span class={cn('text-muted-foreground', block ? 'text-sm font-medium' : 'text-sm')}>
    {label}
  </span>
</div>

<style>
  /* A 34-unit dash on a 134-unit period: it enters off the left end, crosses
     the whole beat, and leaves off the right before the next one starts. */
  .loading-pulse {
    stroke-dasharray: 34 100;
    animation: loading-run 1.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
  }

  @keyframes loading-run {
    from {
      stroke-dashoffset: 34;
    }
    to {
      stroke-dashoffset: -100;
    }
  }

  /* Reduced motion slows the trace rather than freezing it: a still line reads
     as "stuck", which is the one thing a loading state must not say. */
  @media (prefers-reduced-motion: reduce) {
    .loading-pulse {
      animation-duration: 4s;
    }
  }
</style>
