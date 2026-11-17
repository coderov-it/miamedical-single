<!--
  Back and Next (Create on the last step), pinned to the bottom of the column.
  On narrow screens it also carries the running total, which opens the order
  summary in a sheet — the side panel does not fit there.
-->
<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ShoppingBagIcon from '@lucide/svelte/icons/shopping-bag';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { formatMoney } from '~/lib/format';
  import { t } from '~/lib/ui-text';
  import type { OrderForm } from './order-form.svelte';
  import OrderSummary from './order-summary.svelte';

  let { form }: { form: OrderForm } = $props();

  const countLabel = $derived.by(() => {
    const count = form.lines.length;
    if (count === 1) return t('newOrder.productCountOne', { count });
    return t('newOrder.productCountMany', { count });
  });
</script>

<!--
  The bar's line and page-grey ground run edge to edge (the ::before), while its buttons
  sit on the same two-column grid as the page: Back and Next at the edges of the left column.
-->
<div
  class="sticky bottom-0 z-10 mt-6 -mb-6 h-16 before:pointer-events-none before:absolute before:inset-y-0 before:-right-[100vw] before:-left-[100vw] before:-z-10 before:border-t before:border-border before:bg-background"
>
  <div class="grid h-full items-center gap-5 @4xl:grid-cols-[minmax(0,1fr)_28rem]">
    <div class="flex items-center gap-2">
      {#if form.step > 0}
        <Button variant="outline" onclick={() => form.back()}>
          <ArrowLeftIcon />
          {t('newOrder.back')}
        </Button>
      {/if}
      <div class="@4xl:hidden">
        <Sheet.Root>
          <Sheet.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant="outline" class="gap-2">
                <ShoppingBagIcon class="size-4" />
                <span class="tabular-nums">
                  {countLabel} · {form.quote
                    ? formatMoney(form.quote.total, form.quote.currency)
                    : '—'}
                </span>
              </Button>
            {/snippet}
          </Sheet.Trigger>
          <Sheet.Content side="bottom" class="max-h-[80vh] overflow-auto p-0">
            <Sheet.Header class="p-0">
              <Sheet.Title class="sr-only">{t('newOrder.summaryTitle')}</Sheet.Title>
            </Sheet.Header>
            <OrderSummary {form} />
          </Sheet.Content>
        </Sheet.Root>
      </div>
      <Button class="ml-auto" onclick={() => form.next()}>
        {t('newOrder.next')}
        <ArrowRightIcon />
      </Button>
    </div>
  </div>
</div>
