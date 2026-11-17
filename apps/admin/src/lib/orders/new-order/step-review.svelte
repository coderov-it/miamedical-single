<!--
  Step 4: one order sheet. Customer and delivery side by side, the products as compact
  rows, the discount on one line; every block with its way back to fix it. The totals and
  the Create button are in the Total card beside it, not here.
-->
<script lang="ts">
  import { BRANCHES } from '@mia/validators/branches';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { t } from '~/lib/ui-text';
  import type { OrderForm } from './order-form.svelte';
  import ReviewLines from './review-lines.svelte';
  import { CUSTOMER_TYPES } from './types';

  let { form }: { form: OrderForm } = $props();

  const pickup = $derived(form.deliveryMethod === 'storePickup');
  const branch = $derived(BRANCHES.find((entry) => pickup && entry.city === form.pickupCity));
  const name = $derived(`${form.firstName} ${form.lastName}`.trim());
  const typeKey = $derived(
    CUSTOMER_TYPES.find((type) => type.value === form.customerType)?.labelKey,
  );
  const fiscal = $derived(
    [
      form.codiceFiscale && `${t('newOrder.fieldCodiceFiscale')} ${form.codiceFiscale}`,
      form.partitaIva && `${t('newOrder.fieldPartitaIva')} ${form.partitaIva}`,
    ].filter(Boolean),
  );
  const returnLabel = $derived.by(() => {
    if (!form.returnToSameAddress)
      return `${t('newOrder.fieldReturnAddress')}: ${form.returnAddress}`;
    if (pickup) return t('newOrder.returnSameBranch');
    return t('newOrder.returnSame');
  });
  const deliveryLabel = $derived.by(() => {
    if (pickup) return t('newOrder.deliveryPickup');
    return t('newOrder.deliveryHome');
  });
</script>

{#snippet heading(title: string, step: number)}
  <div class="mb-2 flex items-center justify-between">
    <h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
    <Button variant="link" size="sm" class="h-auto p-0" onclick={() => form.goTo(step)}>
      {t('newOrder.edit')}
    </Button>
  </div>
{/snippet}

<Card.Root class="gap-0 divide-y py-0">
  <div class="grid gap-x-8 gap-y-5 p-4 sm:grid-cols-2">
    <section class="min-w-0 space-y-0.5 text-sm">
      {@render heading(t('newOrder.customerTitle'), 2)}
      <p class="font-medium">
        {form.email}
        {#if typeKey}<span class="ml-1 text-xs font-normal text-muted-foreground">
            · {t(typeKey)}
          </span>{/if}
      </p>
      {#if name}
        <p>{name}</p>
      {:else}
        <p class="text-muted-foreground">{t('newOrder.noNameYet')}</p>
      {/if}
      {#if form.phone}<p class="text-muted-foreground">{form.phone}</p>{/if}
      {#if fiscal.length > 0}<p class="text-xs text-muted-foreground">{fiscal.join(' · ')}</p>{/if}
    </section>
    <section class="min-w-0 space-y-0.5 text-sm">
      {@render heading(t('newOrder.deliveryTitle'), 2)}
      <p class="font-medium">{deliveryLabel}</p>
      <p>{branch ? `${branch.city} · ${branch.street}` : form.address}</p>
      <p class="text-muted-foreground">{returnLabel}</p>
      {#if form.notes.trim()}<p class="text-xs text-muted-foreground italic">{form.notes}</p>{/if}
    </section>
  </div>

  <section class="p-4">
    {@render heading(t('newOrder.linesTitle'), 1)}
    <ReviewLines {form} />
  </section>

  <section class="p-4">
    <h3 class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {t('newOrder.discountTitle')}
    </h3>
    <div class="flex flex-wrap items-start gap-4">
      <div class="w-35">
        <MoneyInput
          id="no-discount-amount"
          label={t('newOrder.fieldAmount')}
          suffix="EUR"
          error={form.fields.amount ?? form.fields['discount.amount']}
          bind:value={form.discountAmount}
        />
      </div>
      <div class="min-w-48 flex-1 sm:max-w-90">
        <Label class="mb-1.5" for="no-discount-reason">{t('newOrder.discountReason')}</Label>
        <Input
          id="no-discount-reason"
          bind:value={form.discountReason}
          maxlength={300}
          oninput={() => form.clear('reason')}
          aria-invalid={form.fields.reason ? 'true' : undefined}
        />
        {#if form.fields.reason}
          <p class="mt-1 text-xs text-destructive" role="alert">{form.fields.reason}</p>
        {/if}
      </div>
    </div>
  </section>
</Card.Root>
