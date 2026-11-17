<!-- Every figure here is the server's quote; nothing is computed in the browser. -->
<script lang="ts">
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  import * as Alert from '$lib/components/ui/alert/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import { formatDate, formatMoney } from '~/lib/format';
  import { t } from '~/lib/ui-text';
  import type { OrderForm } from './order-form.svelte';

  let { form }: { form: OrderForm } = $props();

  const quote = $derived(form.quote);
  const money = (amount: string) => formatMoney(amount, quote?.currency ?? 'EUR');
</script>

<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">{t('newOrder.totalsTitle')}</div>
  <div class="space-y-3 p-4 text-sm">
    {#if form.quoteProblem}
      <Alert.Root variant="destructive">
        <TriangleAlertIcon />
        <Alert.Description>{form.quoteProblem}</Alert.Description>
      </Alert.Root>
    {/if}
    {#if quote}
      <ul class="space-y-2">
        {#each quote.lines as line, index (index)}
          <li class="flex justify-between gap-3">
            <span class="min-w-0">
              <span class="block truncate">{line.quantity} × {line.productTitle}</span>
              {#if line.packageLabel && line.startDate}
                <span class="block text-xs text-muted-foreground">
                  {line.packageLabel} · {formatDate(line.startDate)}
                </span>
              {/if}
            </span>
            <span class="tabular-nums">{money(line.total)}</span>
          </li>
        {/each}
      </ul>
      <dl class="space-y-1.5 border-t pt-3 tabular-nums">
        <div class="flex justify-between">
          <dt class="text-muted-foreground">{t('newOrder.subtotal')}</dt>
          <dd>{money(quote.subtotal)}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted-foreground">{t('newOrder.deliveryFee')}</dt>
          <dd>{money(quote.shippingTotal)}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted-foreground">{t('newOrder.discountTitle')}</dt>
          <dd>− {money(quote.discountTotal)}</dd>
        </div>
        <div class="flex justify-between border-t pt-1.5 font-semibold">
          <dt>{t('newOrder.total')}</dt>
          <dd>{money(quote.total)}</dd>
        </div>
      </dl>
    {:else if !form.quoteProblem}
      <p class="text-muted-foreground">{t('newOrder.totalsEmpty')}</p>
    {/if}
    <BusyButton
      class="w-full"
      busy={form.busy}
      busyLabel={t('newOrder.creating')}
      onclick={() => form.create()}
    >
      {t('newOrder.create')}
    </BusyButton>
  </div>
</Card.Root>
