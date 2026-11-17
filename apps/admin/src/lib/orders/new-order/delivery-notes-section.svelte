<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { cn } from '$lib/utils.js';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { type MessageKey, t } from '~/lib/ui-text';
  import type { OrderForm } from './order-form.svelte';
  import type { DeliveryMethod } from './types';

  let { form }: { form: OrderForm } = $props();

  const METHODS: { value: DeliveryMethod; labelKey: MessageKey }[] = [
    { value: 'homeDelivery', labelKey: 'newOrder.deliveryHome' },
    { value: 'storePickup', labelKey: 'newOrder.deliveryPickup' },
  ];
</script>

{#snippet error(key: string)}
  {#if form.fields[key]}
    <p class="mt-1 text-xs text-destructive" role="alert">{form.fields[key]}</p>
  {/if}
{/snippet}

<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">{t('newOrder.deliveryTitle')}</div>
  <div class="space-y-4 p-4">
    <div class="flex w-fit items-center gap-1 rounded-lg border bg-card p-1">
      {#each METHODS as method (method.value)}
        {@const active = form.deliveryMethod === method.value}
        <button
          type="button"
          onclick={() => (form.deliveryMethod = method.value)}
          aria-pressed={active}
          class={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {t(method.labelKey)}
        </button>
      {/each}
    </div>

    {#if form.deliveryMethod === 'homeDelivery'}
      <div>
        <Label class="mb-1.5" for="no-address">{t('newOrder.fieldAddress')}</Label>
        <Textarea
          id="no-address"
          bind:value={form.address}
          rows={2}
          aria-invalid={form.fields['delivery.address'] ? 'true' : undefined}
        />
        {@render error('delivery.address')}
      </div>
    {:else}
      <div>
        <Label class="mb-1.5" for="no-pickup">{t('newOrder.fieldPickupCity')}</Label>
        <Input
          id="no-pickup"
          bind:value={form.pickupCity}
          aria-invalid={form.fields['delivery.pickupCity'] ? 'true' : undefined}
        />
        {@render error('delivery.pickupCity')}
      </div>
    {/if}

    <div class="flex items-center gap-2">
      <Checkbox id="no-return-same" bind:checked={form.returnToSameAddress} />
      <Label for="no-return-same">{t('newOrder.returnSame')}</Label>
    </div>
    {#if !form.returnToSameAddress}
      <div>
        <Label class="mb-1.5" for="no-return-address">{t('newOrder.fieldReturnAddress')}</Label>
        <Input
          id="no-return-address"
          bind:value={form.returnAddress}
          aria-invalid={form.fields['delivery.returnAddress'] ? 'true' : undefined}
        />
        {@render error('delivery.returnAddress')}
      </div>
    {/if}

    <MoneyInput
      id="no-shipping"
      label={t('newOrder.deliveryFee')}
      suffix="EUR"
      error={form.fields.shippingTotal}
      bind:value={form.shippingTotal}
    />

    <div>
      <Label class="mb-1.5" for="no-notes">{t('newOrder.fieldNotes')}</Label>
      <Textarea id="no-notes" bind:value={form.notes} maxlength={1000} rows={3} />
    </div>
  </div>
</Card.Root>
