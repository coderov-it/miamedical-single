<!--
  The fee control, welded into its option row rather than floating inside it.

  It has no border, no radius and no background of its own: it fills the right-hand
  end of the row and is separated from the label only by divider lines, so the row
  reads as one control. A bordered box inside a bordered row looked like a
  different widget that had wandered in.

  Focus is deliberately NOT indicated here. The row carries the focus ring via
  `has-[input:focus-visible]`, so the highlight covers the whole control —
  including both buttons — instead of hugging the number.

  Parsing and stepping are in `~/lib/money.ts`, shared with `money-input.svelte`.
-->
<script lang="ts">
  import MinusIcon from '@lucide/svelte/icons/minus';
  import PlusIcon from '@lucide/svelte/icons/plus';

  import { isAtZero, parseMoney, stepMoney, toMoneyText } from '~/lib/money.ts';

  interface Props {
    /** A decimal string, always — `"35.00"`, never `35`. */
    value: string;
    /** How much one press moves it, in euro. */
    step?: number;
    /** Names the amount for screen readers; the row's label is visual only. */
    label: string;
    /** Read-only for a viewer without write access. */
    disabled?: boolean;
  }

  let { value = $bindable(), step = 1, label, disabled = false }: Props = $props();

  let text = $state(toMoneyText(value));
  let lastNormalized = value;

  // Follow the bound value when the selection changes under us, without fighting
  // live typing.
  $effect(() => {
    if (value !== lastNormalized) {
      lastNormalized = value;
      text = toMoneyText(value);
    }
  });

  /** Normalises on blur, not per keystroke — see money-input.svelte. */
  function commit(): string {
    const parsed = parseMoney(text);
    if (parsed === null) {
      text = toMoneyText(value);
      return value;
    }
    value = parsed;
    lastNormalized = parsed;
    text = toMoneyText(parsed);
    return parsed;
  }

  /** Folds a half-typed value in first, so "7,5" then + gives 8,50 and not 8,00. */
  function nudge(direction: 1 | -1) {
    const next = stepMoney(commit(), direction * step);
    value = next;
    lastNormalized = next;
    text = toMoneyText(next);
  }

  const atFloor = $derived(isAtZero(value));

  const BUTTON =
    'flex w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35';
</script>

<div class="flex items-stretch self-stretch border-l text-sm">
  <button
    type="button"
    class={BUTTON}
    onclick={() => nudge(-1)}
    disabled={atFloor || disabled}
    aria-label="Decrease {label}"
  >
    <MinusIcon class="size-3.5" />
  </button>

  <div class="flex items-center border-x px-1.5">
    <!-- No `type="number"`: it would fight the comma an Italian keyboard produces
         and add a second pair of spinners. -->
    <input
      type="text"
      inputmode="decimal"
      bind:value={text}
      onblur={commit}
      aria-label={label}
      readonly={disabled}
      class="w-11 bg-transparent text-right tabular-nums outline-none"
    />
    <span class="pl-1 text-muted-foreground">€</span>
  </div>

  <button
    type="button"
    class={BUTTON}
    onclick={() => nudge(1)}
    {disabled}
    aria-label="Increase {label}"
  >
    <PlusIcon class="size-3.5" />
  </button>
</div>
