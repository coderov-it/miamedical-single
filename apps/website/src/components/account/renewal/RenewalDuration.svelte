<!--
  Renewal step 1 — how long. One compact list, a length per line, the way the
  product page lists its packages: length and new end date on the left, price
  on the right. The radio is sr-only; the row is the control.

  The lengths are the ones every rented product sells as a day package, priced
  by the server (docs/code/rental-extensions.md § What is offered); the summary
  beside the steps follows the choice. "Continua" is live from the start: a
  click with nothing chosen marks the list, per the form gate.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { formatDate, formatMoney } from '~/lib/customer-session';
  import { formGate } from '~/lib/form-gate-action';
  import type { FieldGate, FormGate } from '~/lib/form-validation';
  import type { ExtensionOverview } from '~/lib/rental-extension';
  import { fill } from '~/scripts/account/copy';

  import FieldError from '../FieldError.svelte';
  import { ANNOUNCE } from '../fields';
  import { STEP_CTA } from './styles';

  interface Props {
    overview: ExtensionOverview;
    days: number | null;
    onnext: () => void;
  }

  let { overview, days = $bindable(), onnext }: Props = $props();

  const { copy } = accountContext();

  let radios = $state<HTMLInputElement[]>([]);
  let announceEl = $state<HTMLElement>();
  let gate: FormGate | undefined;

  const gates = (): FieldGate[] => [
    { key: 'days', isSatisfied: () => days !== null, controls: () => radios },
  ];

  function submit(event: SubmitEvent) {
    event.preventDefault();
    /* Not the banned silent return: `enforce()` has marked the list, focused it
       and announced why. */
    if (!gate?.enforce()) return;
    onnext();
  }

  /** One row of the list. Focus rings off the sr-only radio; a flagged list goes red. */
  const ROW =
    'flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2 transition ' +
    'peer-focus-visible:shadow-[inset_0_0_0_2px_var(--color-accent)] peer-aria-invalid:bg-danger-tint';
  const TICK =
    'grid size-4.5 flex-none place-items-center rounded-full border-2 text-[10px] font-bold';
</script>

<form
  class="flex flex-col gap-4"
  onsubmit={submit}
  use:formGate={{ gates, announce: () => announceEl ?? null, ready: (g) => (gate = g) }}
>
  <fieldset class="flex flex-col gap-2" data-gate="days">
    <legend class="mb-2 text-[14.5px] font-semibold">{say(copy, 'account.extension.pick')}</legend>
    <!-- One bordered list, rows split by hairlines — the product page's package
         list, not a card per length. -->
    <div class="border-hair divide-hair divide-y overflow-hidden rounded-xl border">
      {#each overview.options as option, index (option.days)}
        {@const picked = days === option.days}
        <label class="block">
          <input
            class="peer sr-only"
            type="radio"
            name="days"
            value={option.days}
            bind:group={days}
            bind:this={radios[index]}
          />
          <span class={[ROW, picked && 'bg-accent-tint', !picked && 'hover:bg-tint']}>
            <span
              class={[
                TICK,
                picked && 'border-accent bg-accent text-white',
                !picked && 'border-hair-strong text-transparent',
              ]}
              aria-hidden="true">✓</span
            >
            <span class="min-w-0 flex-1 text-[14.5px]">
              <strong class={picked ? 'text-accent' : ''}>{option.label}</strong>
              <span class="text-ink-2 text-[13px]">
                · {fill(say(copy, 'account.renewal.until'), { date: formatDate(option.toDate) })}
              </span>
            </span>
            <strong class="text-[14.5px] whitespace-nowrap tabular-nums">
              {formatMoney(option.amount, overview.currency)}
            </strong>
          </span>
        </label>
      {/each}
    </div>
    <FieldError key="days" message={say(copy, 'account.extension.pickError')} />
  </fieldset>

  <button class={STEP_CTA} type="submit">{say(copy, 'account.renewal.continue')}</button>

  <p
    class={ANNOUNCE}
    role="status"
    aria-live="polite"
    bind:this={announceEl}
    data-message-one={say(copy, 'errorCountOne')}
    data-message-many={say(copy, 'errorCountMany')}
  ></p>
</form>
