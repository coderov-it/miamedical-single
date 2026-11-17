<!--
  Order by phone. An agent raises an order for a customer who called or wrote:
  email is enough to start, the lines are priced by the server, and the customer
  finishes (details, contract, payment) from a link sent from the order's page.
  Docs: docs/code/manual-orders.md. Sections live in `$lib/orders/new-order/`.
-->
<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

  import { Button } from '$lib/components/ui/button/index.js';
  import PageHeader from '~/lib/components/page-header.svelte';
  import CustomerSection from '~/lib/orders/new-order/customer-section.svelte';
  import DeliveryNotesSection from '~/lib/orders/new-order/delivery-notes-section.svelte';
  import DiscountSection from '~/lib/orders/new-order/discount-section.svelte';
  import LinesSection from '~/lib/orders/new-order/lines-section.svelte';
  import { OrderForm } from '~/lib/orders/new-order/order-form.svelte';
  import TotalsCard from '~/lib/orders/new-order/totals-card.svelte';
  import { routes } from '~/lib/routes';
  import { t } from '~/lib/ui-text';

  const form = new OrderForm();
</script>

<section class="admin-page">
  <PageHeader
    eyebrow={t('nav.sales')}
    title={t('newOrder.pageTitle')}
    description={t('newOrder.pageDescription')}
  >
    {#snippet actions()}
      <Button href={routes.orders} variant="outline">
        <ArrowLeftIcon />
        {t('newOrder.backToOrders')}
      </Button>
    {/snippet}
  </PageHeader>

  <div class="@container grid gap-5 @4xl:grid-cols-3">
    <div class="space-y-5 @4xl:col-span-2">
      <CustomerSection {form} />
      <LinesSection {form} />
      <DiscountSection {form} />
      <DeliveryNotesSection {form} />
    </div>
    <div class="space-y-5 @4xl:sticky @4xl:top-4 @4xl:self-start">
      <TotalsCard {form} />
    </div>
  </div>
</section>
