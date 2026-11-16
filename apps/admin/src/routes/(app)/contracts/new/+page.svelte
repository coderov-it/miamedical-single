<!--
  Manual contract. For rentals that never went through the storefront — walk-ins,
  phone bookings, or a returning customer who needs a fresh contract.

  Three lookups feed the form so nothing has to be retyped: an earlier contract
  (copies customer + items, deliberately not dates), a past customer from the
  order history, and the product catalogue per line item. All three are plain
  text searches by name, email, phone or title. The sections and the shared form
  state live in `$lib/contracts/new-contract/`.
-->
<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

  import { Button } from '$lib/components/ui/button/index.js';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { ContractForm } from '~/lib/contracts/new-contract/contract-form.svelte';
  import ContractTypeCard from '~/lib/contracts/new-contract/contract-type-card.svelte';
  import CreateCard from '~/lib/contracts/new-contract/create-card.svelte';
  import CustomerSection from '~/lib/contracts/new-contract/customer-section.svelte';
  import ItemsSection from '~/lib/contracts/new-contract/items-section.svelte';
  import SourceSection from '~/lib/contracts/new-contract/source-section.svelte';
  import TotalsCard from '~/lib/contracts/new-contract/totals-card.svelte';
  import { routes } from '~/lib/routes';
  import { t } from '~/lib/ui-text';

  const form = new ContractForm();
</script>

<section class="admin-page">
  <PageHeader
    eyebrow={t('contracts.listTitle')}
    title={t('contracts.newContract')}
    description={t('contracts.newDescription')}
  >
    {#snippet actions()}
      <Button href={routes.contracts} variant="outline">
        <ArrowLeftIcon />
        {t('contracts.backToContracts')}
      </Button>
    {/snippet}
  </PageHeader>

  <div class="@container grid gap-5 @4xl:grid-cols-3">
    <div class="space-y-5 @4xl:col-span-2">
      <SourceSection {form} />
      <CustomerSection {form} />
      <ItemsSection {form} />
    </div>

    <div class="space-y-5">
      <ContractTypeCard {form} />
      <TotalsCard {form} />
      <CreateCard {form} />
    </div>
  </div>
</section>
