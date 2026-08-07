<!--
  Emits a normalised `"0.00"` string, never a JS number — money stays a decimal
  string end to end, the same way it is stored and sent.

  Accepts both `,` and `.` as the decimal separator, because the operators are
  Italian and their keyboards produce a comma.
-->
<script lang="ts">
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';

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
  }: Props = $props();

  const generatedId = $props.id();
  const fieldId = $derived(id ?? generatedId);

  let text = $state(value.replace('.', ','));
  let lastNormalized = value;

  // Reflect external changes (loading a product) without fighting live typing.
  $effect(() => {
    if (value !== lastNormalized) {
      lastNormalized = value;
      text = value.replace('.', ',');
    }
  });

  /**
   * Normalising on blur rather than per keystroke: rewriting "1" to "1.00"
   * while someone is still typing "1.5" makes the field feel possessed.
   */
  function normalize() {
    const raw = text.trim().replace(',', '.');
    const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(raw);

    // Unparseable input reverts to the last good value rather than becoming
    // NaN or an empty string the server would reject.
    if (!match || raw === '' || raw === '-') {
      text = value.replace('.', ',');
      return;
    }

    const sign = allowNegative && match[1] === '-' ? '-' : '';
    const whole = match[2] || '0';
    const cents = ((match[3] ?? '') + '00').slice(0, 2);
    const normalized = `${sign}${whole}.${cents}`;

    value = normalized;
    lastNormalized = normalized;
    text = normalized.replace('.', ',');
  }
</script>

<div>
  <Label class="mb-1.5" for={fieldId}>{label}</Label>
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
      class="w-36 text-right tabular-nums"
    />
    {#if suffix}<span class="text-sm text-muted-foreground">{suffix}</span>{/if}
  </div>
  {#if error}
    <p id="{fieldId}-error" class="mt-1 text-xs text-destructive" role="alert">{error}</p>
  {:else if hint}
    <p class="mt-1 text-xs text-muted-foreground">{hint}</p>
  {/if}
</div>
