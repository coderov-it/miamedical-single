<!--
  The summary: what the cart comes to, what is still to be agreed, and the way on
  to the checkout.

  The submit button carries no form of its own — the container wraps BOTH columns in
  one `<form>`, so pressing it posts the hidden line fields rendered beside the rows.
-->
<script lang="ts">
  import type { CartCopy } from '~/lib/cart';

  interface Props {
    copy: CartCopy;
    /** Formatted. The same figure twice would be the same number twice. */
    total: string;
    /** A rental with no package picked cannot show a closed total. */
    noPackage: boolean;
  }

  const { copy, total, noPackage }: Props = $props();

  const ARROW_RIGHT = 'M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3';
</script>

<aside
  class="bg-tint rounded-panel wide:sticky wide:top-24 flex max-w-95 min-w-0 flex-[1_1_19rem] flex-col gap-5 p-7"
  aria-labelledby="cart-summary-title"
>
  <h2 class="m-0 text-[19px] font-bold tracking-[-0.01em]" id="cart-summary-title">
    {copy.summary}
  </h2>

  <div class="flex flex-col gap-3 text-[16px]">
    <div class="flex justify-between gap-3">
      <span class="text-ink-2">{copy.subtotal}</span>
      <span class="font-semibold tabular-nums">{total}</span>
    </div>
    <div class="flex justify-between gap-3">
      <span class="text-ink-2">{copy.deliveryLabel}</span>
      <span class="text-ink-2 font-semibold">{copy.deliveryPending}</span>
    </div>
  </div>

  <div class="border-hair flex items-baseline justify-between gap-3 border-t pt-4.5">
    <span class="text-[16px] font-semibold">{copy.total}</span>
    <span class="flex flex-col items-end gap-0.5">
      <strong class="font-ui text-[28px]/[1.1] tracking-[-0.015em] tabular-nums">{total}</strong>
      <span class="text-ink-2 text-[14px]">
        {noPackage ? copy.noPackageNote : copy.vatIncluded}
      </span>
    </span>
  </div>

  <button
    class="font-display text-ui-strong hover:bg-accent-deep inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-accent px-7 font-semibold text-white no-underline"
    type="submit"
  >
    {copy.goToCheckout}
    <svg
      class="size-4.5 flex-none"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={ARROW_RIGHT} />
    </svg>
  </button>

  <p class="text-ink-2 m-0 text-center text-[14px] leading-normal">{copy.noChargeYet}</p>
</aside>
