<!--
  The renewal modal's summary — the checkout overview's card
  (components/checkout/CheckoutOverview.astro), beside the steps and sticky from
  `wide` up. It follows the length chosen in step 1, so the price is on screen
  before anything is signed, and ticks the contract once step 2 is done.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { formatDate, formatMoney } from '~/lib/customer-session';
  import type { ExtensionOverview } from '~/lib/rental-extension';

  import { EYEBROW, LINE_AMOUNT, LINE_LABEL, LINE_ROW } from '../../checkout/styles';

  type Option = ExtensionOverview['options'][number];

  interface Props {
    currency: string;
    endDate: string | null;
    option: Option | null;
    signed: boolean;
  }

  const { currency, endDate, option, signed }: Props = $props();

  const { copy } = accountContext();
</script>

<aside
  class="border-hair shadow-pdp-panel wide:sticky wide:top-4 flex max-w-90 min-w-0 flex-[1_1_300px] flex-col gap-3 rounded-2xl border bg-white p-5"
  aria-labelledby="renewal-overview-title"
  aria-live="polite"
>
  <h2 class={EYEBROW} id="renewal-overview-title">{say(copy, 'account.renewal.summary')}</h2>

  <dl class="bg-tint flex flex-col gap-1.5 rounded-[11px] px-3.5 py-3 text-[13.5px]">
    {#if endDate}
      <div class={LINE_ROW}>
        <dt class={LINE_LABEL}>{say(copy, 'account.renewal.currentEnd')}</dt>
        <dd class={LINE_AMOUNT}>{formatDate(endDate)}</dd>
      </div>
    {/if}
    {#if option}
      <div class={LINE_ROW}>
        <dt class={LINE_LABEL}>{say(copy, 'account.renewal.stepDuration')}</dt>
        <dd class={LINE_AMOUNT}>{option.label}</dd>
      </div>
      <div class={LINE_ROW}>
        <dt class={LINE_LABEL}>{say(copy, 'account.renewal.newEnd')}</dt>
        <dd class={LINE_AMOUNT + ' text-accent'}>{formatDate(option.toDate)}</dd>
      </div>
      <div class={LINE_ROW}>
        <dt class={LINE_LABEL}>{say(copy, 'checkoutContract.document')}</dt>
        <dd class={[LINE_AMOUNT, signed && 'text-ok']}>
          {signed ? `✓ ${say(copy, 'checkoutContract.signed')}` : '—'}
        </dd>
      </div>
    {/if}
  </dl>

  {#if option}
    <div class="border-hair flex items-baseline justify-between gap-3 border-t pt-3">
      <span class="text-[15px] font-semibold">{say(copy, 'total')}</span>
      <span class="text-[20px] font-bold tabular-nums">{formatMoney(option.amount, currency)}</span>
    </div>
  {:else}
    <p class="text-ink-2 text-[14px]">{say(copy, 'account.renewal.pickToSee')}</p>
  {/if}
</aside>
