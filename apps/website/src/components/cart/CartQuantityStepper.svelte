<!--
  How many of one line. One tint group, transparent keys inside it — the product
  page's stepper, down to the 44px keys.

  It used to need `relative z-1` to sit above the card's stretched toggle overlay.
  The card no longer has one — nothing on it opens — so the stepper is an ordinary
  child again.
-->
<script lang="ts">
  import { MAX_CART_QUANTITY } from '~/lib/cart-store';

  interface Props {
    quantity: number;
    /** Spoken labels, already carrying the product's name. */
    decreaseLabel: string;
    increaseLabel: string;
    valueLabel: string;
    /** Receives the requested quantity; the state clamps it. */
    onChange: (quantity: number) => void;
  }

  const { quantity, decreaseLabel, increaseLabel, valueLabel, onChange }: Props = $props();

  /* Both keys, so the pair cannot drift: 44px painted, 48px to the finger.
     Tailwind's pseudo-element target utilities restore 48px while keeping a
     sub-48 paint — so the size is stated with `size-*`, never `min-h-*`. */
  const KEY =
    "relative grid size-11 min-h-0 min-w-0 cursor-pointer text-ink after:absolute after:top-1/2 after:left-1/2 after:size-full after:min-h-12 after:min-w-12 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] hover:bg-tint-2 disabled:text-ink-placeholder " +
    'place-items-center border-0 bg-transparent text-xl font-bold disabled:cursor-not-allowed ' +
    'disabled:hover:bg-transparent';
</script>

<div class="bg-tint flex flex-none items-center overflow-hidden rounded-[10px]">
  <button
    class={KEY}
    type="button"
    aria-label={decreaseLabel}
    onclick={() => onChange(quantity - 1)}
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
    onchange={(event) => onChange(Number(event.currentTarget.value))}
  />

  <button
    class={KEY}
    type="button"
    aria-label={increaseLabel}
    onclick={() => onChange(quantity + 1)}
    disabled={quantity >= MAX_CART_QUANTITY}
  >
    +
  </button>
</div>
