<!--
  The cart, as the storefront's one interactive island.

  Its spec is the owner-authored Claude Design file "Cart.dc.html", from the same
  project as the product detail page and the checkout, and it is released from
  Variante B the same way they are: the reference's own radii, spacing and
  sub-16px secondary text. Layout, the deliberate deviations and the
  no-JavaScript path: docs/code/storefront-cart.md

  WHAT THIS OWNS: which lines exist, how many of each, which row is open. That is
  all. It owns no price, no title and no label — those arrive from
  `/api/cart/resolve` already formatted, and the only arithmetic here is
  `unitTotal * quantity` to repaint a stepper press before the response lands.

  It contains no Italian: every word comes in through `copy`, resolved on the
  server by `cartCopy()`. That is the project's code-English rule, and it also
  keeps `@mia/i18n` out of the client bundle.
-->
<script lang="ts">
  /*
    Runtime imports come from `cart-store.ts` ONLY — it imports nothing, so this
    island's bundle is the store logic and nothing else. `cart.ts` is server code
    (Hono client, @mia/i18n) and may only be imported here for TYPES, which erase.
  */
  import {
    CART_ITEM_PREFIX,
    CART_QUANTITY_FIELD,
    type CartLine,
    MAX_CART_QUANTITY,
    cartCount,
    clampQuantity,
    lineKey,
    readCartLines,
    writeCartLines,
  } from '~/lib/cart-store';
  import type { CartCopy, CartLineView, CartView } from '~/lib/cart';

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
     * store on mount. See `mergeUrlLines()`.
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

  /* ------------------------------------------------------------- state --- */

  let lines = $state<CartLine[]>(urlLines);
  let view = $state<CartView>(initial);
  /** Row ids that are open. Several may be, unlike the reference's single mode. */
  let openIds = $state<Set<string>>(new Set(initial.lines[0] ? [initial.lines[0].id] : []));
  let pricing = $state(false);
  let stale = $state(false);
  /** Politely announced after a change, so a stepper press is audible. */
  let announcement = $state('');

  let mounted = false;

  const count = $derived(cartCount(lines));
  const empty = $derived(lines.length === 0);

  /**
   * Rows in STORAGE order, each married to its resolved view.
   *
   * Driven by `lines` rather than by `view.lines` so a removal or a stepper press
   * repaints immediately: the response that agrees with it is still in flight, and
   * rendering the response's list would make every interaction wait for the
   * network. A line with no view yet (just added, not yet priced) is skipped
   * rather than rendered blank.
   */
  const rows = $derived(
    lines
      .map((line) => {
        const resolved = view.lines.find((candidate) => candidate.id === line.id);
        return resolved ? { line, view: resolved } : null;
      })
      .filter((row): row is { line: CartLine; view: CartLineView } => row !== null),
  );

  /**
   * The optimistic total: each row's server-priced unit rate times the quantity
   * this island currently holds. Equals `view.itemsTotal` once a response lands.
   *
   * An open-period row's figure is a per-unit RATE, not a sum, so a cart holding
   * one cannot show a closed total — the same rule `estimate()` applies, and the
   * reason the note under the number changes rather than the number being hidden.
   */
  const optimisticTotal = $derived(
    rows.reduce((sum, row) => sum + row.view.unitTotal * row.line.quantity, 0),
  );

  const money = $derived.by(() => {
    const format = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: view.currency || 'EUR',
    });
    return (amount: number) => format.format(amount);
  });

  /* ----------------------------------------------------------- storage --- */

  /**
   * Folds anything the URL carried into the store, then clears it from the URL.
   *
   * Without the clearing this would double-add on every refresh: the line would be
   * in storage AND in the query string, and merging is not idempotent against a
   * URL that keeps saying "add this". `replaceState` also keeps the configuration
   * out of the back button, which is the same reason the checkout takes a POST.
   */
  function mergeUrlLines(stored: CartLine[]): CartLine[] {
    if (urlLines.length === 0) return stored;

    const merged = [...stored];
    for (const incoming of urlLines) {
      const key = lineKey(incoming.config);
      const existing = merged.find((line) => lineKey(line.config) === key);
      if (existing) {
        existing.quantity = clampQuantity(existing.quantity + incoming.quantity);
      } else {
        merged.push(incoming);
      }
    }

    window.history.replaceState(null, '', window.location.pathname);
    return merged;
  }

  /* ----------------------------------------------------------- pricing --- */

  let priceToken = 0;

  /**
   * Re-prices the whole cart on the server.
   *
   * Debounced by the caller, and guarded by a token rather than by an
   * AbortController: two presses of `+` produce two requests, and the danger is
   * the FIRST response landing last and repainting an older quantity. The token
   * makes a stale response a no-op.
   */
  async function price(next: CartLine[]) {
    if (next.length === 0) {
      view = { ...view, lines: [], itemsTotal: 0, itemsTotalLabel: money(0), droppedIds: [] };
      return;
    }

    const token = ++priceToken;
    pricing = true;
    try {
      const response = await fetch('/api/cart/resolve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lines: next }),
      });
      if (!response.ok) throw new Error(`resolve failed: ${response.status}`);
      const fresh = (await response.json()) as CartView;
      if (token !== priceToken) return;

      view = fresh;
      stale = false;

      /* A product that stopped resolving is pruned here rather than left to fail
         at the checkout, and it is the one case where the server's list, not this
         island's, decides what the cart contains. */
      if (fresh.droppedIds.length > 0) {
        lines = lines.filter((line) => !fresh.droppedIds.includes(line.id));
        writeCartLines(lines);
      }
    } catch {
      if (token !== priceToken) return;
      // The amounts on screen stay — they are the last figures the server gave,
      // and every one of them is provisional until the phone call anyway. The
      // banner says so rather than blanking a cart the customer can still read.
      stale = true;
    } finally {
      if (token === priceToken) pricing = false;
    }
  }

  let debounce: ReturnType<typeof setTimeout> | undefined;

  function commit(next: CartLine[], { announce = true } = {}) {
    lines = next;
    writeCartLines(next);
    if (announce) announcement = `${copy.updated} · ${money(optimisticTotal)}`;

    clearTimeout(debounce);
    debounce = setTimeout(() => void price(next), 250);
  }

  /* --------------------------------------------------------- lifecycle --- */

  $effect(() => {
    if (mounted) return;
    mounted = true;

    const merged = mergeUrlLines(readCartLines());
    lines = merged;

    if (merged.length > 0) {
      writeCartLines(merged);
      /* Always re-price on mount, even when the server already rendered these
         exact lines: the store may be days old, and a rental's price or
         availability can have moved since it was written. */
      void price(merged);
      if (!openIds.size && merged[0]) openIds = new Set([merged[0].id]);
    } else {
      writeCartLines(merged);
    }
  });

  /* ---------------------------------------------------------- actions --- */

  function toggle(id: string) {
    const next = new Set(openIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    openIds = next;
  }

  function setQuantity(id: string, quantity: number) {
    const clamped = clampQuantity(quantity);
    commit(lines.map((line) => (line.id === id ? { ...line, quantity: clamped } : line)));
  }

  function remove(id: string) {
    commit(lines.filter((line) => line.id !== id));
  }

  function fill(template: string, values: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
  }

  const countLabel = $derived(count === 1 ? copy.countOne : fill(copy.countMany, { count }));

  const unavailableNotice = $derived(
    view.droppedIds.length === 0
      ? ''
      : view.droppedIds.length === 1
        ? copy.unavailableOne
        : fill(copy.unavailableMany, { count: view.droppedIds.length }),
  );

  /**
   * The `item.<n>.` fields the checkout reads, flattened to one list of hidden
   * inputs.
   *
   * Built here rather than in the template because `URLSearchParams` is an
   * iterable, not an array, and `{#each}` needs the array — and because the index
   * has to be the ROW's position, which a nested each would have to thread through.
   * Positional and preserved nowhere, exactly as `splitItemParams()` documents.
   */
  const wireFields = $derived(
    rows.flatMap((row, index) => {
      const prefix = `${CART_ITEM_PREFIX}${index}.`;
      const fields = [...new URLSearchParams(row.line.config)].map(([key, value]) => ({
        name: prefix + key,
        value,
      }));
      fields.push({ name: prefix + CART_QUANTITY_FIELD, value: String(row.line.quantity) });
      return fields;
    }),
  );
</script>

<!--
  One form around BOTH columns, exactly as the product page wraps its two, so the
  confirm button in the summary submits the rows rendered in the other column. The
  visible quantity inputs carry no `name`, so they cannot collide with the hidden
  wire fields.

  No `display: contents` on the form: it would drop the element from the
  accessibility tree in several browsers, and it buys nothing here — the flex
  layout lives on the inner div, so a plain block form wraps it without affecting
  the columns.
-->
<form method="post" action={checkoutPath}>
  {#each wireFields as field (field.name + field.value)}
    <input type="hidden" name={field.name} value={field.value} />
  {/each}

  <div class="mid:gap-12 flex flex-wrap items-start gap-8">
    <!-- ------------------------------------------------------ the rows -->
    <main class="mid:gap-5.5 flex min-w-0 flex-[1_1_34rem] flex-col gap-4">
      <header class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 class="m-0 text-[30px] font-bold tracking-[-0.015em]">{copy.heading}</h1>
        {#if !empty}
          <span class="text-ink-2 text-[14px]" aria-live="polite">{countLabel}</span>
        {/if}
      </header>

      {#if unavailableNotice}
        <p
          class="border-danger/35 text-ink rounded-field m-0 border bg-white px-4.5 py-3.5 text-[13.5px]"
          role="status"
        >
          {unavailableNotice}
        </p>
      {/if}

      {#if stale}
        <p
          class="border-hair text-ink-2 rounded-field bg-tint m-0 border px-4.5 py-3.5 text-[13.5px]"
          role="status"
        >
          {copy.offline}
        </p>
      {/if}

      {#if empty}
        <!--
          The reference design has no empty state — it always has a cart behind
          it. This one is the site's own, and it offers the two things a customer
          with an empty cart can actually do.
        -->
        <div
          class="border-hair shadow-pdp-card flex max-w-150 flex-col items-start gap-4 rounded-[14px] border bg-white p-7"
        >
          <h2 class="m-0 text-[17px] font-bold">{copy.emptyTitle}</h2>
          <p class="text-ink-2 m-0 text-[15px] leading-[1.55]">{copy.emptyDetail}</p>
          <a
            class="border-hair-strong text-ink rounded-full border-[1.5px] bg-white px-5.5 py-2.75 text-[15.5px] font-semibold no-underline hover:border-accent hover:text-accent"
            href={catalogPath}
          >
            {copy.goToCatalog}
          </a>
        </div>
      {:else}
        <ul class="m-0 flex list-none flex-col gap-3 p-0">
          {#each rows as row (row.line.id)}
            {@const open = openIds.has(row.line.id)}
            {@const panelId = `cart-row-${row.line.id}`}
            <li
              class="shadow-pdp-panel overflow-hidden rounded-[18px] border bg-white transition-colors {open
                ? 'border-accent/30'
                : 'border-hair'}"
            >
              <!--
                `relative` + the toggle's stretched ::before is what makes the
                whole row clickable while keeping ONE real button in the markup.
                The reference nests its stepper inside the clickable row and stops
                propagation, which in HTML would be a button inside a button — so
                the stepper is a sibling here and is lifted above the overlay.
              -->
              <div class="relative flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
                {#if row.view.thumbnail}
                  <img
                    class="bg-tint size-13.5 flex-none rounded-[10px] object-contain p-1 mix-blend-multiply"
                    src={row.view.thumbnail}
                    alt=""
                    loading="lazy"
                  />
                {:else}
                  <span class="bg-tint size-13.5 flex-none rounded-[10px]" aria-hidden="true"
                  ></span>
                {/if}

                <span class="flex min-w-40 flex-1 flex-col gap-0.75">
                  <strong class="text-[15px] tracking-[-0.005em]">{row.view.title}</strong>
                  {#if row.view.summary}
                    <span class="text-ink-2 text-[12.5px]">{row.view.summary}</span>
                  {/if}
                </span>

                <!-- Above the toggle overlay, so the stepper stays usable. -->
                <div
                  class="border-hair relative z-1 flex flex-none items-center overflow-hidden rounded-[10px] border bg-white"
                >
                  <button
                    class="target-48 text-ink-2 hover:bg-tint grid size-8 cursor-pointer place-items-center border-0 bg-white text-[16px]"
                    type="button"
                    aria-label={fill(copy.decrease, { title: row.view.title })}
                    onclick={() => setQuantity(row.line.id, row.line.quantity - 1)}
                    disabled={row.line.quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    class="border-hair h-8 w-8.5 appearance-none border-x bg-white text-center text-[14px] font-semibold tabular-nums [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    type="number"
                    min="1"
                    max={MAX_CART_QUANTITY}
                    inputmode="numeric"
                    aria-label={fill(copy.quantityOf, { title: row.view.title })}
                    value={row.line.quantity}
                    onchange={(event) =>
                      setQuantity(row.line.id, Number(event.currentTarget.value))}
                  />
                  <button
                    class="target-48 text-ink-2 hover:bg-tint grid size-8 cursor-pointer place-items-center border-0 bg-white text-[15px]"
                    type="button"
                    aria-label={fill(copy.increase, { title: row.view.title })}
                    onclick={() => setQuantity(row.line.id, row.line.quantity + 1)}
                    disabled={row.line.quantity >= MAX_CART_QUANTITY}
                  >
                    +
                  </button>
                </div>

                <!--
                  `unitSuffix` is "/giorno" on an open-ended rental, where this
                  figure is a RATE and not a total. Dropping it — which formatting
                  the number here rather than using the server's `subtotal` string
                  would — makes a daily rate read as the price of the whole rental.
                -->
                <strong class="flex-none text-right text-[16px] tracking-[-0.01em] tabular-nums">
                  {money(row.view.unitTotal * row.line.quantity)}{row.view.unitSuffix}
                </strong>

                <button
                  class="text-ink-2 grid size-6 flex-none cursor-pointer place-items-center border-0 bg-transparent before:absolute before:inset-0 before:content-['']"
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  aria-label={fill(copy.showDetailsOf, { title: row.view.title })}
                  onclick={() => toggle(row.line.id)}
                >
                  <svg
                    class="size-4 transition-transform duration-150 {open ? 'rotate-180' : ''}"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </button>
              </div>

              <div
                class="border-hair flex flex-col gap-4 border-t px-5 py-4.5"
                id={panelId}
                hidden={!open}
              >
                {#if row.view.facts.length > 0}
                  <p class="text-ink-2 m-0 text-[12.5px]">
                    {#each row.view.facts as fact, factIndex (fact.label)}{factIndex > 0
                        ? ' · '
                        : ''}{fact.label}
                      {fact.value}{/each}
                  </p>
                {/if}

                <ul class="m-0 flex list-none flex-col gap-2 p-0 text-[13.5px]">
                  {#each row.view.lines as line (line.label)}
                    <li class="flex justify-between gap-4">
                      <span class="text-ink-2 min-w-0">{line.label}</span>
                      <span class="font-semibold whitespace-nowrap tabular-nums">{line.amount}</span
                      >
                    </li>
                  {/each}
                </ul>

                <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <a
                    class="target-48 text-[13px] font-semibold text-accent no-underline hover:underline"
                    href={row.view.href}
                  >
                    {copy.editConfiguration}
                  </a>
                  <button
                    class="text-danger target-48 cursor-pointer border-0 bg-transparent text-[13px] font-semibold hover:underline"
                    type="button"
                    aria-label={fill(copy.removeNamed, { title: row.view.title })}
                    onclick={() => remove(row.line.id)}
                  >
                    {copy.remove}
                  </button>
                </div>
              </div>
            </li>
          {/each}
        </ul>

        <a
          class="target-48 inline-flex items-center text-[13.5px] font-semibold text-accent no-underline hover:underline"
          href={catalogPath}
        >
          ← {copy.continueBrowsing}
        </a>
      {/if}
    </main>

    <!-- --------------------------------------------------- the summary -->
    {#if !empty}
      <aside
        class="bg-tint wide:sticky wide:top-24 flex max-w-95 min-w-0 flex-[1_1_19rem] flex-col gap-4.5 rounded-[22px] p-7"
        aria-labelledby="cart-summary-title"
      >
        <h2 class="m-0 text-[15px] font-bold tracking-[-0.005em]" id="cart-summary-title">
          {copy.summary}
        </h2>

        <div class="flex flex-col gap-2.5 text-[13.5px]">
          <div class="flex justify-between gap-3">
            <span class="text-ink-2">{copy.subtotal}</span>
            <span class="font-semibold tabular-nums">{money(optimisticTotal)}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-ink-2">{copy.deliveryLabel}</span>
            <span class="text-ink-2 font-semibold">{copy.deliveryPending}</span>
          </div>
        </div>

        <div class="border-hair-strong flex items-baseline justify-between gap-3 border-t pt-4">
          <span class="text-[13.5px] font-semibold">{copy.total}</span>
          <span class="flex flex-col items-end">
            <strong class="text-[24px] tracking-[-0.01em] tabular-nums">
              {money(optimisticTotal)}
            </strong>
            <span class="text-ink-2 text-[12px]">
              {view.openPeriod ? copy.openPeriodNote : copy.vatIncluded}
            </span>
          </span>
        </div>

        <button
          class="hover:bg-accent-deep min-h-13 cursor-pointer rounded-[14px] border-0 bg-accent px-5 text-[15px] font-bold tracking-[0.01em] text-white"
          type="submit"
        >
          {copy.goToCheckout}
        </button>

        <p class="text-ink-2 m-0 text-center text-[12.5px] leading-[1.55]">{copy.noChargeYet}</p>
      </aside>
    {/if}
  </div>

  <!--
    The stepper and the remove button change numbers elsewhere on the page, which
    a screen-reader user would otherwise not be told about. `aria-live` on the
    total alone would announce a bare figure; this says what happened and then
    the figure.
  -->
  <p class="sr-only" role="status" aria-live="polite">
    {#if pricing}{copy.loading}{:else}{announcement}{/if}
  </p>
</form>
