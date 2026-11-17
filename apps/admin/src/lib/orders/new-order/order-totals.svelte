<!-- Every figure here is the server's quote; nothing is computed in the browser. -->
<script lang="ts">
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  import * as Alert from '$lib/components/ui/alert/index.js';
  import { formatMoney } from '~/lib/format';
  import { t } from '~/lib/ui-text';
  import type { OrderForm } from './order-form.svelte';

  let {
    form,
    showReason = false,
    hideTotal = false,
  }: { form: OrderForm; showReason?: boolean; hideTotal?: boolean } = $props();

  const quote = $derived(form.quote);
  const money = (amount: string) => formatMoney(amount, quote?.currency ?? 'EUR');
</script>

{#if form.quoteProblem}
  <Alert.Root variant="destructive">
    <TriangleAlertIcon />
    <Alert.Description>{form.quoteProblem}</Alert.Description>
  </Alert.Root>
{/if}
{#if quote}
  <dl class="space-y-1.5 text-sm tabular-nums">
    <div class="flex justify-between">
      <dt class="text-muted-foreground">{t('newOrder.subtotal')}</dt>
      <dd>{money(quote.subtotal)}</dd>
    </div>
    <div class="flex justify-between">
      <dt class="text-muted-foreground">{t('newOrder.deliveryFee')}</dt>
      <dd>{money(quote.shippingTotal)}</dd>
    </div>
    {#if quote.discountTotal !== '0.00'}
      <div class="flex justify-between">
        <dt class="text-muted-foreground">{t('newOrder.discountTitle')}</dt>
        <dd>− {money(quote.discountTotal)}</dd>
      </div>
      {#if showReason && form.discountReason.trim()}
        <p class="text-xs text-muted-foreground italic">{form.discountReason}</p>
      {/if}
    {/if}
    <!-- The steps' summary pins its Total under its own scroll area, so it hides this one. -->
    {#if !hideTotal}
      <div class="flex justify-between border-t pt-2 text-base font-semibold">
        <dt>{t('newOrder.total')}</dt>
        <dd>{money(quote.total)}</dd>
      </div>
    {/if}
  </dl>
{:else if !form.quoteProblem}
  <p class="text-sm text-muted-foreground">{t('newOrder.totalsEmpty')}</p>
{/if}
