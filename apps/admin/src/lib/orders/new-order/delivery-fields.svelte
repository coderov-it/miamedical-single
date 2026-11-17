<!-- How the goods reach the customer: method, where (one of our two branches for a pick-up), the fee, and a note. -->
<script lang="ts">
  import MapPinIcon from '@lucide/svelte/icons/map-pin';
  import StoreIcon from '@lucide/svelte/icons/store';
  import TruckIcon from '@lucide/svelte/icons/truck';

  import { BRANCHES } from '@mia/validators/branches';

  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { cn } from '$lib/utils.js';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { t } from '~/lib/ui-text';
  import type { OrderForm } from './order-form.svelte';

  let { form }: { form: OrderForm } = $props();

  const returnLabel = $derived.by(() => {
    if (form.deliveryMethod === 'storePickup') return t('newOrder.returnSameBranch');
    return t('newOrder.returnSame');
  });

  const METHODS = [
    { value: 'homeDelivery', labelKey: 'newOrder.deliveryHome', icon: TruckIcon },
    { value: 'storePickup', labelKey: 'newOrder.deliveryPickup', icon: StoreIcon },
  ] as const;
</script>

{#snippet error(key: string)}
  {#if form.fields[key]}
    <p class="mt-1 text-xs text-destructive" role="alert">{form.fields[key]}</p>
  {/if}
{/snippet}

<div class="space-y-4">
  <div class="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t('newOrder.deliveryTitle')}>
    {#each METHODS as method (method.value)}
      {@const active = form.deliveryMethod === method.value}
      <button
        type="button"
        role="radio"
        aria-checked={active}
        onclick={() => {
          form.deliveryMethod = method.value;
          form.clear('delivery.address');
          form.clear('delivery.pickupCity');
        }}
        class={cn(
          'flex items-center gap-3 rounded-xl border bg-card p-3 text-left text-sm font-medium transition-colors outline-none',
          'hover:border-foreground/25 focus-visible:ring-[3px] focus-visible:ring-ring/50',
          active && 'border-primary bg-primary/5 ring-2 ring-primary',
        )}
      >
        <method.icon class="size-5 text-muted-foreground" />
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
        oninput={() => form.clear('delivery.address')}
        aria-invalid={form.fields['delivery.address'] ? 'true' : undefined}
      />
      {@render error('delivery.address')}
    </div>
  {:else}
    <div>
      <p class="mb-1.5 text-sm font-medium">{t('newOrder.fieldPickupCity')}</p>
      <div
        id="no-pickup"
        role="radiogroup"
        tabindex="-1"
        aria-label={t('newOrder.fieldPickupCity')}
        aria-invalid={form.fields['delivery.pickupCity'] ? 'true' : undefined}
        class="grid gap-2 rounded-xl outline-none sm:grid-cols-2"
      >
        {#each BRANCHES as branch (branch.city)}
          {@const active = form.pickupCity === branch.city}
          <button
            type="button"
            role="radio"
            aria-checked={active}
            onclick={() => {
              form.pickupCity = branch.city;
              form.clear('delivery.pickupCity');
            }}
            class={cn(
              'flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors outline-none',
              'hover:border-foreground/25 focus-visible:ring-[3px] focus-visible:ring-ring/50',
              active && 'border-primary bg-primary/5 ring-2 ring-primary',
              form.fields['delivery.pickupCity'] && !active && 'border-destructive/60',
            )}
          >
            <MapPinIcon class="size-5 shrink-0 text-muted-foreground" />
            <span class="min-w-0">
              <span class="block text-sm font-medium">{branch.city}</span>
              <span class="block truncate text-xs text-muted-foreground">{branch.street}</span>
            </span>
          </button>
        {/each}
      </div>
      {@render error('delivery.pickupCity')}
    </div>
  {/if}

  <div class="flex items-center gap-2">
    <Checkbox id="no-return-same" bind:checked={form.returnToSameAddress} />
    <Label for="no-return-same">{returnLabel}</Label>
  </div>
  {#if !form.returnToSameAddress}
    <div>
      <Label class="mb-1.5" for="no-return-address">{t('newOrder.fieldReturnAddress')}</Label>
      <Input
        id="no-return-address"
        bind:value={form.returnAddress}
        oninput={() => form.clear('delivery.returnAddress')}
        aria-invalid={form.fields['delivery.returnAddress'] ? 'true' : undefined}
      />
      {@render error('delivery.returnAddress')}
    </div>
  {/if}

  <div class="grid gap-4 sm:grid-cols-[12rem_1fr]">
    <MoneyInput
      id="no-shipping"
      label={t('newOrder.deliveryFee')}
      suffix="EUR"
      error={form.fields.shippingTotal}
      bind:value={form.shippingTotal}
    />
    <div>
      <Label class="mb-1.5" for="no-notes">{t('newOrder.fieldNotes')}</Label>
      <Textarea id="no-notes" bind:value={form.notes} maxlength={1000} rows={2} />
    </div>
  </div>
</div>
