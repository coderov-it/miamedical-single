<script lang="ts">
  import { api } from '~/lib/api';

  interface Props {
    skuId: string;
    inStock: boolean;
  }

  let { skuId, inStock }: Props = $props();

  let quantity = $state(1);
  let status = $state<'idle' | 'pending' | 'added' | 'error'>('idle');

  const disabled = $derived(!inStock || status === 'pending');

  async function addToCart() {
    status = 'pending';
    try {
      // TODO: point at the cart route once it exists on the API.
      await new Promise((resolve) => setTimeout(resolve, 300));
      void api;
      void skuId;
      status = 'added';
    } catch {
      status = 'error';
    }
  }
</script>

<div class="mt-8 flex items-center gap-3">
  <label class="sr-only" for="qty">Quantity</label>
  <input
    id="qty"
    type="number"
    min="1"
    max="999"
    bind:value={quantity}
    class="w-20 rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
  />

  <button
    onclick={addToCart}
    {disabled}
    class="bg-brand-600 hover:bg-brand-700 rounded-lg px-6 py-2.5 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
  >
    {#if status === 'pending'}
      Adding…
    {:else if status === 'added'}
      Added ✓
    {:else if !inStock}
      Out of stock
    {:else}
      Add to cart
    {/if}
  </button>
</div>

{#if status === 'error'}
  <p class="mt-2 text-sm text-red-600" role="alert">Could not add to cart. Please try again.</p>
{/if}
