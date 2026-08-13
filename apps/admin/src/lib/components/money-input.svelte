<!--
  A labelled money field. Emits a normalised `"0.00"` string, never a JS number —
  money stays a decimal string end to end, the same way it is stored and sent.

  The parsing rules live in `~/lib/money.ts` so any other control that has to read
  an amount back shares them rather than restating them.

  `dense` and `hideLabel` are opt-in and off by default, so one screen can ask for
  a compact field without shrinking every form in the admin.
-->
<script lang="ts">
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { parseMoney, toMoneyText } from '~/lib/money.ts';

  interface Props {
    label: string;
    value: string;
    error?: string | undefined;
    hint?: string | undefined;
    allowNegative?: boolean;
    /** Usually the currency code — rendered beside the field, not inside it. */
    suffix?: string;
    disabled?: boolean;
    id?: string;
    /**
     * Opt-in: shorter field for a dense panel. Off everywhere by default — this
     * exists so one screen can be compact without shrinking every form.
     */
    dense?: boolean;
    /** Opt-in: keep the label for screen readers only, where context supplies it. */
    hideLabel?: boolean;
  }

  let {
    label,
    value = $bindable(),
    error,
    hint,
    allowNegative = false,
    suffix = '',
    disabled = false,
    id,
    dense = false,
    hideLabel = false,
  }: Props = $props();

  const generatedId = $props.id();
  const fieldId = $derived(id ?? generatedId);

  let text = $state(toMoneyText(value));
  let lastNormalized = value;

  // Reflect external changes (loading a product) without fighting live typing.
  $effect(() => {
    if (value !== lastNormalized) {
      lastNormalized = value;
      text = toMoneyText(value);
    }
  });

  /**
   * Normalising on blur rather than per keystroke: rewriting "1" to "1.00" while
   * someone is still typing "1.5" makes the field feel possessed.
   */
  function normalize() {
    const parsed = parseMoney(text, { allowNegative });

    // Unparseable input reverts to the last good value rather than becoming NaN
    // or an empty string the server would reject.
    if (parsed === null) {
      text = toMoneyText(value);
      return;
    }

    value = parsed;
    lastNormalized = parsed;
    text = toMoneyText(parsed);
  }
</script>

<div>
  <Label class={hideLabel ? 'sr-only' : 'mb-1.5'} for={fieldId}>{label}</Label>
  <div class="flex items-center gap-2">
    <Input
      id={fieldId}
      type="text"
      inputmode="decimal"
      bind:value={text}
      onblur={normalize}
      {disabled}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error ? `${fieldId}-error` : undefined}
      class={dense ? 'h-8 w-24 text-right text-sm tabular-nums' : 'w-36 text-right tabular-nums'}
    />
    {#if suffix}<span class="text-sm text-muted-foreground">{suffix}</span>{/if}
  </div>
  {#if error}
    <p id="{fieldId}-error" class="mt-1 text-xs text-destructive" role="alert">{error}</p>
  {:else if hint}
    <p class="mt-1 text-xs text-muted-foreground">{hint}</p>
  {/if}
</div>
