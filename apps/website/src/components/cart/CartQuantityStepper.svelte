<!--
  How many of one line. One tint group, transparent keys inside it — the product
  page's stepper, down to the 44px keys.

  It used to need `relative z-1` to sit above the card's stretched toggle overlay.
  The card no longer has one — nothing on it opens — so the stepper is an ordinary
  child again.

  "+" IS NEVER DISABLED. The per-line cap (10) stays, but pressing "+" at it — or
  typing more — says so right here, with the number to call for a larger order,
  in a live region (CART-001). The "−" floor at 1 is not a gate: below 1 is
  "Rimuovi", which sits on the card.
-->
<script lang="ts">
  import { MAX_CART_QUANTITY } from '~/lib/cart-store';
  import { requestQuantity } from '~/lib/quantity-cap';
  import { CONTACT } from '~/lib/site';

  interface Props {
    quantity: number;
    /** Spoken labels, already carrying the product's name. */
    decreaseLabel: string;
    increaseLabel: string;
    valueLabel: string;
    /** "Massimo 10 per richiesta. Per una quantità maggiore chiamaci al" — the number follows. */
    capMessage: string;
    /** Receives the quantity, already within the cap. */
    onChange: (quantity: number) => void;
  }

  const { quantity, decreaseLabel, increaseLabel, valueLabel, capMessage, onChange }: Props =
    $props();

  let capped = $state(false);

  function request(requested: unknown): number {
    const next = requestQuantity(requested, MAX_CART_QUANTITY);
    capped = next.capped;
    onChange(next.quantity);
    return next.quantity;
  }

  function typed(input: HTMLInputElement): void {
    /* The clamp written back below can fire a second `change` on blur, carrying
       the value we wrote — that is not a new request and must not clear the
       message the first one raised. */
    if (Number(input.value) === quantity) return;
    /* Written back: a clamp that leaves "999" in the box says nothing either. */
    input.value = String(request(input.value));
  }

  /* Both keys, so the pair cannot drift: 44px painted, 48px to the finger.
     Tailwind's pseudo-element target utilities restore 48px while keeping a
     sub-48 paint — so the size is stated with `size-*`, never `min-h-*`. */
  const KEY =
    "relative grid size-11 min-h-0 min-w-0 cursor-pointer text-ink after:absolute after:top-1/2 after:left-1/2 after:size-full after:min-h-12 after:min-w-12 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] hover:bg-tint-2 disabled:text-ink-placeholder " +
    'place-items-center border-0 bg-transparent text-xl font-bold disabled:cursor-not-allowed ' +
    'disabled:hover:bg-transparent';
</script>

<div class="flex min-w-0 shrink flex-col items-start">
  <div class="bg-tint flex flex-none items-center overflow-hidden rounded-[10px]">
    <button
      class={KEY}
      type="button"
      aria-label={decreaseLabel}
      onclick={() => request(quantity - 1)}
      disabled={quantity <= 1}
    >
      −
    </button>

    <!-- No `name`: the fields the checkout reads are hidden inputs the container
         renders, and a name here would collide with them. -->
    <input
      class="h-11 w-11 appearance-none border-0 bg-transparent text-center text-[16px] font-bold tabular-nums [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      type="number"
      min="1"
      max={MAX_CART_QUANTITY}
      inputmode="numeric"
      aria-label={valueLabel}
      value={quantity}
      onchange={(event) => typed(event.currentTarget)}
    />

    <button class={KEY} type="button" aria-label={increaseLabel} onclick={() => request(quantity + 1)}>
      +
    </button>
  </div>

  <!-- Always in the tree, so revealing the message is what gets announced. -->
  <p class="text-ink-2 m-0 max-w-60 text-[13.5px] leading-[1.45]" aria-live="polite">
    {#if capped}
      <span class="mt-1.5 block">
        {capMessage}
        <a class="text-ink font-semibold whitespace-nowrap underline" href={`tel:${CONTACT.phoneE164}`}
          >{CONTACT.phoneDisplay}</a
        >.
      </span>
    {/if}
  </p>
</div>
