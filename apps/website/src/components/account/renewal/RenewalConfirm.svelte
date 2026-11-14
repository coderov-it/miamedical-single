<!--
  Renewal step 3 — check, then place. Laid out like the checkout's confirm step
  (components/checkout/CheckoutConfirm.astro): review tiles, the payment note,
  one button.

  "Pay and Confirm" places the renewal, already signed, then sends the
  customer to the payment gateway; paying makes it active
  (docs/code/online-payments.md). If the gateway cannot be opened, the modal
  closes on the placed renewal and its card offers "Pay now".

    "Pay and Confirm"      POST /api/customer/rental-extensions/:number
                           { days, contractSignature }
                           → POST /api/customer/payments/orders/:number → the gateway
    422 on the signature   → onrejected('contract'): step 2, box cleared
    422 on the length      → onrejected('days'): step 1
    anything else          → said above the button, nothing moves
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';
  import { API_BASE } from '~/lib/api-base';
  import { ApiError, formatDate, formatMoney } from '~/lib/customer-session';
  import { fill } from '~/scripts/account/copy';
  import { goToPayment, payOrder } from '~/scripts/payment/client';
  import type { ExtensionOverview } from '~/lib/rental-extension';
  import { placeRenewal } from '~/lib/rental-extension';

  import { EYEBROW } from '../../checkout/styles';
  import { NOTICE_ERROR, SPINNER } from '../fields';
  import { STEP_CTA } from './styles';

  type Option = ExtensionOverview['options'][number];

  interface Props {
    number: string;
    option: Option | null;
    currency: string;
    signatureDataUrl: string | null;
    onplaced: () => void;
    onrejected: (step: 'days' | 'contract', message: string) => void;
  }

  const { number, option, currency, signatureDataUrl, onplaced, onrejected }: Props = $props();

  const { copy, session } = accountContext();

  let failure = $state<string | null>(null);
  let busy = $state(false);

  async function place() {
    /* Re-entry guard, NOT a `disabled` — see fields.ts. */
    if (busy || !option || !signatureDataUrl) return;
    busy = true;
    failure = null;
    try {
      await placeRenewal(number, option.days, signatureDataUrl);
    } catch (error) {
      busy = false;
      if (session.escalate(error)) return;
      const message = errorMessage(error, say(copy, 'account.genericError'));
      if (error instanceof ApiError && error.fields.contractSignature) {
        onrejected('contract', say(copy, 'contract.signError'));
        return;
      }
      if (error instanceof ApiError && error.fields.days) {
        onrejected('days', message);
        return;
      }
      failure = message;
      return;
    }
    try {
      goToPayment(await payOrder(API_BASE, number), copy.routes.paymentResult);
    } catch {
      /* Placed and signed, not yet paid: the card's "Pay now" takes it from here. */
      busy = false;
      onplaced();
    }
  }

  const REVIEW_CARD =
    'flex flex-col gap-1.5 rounded-xl border border-hair px-4 py-3 text-[13.5px] text-ink-2';
</script>

{#if option}
  <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
    <div class={REVIEW_CARD}>
      <div class={`${EYEBROW} mb-1`}>{say(copy, 'account.renewal.period')}</div>
      <strong class="text-ink text-[15px] tabular-nums">
        {formatDate(option.fromDate)} → {formatDate(option.toDate)}
      </strong>
      <span>{option.label}</span>
    </div>
    <div class={REVIEW_CARD}>
      <div class={`${EYEBROW} mb-1`}>{say(copy, 'checkoutContract.document')}</div>
      <strong class="text-ok text-[15px]">✓ {say(copy, 'checkoutContract.signed')}</strong>
    </div>
  </div>
{/if}

<div class="bg-tint flex items-center gap-3 rounded-xl px-4 py-3">
  <span class="bg-tint-2 grid size-9 flex-none place-items-center rounded-full text-accent">
    <svg
      class="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="5" width="19" height="14" rx="2"></rect>
      <path d="M2.5 10h19M6.5 15h4"></path>
    </svg>
  </span>
  <span class="flex flex-col gap-0.5">
    <strong class="text-[14.5px]">{say(copy, 'account.renewal.payment')}</strong>
    <span class="text-ink-2 text-[14px] leading-normal">
      {fill(say(copy, 'account.renewal.paymentOnline'), {
        amount: formatMoney(option?.amount ?? '0', currency),
      })}
    </span>
  </span>
</div>

{#if failure}
  <p class={NOTICE_ERROR} role="alert">{failure}</p>
{/if}

<button class={STEP_CTA} type="button" aria-busy={busy} onclick={place}>
  <span class={SPINNER} aria-hidden="true"></span>
  {say(copy, 'payAndConfirm')}
</button>
