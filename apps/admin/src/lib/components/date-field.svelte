<!--
  A date typed day-first (25/11/2026), whatever the browser's own locale is: a
  native `type=date` shows mm/dd/yyyy on an English browser. Typing auto-inserts
  the slashes; the calendar button opens the native picker for those who prefer
  clicking. `value` is the ISO `YYYY-MM-DD` the API takes, or '' while incomplete.
-->
<script lang="ts">
  import CalendarIcon from '@lucide/svelte/icons/calendar';

  import { Input } from '$lib/components/ui/input/index.js';
  import { t } from '~/lib/ui-text';

  interface Props {
    id?: string;
    value: string;
    /** Earliest ISO date the picker offers. */
    min?: string;
    invalid?: boolean;
    onChange?: () => void;
  }

  let { id, value = $bindable(), min, invalid = false, onChange }: Props = $props();

  const toText = (iso: string): string => {
    const [y, m, d] = iso.split('-');
    return y && m && d ? `${d}/${m}/${y}` : '';
  };

  let text = $state(toText(value));
  let picker = $state<HTMLInputElement | null>(null);

  /** A complete, real calendar date as ISO; '' otherwise. */
  function toIso(raw: string): string {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
    if (!match) return '';
    const [, d, m, y] = match;
    const date = new Date(`${y}-${m}-${d}T00:00:00Z`);
    const real = !Number.isNaN(date.getTime()) && date.toISOString().startsWith(`${y}-${m}-${d}`);
    return real ? `${y}-${m}-${d}` : '';
  }

  function onType(event: Event & { currentTarget: HTMLInputElement }) {
    const digits = event.currentTarget.value.replace(/\D/g, '').slice(0, 8);
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean);
    text = parts.join('/');
    value = toIso(text);
    onChange?.();
  }

  function onPick(event: Event & { currentTarget: HTMLInputElement }) {
    value = event.currentTarget.value;
    text = toText(value);
    onChange?.();
  }
</script>

<div class="relative">
  <Input
    {id}
    inputmode="numeric"
    autocomplete="off"
    placeholder={t('newOrder.datePlaceholder')}
    class="pr-10"
    value={text}
    oninput={onType}
    aria-invalid={invalid ? 'true' : undefined}
  />
  <button
    type="button"
    class="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
    aria-label={t('newOrder.openCalendar')}
    onclick={() => picker?.showPicker()}
  >
    <CalendarIcon class="size-4" />
  </button>
  <input
    bind:this={picker}
    type="date"
    {min}
    {value}
    onchange={onPick}
    tabindex="-1"
    aria-hidden="true"
    class="pointer-events-none absolute right-2 bottom-0 size-0 opacity-0"
  />
</div>
