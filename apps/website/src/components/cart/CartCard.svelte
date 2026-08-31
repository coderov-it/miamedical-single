<!--
  ONE line of the cart: a white card whose head always shows, and a panel that
  opens.

  HEAD — thumbnail, product, the chosen package with what that package costs, the
  stepper, the row's amount, and the disclosure key. Everything a customer needs to
  read the cart is here, which is why no row opens by default.

  PANEL — the booking as a range, the quantity if there is more than one, a price
  breakdown when there is something to break down, and Rimuovi.

  It owns no formatting and no copy: amounts arrive formatted, labels arrive
  interpolated. See `lib/cart-state.svelte.ts`.
-->
<script lang="ts">
  import type { CartLineView } from '~/lib/cart';
  import type { CartRowLabels } from '~/lib/cart-state.svelte';
  import CartQuantityStepper from './CartQuantityStepper.svelte';

  interface Props {
    view: CartLineView;
    quantity: number;
    open: boolean;
    /** `id` of the panel, so the key's `aria-controls` can point at it. */
    panelId: string;
    /** Formatted: the row's amount (unit rate × quantity) with its suffix. */
    amount: string;
    /** Formatted: what ONE of these costs, with its suffix. Never × quantity. */
    unitPrice: string;
    labels: CartRowLabels;
    removeText: string;
    onToggle: () => void;
    onQuantityChange: (quantity: number) => void;
    onRemove: () => void;
  }

  const {
    view,
    quantity,
    open,
    panelId,
    amount,
    unitPrice,
    labels,
    removeText,
    onToggle,
    onQuantityChange,
    onRemove,
  }: Props = $props();

  /* The panel's two type tiers: one step down from the card's 16px, both on the
     MUTED ink (owner, 2026-08-20: "don't use pure black here"). Size and weight
     separate a label from its value, not colour. */
  const LABEL = 'text-ink-2 text-[13.5px]';
  const VALUE = 'text-ink-2 m-0 text-[15px] font-semibold tabular-nums';

  /* Heroicons v2 outline on a 24 grid; the chevron is the reference design's own
     16-grid path and keeps that viewBox so its stroke weight is unchanged. */
  const ARROW_RIGHT = 'M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3';
  const CHEVRON_DOWN = 'M4 6l4 4 4-4';
  const TRASH =
    'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.2v.916m7.5 0a48.667 48.667 0 0 0-7.5 0';
</script>

<li
  class="shadow-pdp-panel rounded-card overflow-hidden border bg-white transition-colors {open
    ? 'border-accent/30'
    : 'border-hair'}"
>
  <!--
    `relative` + the key's stretched ::before is what makes the whole head
    clickable while keeping ONE real button in the markup. The stepper is a
    sibling lifted above that overlay rather than a nested button.
  -->
  <div class="relative flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
    {#if view.thumbnail}
      <img
        class="bg-tint size-13.5 flex-none rounded-[10px] object-contain p-1 mix-blend-multiply"
        src={view.thumbnail}
        alt=""
        loading="lazy"
      />
    {:else}
      <span class="bg-tint size-13.5 flex-none rounded-[10px]" aria-hidden="true"></span>
    {/if}

    <!--
      The product is the loudest thing in the card, and under it the chosen package
      AND WHAT THAT PACKAGE COSTS (owner, 2026-08-20). ONE type style across both
      halves of that line — no bold, no size step on the figure.
    -->
    <span class="flex min-w-40 flex-1 flex-col gap-1">
      <strong class="text-h4/tight font-bold tracking-[-0.015em]">{view.title}</strong>
      {#if view.summary}
        <span class="text-ink-2 text-[16px]">{view.summary} = {unitPrice}</span>
      {/if}
    </span>

    <CartQuantityStepper
      {quantity}
      decreaseLabel={labels.decrease}
      increaseLabel={labels.increase}
      valueLabel={labels.quantity}
      onChange={onQuantityChange}
    />

    <strong class="font-ui flex-none text-right text-[20px]/[1.2] tracking-[-0.015em] tabular-nums">
      {amount}
    </strong>

    <!-- A round quiet key, not a floating glyph: the whole head is clickable, so
         the affordance has to look like a control. -->
    <button
      class="text-ink-2 hover:bg-tint hover:text-ink grid size-11 flex-none cursor-pointer place-items-center rounded-full border-0 bg-transparent transition-colors before:absolute before:inset-0 before:content-['']"
      type="button"
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={labels.details}
      onclick={onToggle}
    >
      <svg
        class="size-4.5 transition-transform duration-150 {open ? 'rotate-180' : ''}"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d={CHEVRON_DOWN} />
      </svg>
    </button>
  </div>

  <!-- ONE STEP IN from the thumbnail's edge — the card's own padding doubled,
       20 → 40 (owner, 2026-08-20: "a little bit nested spacing"). -->
  <div
    class="border-hair flex flex-col gap-4 border-t py-4.5 pr-5 pl-10"
    id={panelId}
    hidden={!open}
  >
    {#if view.period || view.facts.length > 0}
      <!--
        The booking, as a range. It read as one run-on sentence of middot-joined
        dates, then as two columns drifting apart; it is one fact — from a day to a
        day — so it is drawn as one: labels on the first line, dates on the second,
        an arrow between them (owner, 2026-08-20). `w-fit` keeps the group tight
        rather than letting the panel stretch it.
      -->
      <dl class="m-0 flex flex-wrap items-start gap-x-7 gap-y-3.5">
        {#if view.period}
          <div class="grid w-fit grid-cols-[auto_auto_auto] items-baseline gap-x-2.5 gap-y-0.5">
            <dt class={LABEL}>{view.period.fromLabel}</dt>
            <span></span>
            <dt class={LABEL}>{view.period.toLabel}</dt>
            <dd class={VALUE}>{view.period.from}</dd>
            <svg
              class="text-ink-2 size-3.5 self-center"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d={ARROW_RIGHT} />
            </svg>
            <dd class={VALUE}>{view.period.to}</dd>
          </div>
        {/if}

        {#each view.facts as fact (fact.label)}
          <div class="flex min-w-0 flex-col gap-0.5">
            <dt class={LABEL}>{fact.label}</dt>
            <dd class={VALUE}>{fact.value}</dd>
          </div>
        {/each}
      </dl>
    {/if}

    {#if view.lines.length > 1}
      <!--
        A BREAKDOWN, ruled off from the booking above it — and only when there is
        something to break down. With one priced line the head's own amount already
        says it, and printing it again under a head that reads 20,00 € was the third
        telling of the same thing (owner, 2026-08-20).
      -->
      <ul class="border-hair m-0 flex list-none flex-col gap-2.5 border-t p-0 pt-4 text-[16px]">
        {#each view.lines as line (line.label)}
          <li class="flex justify-between gap-4">
            <span class="text-ink-2 min-w-0">{line.label}</span>
            <span class="font-semibold whitespace-nowrap tabular-nums">{line.amount}</span>
          </li>
        {/each}
      </ul>
    {/if}

    <!--
      ONE action, right-aligned under the amounts it acts on, wearing the danger
      tier at REST so it reads as a delete before anyone hovers it. There is no
      "Modifica la scelta" (owner, 2026-08-20): editing sent the customer back to
      the product page, where adding again APPENDS a second line instead of
      replacing this one — the button promised an edit and performed a duplicate.
    -->
    <div class="flex flex-wrap items-center justify-end">
      <button
        class="bg-danger-tint font-display text-danger hover:bg-danger relative inline-flex h-11 min-h-0 min-w-0 cursor-pointer items-center justify-center gap-2.5 rounded-full px-5 text-[16px] font-semibold whitespace-nowrap no-underline after:absolute after:top-1/2 after:left-1/2 after:size-full after:min-h-12 after:min-w-12 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] hover:text-white"
        type="button"
        aria-label={labels.remove}
        onclick={onRemove}
      >
        <svg
          class="size-4.5 flex-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d={TRASH} />
        </svg>
        {removeText}
      </button>
    </div>
  </div>
</li>
