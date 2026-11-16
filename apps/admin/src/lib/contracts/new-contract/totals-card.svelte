<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { t } from '~/lib/ui-text';
  import type { ContractForm } from './contract-form.svelte';

  let { form }: { form: ContractForm } = $props();
</script>

<!-- Totals -->
<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">
    {t('contracts.totalsTitle')}
  </div>
  <div class="space-y-3 p-4">
    <MoneyInput label={t('contracts.delivery')} bind:value={form.shippingTotal} suffix="EUR" />
    <div class="space-y-1.5 border-t pt-3 text-sm">
      <div class="flex justify-between">
        <span class="text-muted-foreground">{t('contracts.subtotal')}</span>
        <span class="tabular-nums">{form.subtotal} EUR</span>
      </div>
      <div class="flex justify-between font-medium">
        <span>{t('contracts.total')}</span>
        <span class="tabular-nums">{form.total} EUR</span>
      </div>
    </div>
  </div>
</Card.Root>
