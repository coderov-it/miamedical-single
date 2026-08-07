<script lang="ts">
  /**
   * Emits a normalised `"0.00"` string, never a JS number — money stays a
   * decimal string end to end. Accepts both `,` and `.` as the decimal
   * separator, since the admins are Italian.
   */
  let {
    label,
    value = $bindable(),
    error,
    allowNegative = false,
    suffix = '',
  }: {
    label: string;
    value: string;
    error?: string | undefined;
    allowNegative?: boolean;
    suffix?: string;
  } = $props();

  let text = $state(value.replace('.', ','));
  let lastNormalized = value;

  // Reflect external changes (loading a product) without fighting typing.
  $effect(() => {
    if (value !== lastNormalized) {
      lastNormalized = value;
      text = value.replace('.', ',');
    }
  });

  function normalize() {
    const raw = text.trim().replace(',', '.');
    const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(raw);
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

<label class="block">
  <span class="mb-1 block text-sm font-medium">{label}</span>
  <span class="flex items-center gap-2">
    <input
      type="text"
      inputmode="decimal"
      bind:value={text}
      onblur={normalize}
      class="focus:border-brand-500 w-32 rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm tabular-nums dark:border-neutral-700 dark:bg-neutral-900"
      class:border-red-400={Boolean(error)}
    />
    {#if suffix}<span class="text-sm text-neutral-500">{suffix}</span>{/if}
  </span>
  {#if error}
    <span class="mt-1 block text-xs text-red-600" role="alert">{error}</span>
  {/if}
</label>
