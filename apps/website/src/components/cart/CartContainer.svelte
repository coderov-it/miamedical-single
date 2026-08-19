<!--
  The cart island's root: the page's two columns, and the wiring between the state
  and the pieces that draw it.

  This file holds no cart logic and no card markup. It creates one `CartState`
  (`lib/cart-state.svelte.ts`), mounts it, and hands each component exactly what it
  needs — already formatted, already interpolated. Which means the page reads as the
  state machine it is: loading, or empty, or rows.

    CartContainer          ← this file: form, layout, notices, state wiring
    ├── CartLoadingCard    ← the first paint, until storage has been read
    ├── CartEmptyState     ← nothing in the cart
    ├── CartCard × n       ← one line each: head always, panel on request
    │   └── CartQuantityStepper
    └── CartOverview       ← the totals and the way to the checkout

  Layout, the deliberate deviations and the no-JavaScript path:
  docs/code/storefront-cart.md
-->
<script lang="ts">
  import type { CartCopy, CartView } from '~/lib/cart';
  import { CartState } from '~/lib/cart-state.svelte';
  import type { CartLine } from '~/lib/cart-store';
  import CartCard from './CartCard.svelte';
  import CartEmptyState from './CartEmptyState.svelte';
  import CartLoadingCard from './CartLoadingCard.svelte';
  import CartOverview from './CartOverview.svelte';

  interface Props {
    /**
     * The cart as the SERVER rendered it — resolved from whatever the URL carried.
     * Empty on a normal visit, one line when the product page handed one over with
     * JavaScript off. It is what the page shows before this script runs, so the
     * markup Astro sends and the markup that hydrates agree.
     */
    initial: CartView;
    /**
     * Those same URL-borne lines in storage shape, so they can be merged into the
     * store on mount. See `CartState.mount()`.
     */
    urlLines: CartLine[];
    copy: CartCopy;
    /** Where the confirm button posts, and where "keep browsing" goes. */
    checkoutPath: string;
    catalogPath: string;
    /** Matches `formatMoney()`'s default in `lib/api.ts`. */
    locale?: string;
  }

  const { initial, urlLines, copy, checkoutPath, catalogPath, locale = 'it-IT' }: Props = $props();

  const cart = new CartState({ initial, urlLines, copy, locale });

  $effect(() => {
    cart.mount();
  });

  const ARROW_LEFT = 'M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18';
</script>

<!--
  One form around BOTH columns, exactly as the product page wraps its two, so the
  confirm button in the summary submits the rows rendered in the other column.

  No `display: contents` on the form: it would drop the element from the
  accessibility tree in several browsers, and it buys nothing here — the flex layout
  lives on the inner div, so a plain block form wraps it without affecting the
  columns.
-->
<form method="post" action={checkoutPath}>
  {#each cart.wireFields as field (field.name + field.value)}
    <input type="hidden" name={field.name} value={field.value} />
  {/each}

  <!-- `pt-*`: with the title unpainted the card used to sit 23px under the
       breadcrumb, close enough to read as attached to it (owner, 2026-08-20). -->
  <div class="mid:gap-12 mid:pt-7 flex flex-wrap items-start gap-8 pt-5">
    <!-- ------------------------------------------------------ the rows -->
    <main class="mid:gap-5.5 flex min-w-0 flex-[1_1_34rem] flex-col gap-4">
      <!--
        The title is not painted (owner, 2026-08-20): the breadcrumb immediately
        above already reads "Home › La tua richiesta", so an h1 a line below said the
        page's name twice. It stays in the document for the outline and for screen
        readers, and the count stays with it — announced, not printed, since the rows
        themselves are the count.
      -->
      <h1 class="sr-only">{copy.heading}</h1>
      {#if !cart.empty}
        <span class="sr-only" aria-live="polite">{cart.countLabel}</span>
      {/if}

      <!-- Both notices are fills, not bordered plates (the control rule). -->
      {#if cart.unavailableNotice}
        <p class="bg-danger/8 text-ink rounded-field m-0 px-4.5 py-3.5 text-[16px]" role="status">
          {cart.unavailableNotice}
        </p>
      {/if}

      {#if cart.stale}
        <p class="text-ink-2 rounded-field bg-tint m-0 px-4.5 py-3.5 text-[16px]" role="status">
          {copy.offline}
        </p>
      {/if}

      {#if cart.booting}
        <CartLoadingCard label={copy.booting} />
      {:else if cart.empty}
        <CartEmptyState {copy} {catalogPath} />
      {:else}
        <ul class="m-0 flex list-none flex-col gap-3 p-0">
          {#each cart.rows as row (row.line.id)}
            <CartCard
              view={row.view}
              quantity={row.line.quantity}
              open={cart.isOpen(row.line.id)}
              panelId={`cart-row-${row.line.id}`}
              amount={cart.rowAmount(row)}
              unitPrice={cart.rowUnitPrice(row)}
              labels={cart.rowLabels(row.view)}
              removeText={copy.remove}
              onToggle={() => cart.toggle(row.line.id)}
              onQuantityChange={(quantity) => cart.setQuantity(row.line.id, quantity)}
              onRemove={() => cart.remove(row.line.id)}
            />
          {/each}
        </ul>

        <a class="btn btn-soft min-h-12 self-start px-5.5 text-[16px]" href={catalogPath}>
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
            <path d={ARROW_LEFT} />
          </svg>
          {copy.continueBrowsing}
        </a>
      {/if}
    </main>

    <!-- --------------------------------------------------- the summary -->
    {#if !cart.empty && !cart.booting}
      <CartOverview {copy} total={cart.money(cart.optimisticTotal)} noPackage={cart.view.noPackage} />
    {/if}
  </div>

  <!--
    The stepper and Rimuovi change numbers elsewhere on the page, which a
    screen-reader user would otherwise not be told about. `aria-live` on the total
    alone would announce a bare figure; this says what happened and then the figure.
  -->
  <p class="sr-only" role="status" aria-live="polite">
    {#if cart.pricing}{copy.loading}{:else}{cart.announcement}{/if}
  </p>
</form>
