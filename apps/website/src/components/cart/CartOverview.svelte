<!--
  The summary: what the cart comes to, what is still to be agreed, what is due
  today, and the way on to the checkout.

  It used to print the same figure twice — "Totale indicativo" and then "Totale",
  both the identical number, because nothing sits between them: no tax line, no
  shipping, no discount. The estimate is now stated ONCE, at the size the old
  duplicate wore, and the closing figure is the one that is actually different:
  what the customer pays today, which is nothing (the reference site's own move —
  owner, 2026-08-31).

  The submit button carries no form of its own — the container wraps BOTH columns in
  one `<form>`, so pressing it posts the hidden line fields rendered beside the rows.
-->
<script lang="ts">
  import type { CartCopy } from '~/lib/cart';

  interface Props {
    copy: CartCopy;
    /** Formatted: the cart's estimate. */
    total: string;
    /** Formatted zero, in the cart's own currency. */
    dueToday: string;
    /** A rental with no package picked cannot show a closed total. */
    noPackage: boolean;
  }

  const { copy, total, dueToday, noPackage }: Props = $props();

  const ARROW_RIGHT = 'M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3';
</script>

<aside
  class="bg-tint rounded-panel wide:sticky wide:top-24 mid:p-7 flex max-w-90 min-w-0 flex-[1_1_19rem] flex-col gap-5 p-6"
  aria-labelledby="cart-summary-title"
>
  <h2 class="m-0 text-[19px] font-bold tracking-[-0.01em]" id="cart-summary-title">
    {copy.summary}
  </h2>

  <div class="flex flex-col gap-3.5 text-[16px]">
    <div class="flex items-baseline justify-between gap-3">
      <span class="text-ink-2">{copy.subtotal}</span>
      <span class="flex flex-col items-end gap-0.5">
        <strong class="font-ui text-[26px]/[1.1] tracking-[-0.015em] tabular-nums">{total}</strong>
        <span class="text-ink-2 text-[14px]">
          {noPackage ? copy.noPackageNote : copy.vatIncluded}
        </span>
      </span>
    </div>
    <div class="flex justify-between gap-3">
      <span class="text-ink-2">{copy.deliveryLabel}</span>
      <span class="text-ink-2 font-semibold">{copy.deliveryPending}</span>
    </div>
  </div>

  <!-- The one figure on this page that is not provisional. It is `--color-ok`
       rather than the accent because it is reassurance, not a call to act. -->
  <div class="border-hair flex items-center justify-between gap-3 border-t pt-4.5">
    <span class="font-display text-[17px] font-semibold">{copy.dueToday}</span>
    <strong class="font-ui text-ok text-[25px]/[1.1] tracking-[-0.015em] tabular-nums"
      >{dueToday}</strong
    >
  </div>

  <p class="text-ink-2 m-0 text-[14px] leading-[1.5]">{copy.dueTodayNote}</p>

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
</aside>
