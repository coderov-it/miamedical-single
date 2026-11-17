<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { t } from '~/lib/ui-text';
  import type { OrderForm } from './order-form.svelte';

  let { form }: { form: OrderForm } = $props();
</script>

<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">{t('newOrder.discountTitle')}</div>
  <div class="grid gap-4 p-4 sm:grid-cols-[auto_1fr]">
    <MoneyInput
      id="no-discount-amount"
      label={t('newOrder.discountAmount')}
      suffix="EUR"
      error={form.fields.amount ?? form.fields['discount.amount']}
      bind:value={form.discountAmount}
    />
    <div>
      <Label class="mb-1.5" for="no-discount-reason">{t('newOrder.discountReason')}</Label>
      <Input
        id="no-discount-reason"
        bind:value={form.discountReason}
        maxlength={300}
        aria-invalid={form.fields.reason ? 'true' : undefined}
      />
      {#if form.fields.reason}
        <p class="mt-1 text-xs text-destructive" role="alert">{form.fields.reason}</p>
      {/if}
    </div>
  </div>
</Card.Root>
