<!-- Step 3. Who the order is for, then how it gets to them. -->
<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { t } from '~/lib/ui-text';
  import CustomerCard from './customer-card.svelte';
  import CustomerFields from './customer-fields.svelte';
  import CustomerPicker from './customer-picker.svelte';
  import DeliveryFields from './delivery-fields.svelte';
  import type { OrderForm } from './order-form.svelte';

  let { form }: { form: OrderForm } = $props();
</script>

<div class="space-y-5">
  <Card.Root class="gap-0 py-0">
    <div class="border-b px-4 py-2.5 text-sm font-medium">{t('newOrder.customerTitle')}</div>
    <div class="space-y-4 p-4">
      {#if form.accountId}
        <CustomerCard {form} onChange={() => form.clearAccount()} />
      {:else}
        <CustomerPicker {form} />
        <div class="space-y-3 border-t pt-4">
          <CustomerFields {form} />
        </div>
      {/if}
    </div>
  </Card.Root>

  <Card.Root class="gap-0 py-0">
    <div class="border-b px-4 py-2.5 text-sm font-medium">{t('newOrder.deliveryTitle')}</div>
    <div class="p-4"><DeliveryFields {form} /></div>
  </Card.Root>
</div>
