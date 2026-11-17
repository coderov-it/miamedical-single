<!-- What can be added for a customer who has no account yet. All of it is optional. -->
<script lang="ts">
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { cn } from '$lib/utils.js';
  import { t } from '~/lib/ui-text';
  import type { OrderForm } from './order-form.svelte';
  import { CUSTOMER_TYPES } from './types';

  let { form }: { form: OrderForm } = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2">
  <div>
    <Label class="mb-1.5" for="no-first-name">{t('newOrder.fieldFirstName')}</Label>
    <Input id="no-first-name" bind:value={form.firstName} />
  </div>
  <div>
    <Label class="mb-1.5" for="no-last-name">{t('newOrder.fieldLastName')}</Label>
    <Input id="no-last-name" bind:value={form.lastName} />
  </div>
  <div>
    <Label class="mb-1.5" for="no-phone">{t('newOrder.fieldPhone')}</Label>
    <Input id="no-phone" bind:value={form.phone} placeholder="+39 …" />
    {#if form.fields.phone}
      <p class="mt-1 text-xs text-destructive" role="alert">{form.fields.phone}</p>
    {/if}
  </div>
  <div>
    <Label class="mb-1.5">{t('newOrder.fieldCustomerType')}</Label>
    <div class="flex w-fit items-center gap-1 rounded-lg border bg-card p-1">
      {#each CUSTOMER_TYPES as type (type.value)}
        {@const active = form.customerType === type.value}
        <button
          type="button"
          onclick={() => (form.customerType = active ? '' : type.value)}
          aria-pressed={active}
          class={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {t(type.labelKey)}
        </button>
      {/each}
    </div>
  </div>
  {#if form.customerType === 'private' || form.customerType === 'company'}
    <div>
      <Label class="mb-1.5" for="no-codice-fiscale">{t('newOrder.fieldCodiceFiscale')}</Label>
      <Input id="no-codice-fiscale" bind:value={form.codiceFiscale} />
    </div>
  {/if}
  {#if form.customerType === 'company'}
    <div>
      <Label class="mb-1.5" for="no-partita-iva">{t('newOrder.fieldPartitaIva')}</Label>
      <Input id="no-partita-iva" bind:value={form.partitaIva} />
    </div>
  {/if}
</div>
