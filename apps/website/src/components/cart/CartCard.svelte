<!--
  ONE line of the cart, FLAT: everything the customer chose is on the card, all of
  the time.

  It used to be a disclosure — a head that showed the package and the amount, and a
  panel holding the dates. That failed the one job a cart has: the owner could not
  tell at a glance what had been added (owner, 2026-08-31). A cart line is four
  short facts, so it is drawn as four short facts and nothing opens.

    [ photo ]  Product
               Ritiro 10/09/2026 → Riconsegna 09/10/2026
               30 giorni = 210,00 €
               Rimuovi                      [ − 2 + ]      420,00 €

  On a phone the stepper and the amount drop to their own full-width row under the
  photo and the text; nothing else moves.

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
    /** Formatted: the row's amount (unit rate × quantity) with its suffix. */
    amount: string;
    /** Formatted: what ONE of these costs, with its suffix. Never × quantity. */
    unitPrice: string;
    labels: CartRowLabels;
    removeText: string;
    onQuantityChange: (quantity: number) => void;
    onRemove: () => void;
  }

  const {
    view,
    quantity,
    amount,
    unitPrice,
    labels,
    removeText,
    onQuantityChange,
    onRemove,
  }: Props = $props();

  /* The card's two prose tiers, one step under the title: the phone reads 15, the
     desktop 16. Labels stay on the MUTED ink and their VALUES step up to the full
     ink — size and weight separate a label from its value, never colour. */
  const DETAIL = 'text-ink-2 m-0 text-[15px] mid:text-[16px]';
  const VALUE = 'text-ink font-semibold';

  /* Heroicons v2 outline on a 24 grid. */
  const ARROW_RIGHT = 'M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3';
  const TRASH =
    'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.2v.916m7.5 0a48.667 48.667 0 0 0-7.5 0';
</script>

<li
  class="border-hair rounded-card mid:gap-x-4.5 mid:p-5 flex flex-wrap items-center gap-x-4 gap-y-4 border bg-white p-4"
>
  <!--
    100px on the desktop, 80 on a phone — the reference site's own figure, and
    roughly double what this card used to show (owner, 2026-08-31: "cart image is
    too small"). `object-contain` inside its own padding, never `cover`: a product
    photo is not allowed to crop.
  -->
  {#if view.thumbnail}
    <img
      class="bg-tint rounded-field mid:size-25 size-20 flex-none object-contain p-2 mix-blend-multiply"
      src={view.thumbnail}
      alt={view.thumbnailAlt}
      loading="lazy"
    />
  {:else}
    <span class="bg-tint rounded-field mid:size-25 size-20 flex-none" aria-hidden="true"></span>
  {/if}

  <div class="mid:gap-1.5 flex min-w-40 flex-1 flex-col gap-1">
    <a
      class="font-display mid:text-[18px] text-[17px]/[1.3] font-bold no-underline hover:underline"
      href={view.href}>{view.title}</a
    >

    <!--
      The booking as ONE fact — from a day to a day — rather than two columns
      drifting apart. Whatever `facts` still carries after the server has folded
      the period out of it follows on the same flowing line.
    -->
    {#if view.period || view.facts.length > 0}
      <p class="{DETAIL} flex flex-wrap items-center gap-x-2 gap-y-1">
        {#if view.period}
          <!-- Each half stays whole and the arrow travels with the SECOND one, so a
               column too narrow for the range breaks between the two dates rather
               than leaving an arrow dangling at the end of the first line. -->
          <span class="whitespace-nowrap"
            >{view.period.fromLabel} <span class={VALUE}>{view.period.from}</span></span
          >
          <span class="inline-flex items-center gap-2 whitespace-nowrap">
            <svg
              class="size-3.5 flex-none"
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
            <span>{view.period.toLabel} <span class={VALUE}>{view.period.to}</span></span>
          </span>
        {/if}
        {#each view.facts as fact, index (fact.label)}
          {#if view.period || index > 0}
            <span class="text-ink-decorative" aria-hidden="true">·</span>
          {/if}
          <span>{fact.label} <span class={VALUE}>{fact.value}</span></span>
        {/each}
      </p>
    {/if}

    <!-- The chosen package AND what that package costs, in one type style across
         both halves of the line — no bold, no size step on the figure. -->
    {#if view.summary}
      <p class={DETAIL}>
        {view.summary} =
        <span class="font-ui {VALUE} tabular-nums">{unitPrice}</span>
      </p>
    {/if}

    <!-- A breakdown only when there is something to break down. With one priced
         line the row's own amount already says it. -->
    {#if view.lines.length > 1}
      <ul class="m-0 flex list-none flex-col gap-1 p-0">
        {#each view.lines as line (line.label)}
          <li class="{DETAIL} flex justify-between gap-4">
            <span class="min-w-0">{line.label}</span>
            <span class="{VALUE} whitespace-nowrap tabular-nums">{line.amount}</span>
          </li>
        {/each}
      </ul>
    {/if}

    <!--
      One action, ranged left under the facts it acts on, wearing the danger tier
      at REST so it reads as a delete before anyone hovers it. There is no
      "Modifica la scelta" (owner, 2026-08-20): editing sent the customer back to
      the product page, where adding again APPENDS a second line instead of
      replacing this one.

      Negative margins pull the 48px target back into the text column's left edge
      so the label lines up with the product title above it.
    -->
    <button
      class="text-danger font-display hover:bg-danger-tint -mx-3 -my-1 mt-0.5 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border-0 bg-transparent px-3 text-[15px] font-semibold whitespace-nowrap"
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

  <!-- `w-full` on a phone, so the pair drops to its own row rather than squeezing
       the title into two words per line. -->
  <div class="mid:w-auto mid:justify-end flex w-full items-center justify-between gap-3">
    <CartQuantityStepper
      {quantity}
      decreaseLabel={labels.decrease}
      increaseLabel={labels.increase}
      valueLabel={labels.quantity}
      onChange={onQuantityChange}
    />

    <strong
      class="font-ui mid:min-w-24 mid:text-[21px] flex-none text-right text-[20px]/[1.2] tabular-nums"
    >
      {amount}
    </strong>
  </div>
</li>
