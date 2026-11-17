<!--
  Order by phone. An agent raises an order for a customer who called or wrote, as
  four steps: products, packages, customer, review. Email is enough to start, the
  lines are priced by the server, and the customer finishes (details, contract,
  payment) from a link sent from the order's page.
  Docs: docs/code/manual-orders.md. Steps live in `$lib/orders/new-order/`.
-->
<script lang="ts">
  import { ProductCatalog } from '~/lib/orders/new-order/product-catalog.svelte';
  import { OrderForm } from '~/lib/orders/new-order/order-form.svelte';
  import OrderSummary from '~/lib/orders/new-order/order-summary.svelte';
  import ProductBrowser from '~/lib/orders/new-order/product-browser.svelte';
  import StepCustomer from '~/lib/orders/new-order/step-customer.svelte';
  import StepPackages from '~/lib/orders/new-order/step-packages.svelte';
  import StepReview from '~/lib/orders/new-order/step-review.svelte';
  import WizardFooter from '~/lib/orders/new-order/wizard-footer.svelte';
  import WizardStepper from '~/lib/orders/new-order/wizard-stepper.svelte';
  import { STEPS } from '~/lib/orders/new-order/types';

  const form = new OrderForm();
  const catalog = new ProductCatalog();
  /** The review step ends in its overview card, whose button is the last thing on the page. */
  const last = $derived(form.step === STEPS.length - 1);
</script>

<section class="admin-page">
  <!-- Fills the viewport below the topbar (3.5rem) and the layout's py-6 (3rem), so the
       footer sits on the bottom edge even when a step is short. -->
  <div class="@container flex min-h-[calc(100svh-6.5rem)] flex-col">
    <div class="grid flex-1 gap-5 @4xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div class="min-w-0 space-y-5">
        <!-- Pinned under the topbar, on the page's own grey so the cards never show through. -->
        <div class="sticky top-14 z-20 -mx-1 -mt-3 bg-background px-1 pt-3 pb-3">
          <WizardStepper {form} />
        </div>
        <div class="@container">
          <!-- Only the step on screen is mounted; its state lives in `form`, so going back loses nothing. -->
          {#if form.step === 0}
            <ProductBrowser {form} {catalog} />
          {:else if form.step === 1}
            <StepPackages {form} />
          {:else if form.step === 2}
            <StepCustomer {form} />
          {:else}
            <StepReview {form} />
          {/if}
        </div>
      </div>
      {#if last}
        <aside class="self-start rounded-xl border bg-card p-4 @4xl:sticky @4xl:top-17">
          <OrderSummary {form} final />
        </aside>
      {:else}
        <!-- Pinned between the topbar (top-17) and the footer (4rem + 1rem gap): the card fills
             that whole band, top level with the stepper, and scrolls inside once it is full. -->
        <aside
          class="hidden self-start @4xl:sticky @4xl:top-17 @4xl:block @4xl:h-[calc(100svh-9.25rem)]"
        >
          <div class="h-full w-full overflow-hidden rounded-xl border bg-card">
            <OrderSummary {form} final={false} />
          </div>
        </aside>
      {/if}
    </div>
    {#if !last}
      <WizardFooter {form} />
    {/if}
  </div>
</section>
