<!--
  [ − | 12 | + ] — a whole-number field joined to its two buttons.

  A bare `type="number"` leaves the browser's spinner arrows, which are two
  4-pixel targets stacked on top of each other and unusable on a touchpad. This
  is the same control the storefront's quantity stepper is, in the admin's own
  idiom: real buttons at the row's height, the native spinners suppressed, and
  the field still typeable for jumping to 40 without pressing + forty times.

  Whole numbers only. Money has `money-input.svelte`, which normalises decimals
  and emits a string — this one emits a `number` and would round the cents off.
-->
<script lang="ts">
  import MinusIcon from '@lucide/svelte/icons/minus';
  import PlusIcon from '@lucide/svelte/icons/plus';

  import { Input } from '$lib/components/ui/input/index.js';
  import { cn } from '$lib/utils.js';

  interface Props {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    id?: string;
    /** Names the field for screen readers — "Stock for MIA-LTE-GRI-CS-5VC6". */
    label: string;
    /** Widens the number field where the values run long. */
    class?: string;
  }

  let {
    value = $bindable(),
    min = 0,
    max,
    step = 1,
    disabled = false,
    id,
    label,
    class: className,
  }: Props = $props();

  const clamp = (n: number): number => {
    const bounded = Math.max(min, max === undefined ? n : Math.min(max, n));
    return Number.isFinite(bounded) ? Math.round(bounded) : min;
  };

  const nudge = (by: number) => {
    value = clamp((Number(value) || 0) + by);
  };

  /** Typing is left alone until blur — rewriting "1" to "10" mid-keystroke fights the user. */
  const normalize = () => {
    value = clamp(Number(value));
  };

  const atMin = $derived(Number(value) <= min);
  const atMax = $derived(max !== undefined && Number(value) >= max);

  // One joined group: [ − | 12 | + ]. Input height, stretches to the column.
  const button =
    'grid h-10 w-16 shrink-0 place-items-center bg-muted text-muted-foreground hover:text-foreground transition-colors ' +
    'hover:bg-accent outline-none ' +
    'disabled:pointer-events-none disabled:opacity-40';
</script>

<div class="flex w-full items-stretch overflow-hidden rounded-lg border border-input transition-colors">
  <button
    type="button"
    class={button}
    onclick={() => nudge(-step)}
    disabled={disabled || atMin}
    aria-label="Decrease {label}"
  >
    <MinusIcon class="size-5" />
  </button>

  <Input
    {id}
    type="number"
    inputmode="numeric"
    {min}
    {max}
    {step}
    {disabled}
    bind:value
    onblur={normalize}
    aria-label={label}
    class={cn(
      'h-10 min-w-0 flex-1 rounded-none border-0 border-x border-input bg-background text-center text-base font-medium tabular-nums shadow-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30',
      '[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
      className,
    )}
  />

  <button
    type="button"
    class={button}
    onclick={() => nudge(step)}
    disabled={disabled || atMax}
    aria-label="Increase {label}"
  >
    <PlusIcon class="size-5" />
  </button>
</div>
