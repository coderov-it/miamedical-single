<!--
  The order so far: the lines picked and the running total, always in view. A
  line shows its price only once the server has quoted it. Removing a line is
  offered while the products can still change (steps 1 and 2).
-->
<script lang="ts">
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import ImageOffIcon from '@lucide/svelte/icons/image-off';
  import XIcon from '@lucide/svelte/icons/x';

  import { Button } from '$lib/components/ui/button/index.js';
  import { cn } from '$lib/utils.js';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import { mediaUrl } from '~/lib/api';
  import { formatMoney } from '~/lib/format';
  import { t } from '~/lib/ui-text';
  import { type LineDraft, packageOf, pendingMessage } from './line-draft';
  import type { OrderForm } from './order-form.svelte';
  import OrderTotals from './order-totals.svelte';

  let { form, final = false }: { form: OrderForm; final?: boolean } = $props();

  /** What sits under a line: its package once priced, else what it still needs. */
  function detail(line: LineDraft, priced: boolean): string {
    if (priced) return packageOf(line)?.name ?? line.product.category.name;
    const missing = pendingMessage(line);
    return missing ? t(missing) : t('newOrder.linePendingShort');
  }

  const title = $derived.by(() => {
    if (final) return t('newOrder.total');
    return t('newOrder.summaryTitle');
  });
  /** Lines plus the cards still loading their choices. */
  const count = $derived(form.lines.length + form.pendingCards.size);
  const editable = $derived(!final && form.step <= 1);
</script>

<!-- In the steps the card fills its column: the title stays pinned at the top, the Total row
     (once there is one) at the bottom, and only the lines between them scroll. On the review
     it is a plain stack ending in Create order. -->
<div class={cn(!final && 'flex h-full flex-col')}>
  <div class={cn('flex items-center justify-between', final ? 'mb-4' : 'border-b px-4 py-3')}>
    <h2 class="text-sm font-semibold">{title}</h2>
    {#if !final && count > 0}
      <span class="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
        {count}
      </span>
    {/if}
  </div>
  <div class={cn('space-y-4', !final && 'flex min-h-0 flex-1 flex-col overflow-y-auto p-4')}>
    <!-- On the review the lines are in the order sheet; this card is only the money and the way out. -->
    {#if !final && count === 0}
      <p class="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
        {t('newOrder.summaryEmpty')}
      </p>
    {:else if !final}
      <ul class="space-y-3">
        {#each form.lines as line, index (line.key)}
          {@const quoted = form.quoteLine(line)}
          <li class="flex items-center gap-3">
            <span
              class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted"
            >
              {#if line.product.image}
                <img src={mediaUrl(line.product.image)} alt="" class="size-full object-contain" />
              {:else}
                <ImageOffIcon class="size-4 text-muted-foreground" />
              {/if}
            </span>
            <span class="min-w-0 flex-1 text-sm">
              <span class="block truncate">{line.quantity} × {line.product.title}</span>
              <span
                class={cn(
                  'block truncate text-xs',
                  quoted ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400',
                )}
              >
                {detail(line, quoted !== null)}
              </span>
            </span>
            <span
              class={cn(
                'text-sm tabular-nums transition-opacity',
                form.lineQuoting(line) && 'opacity-30',
              )}
            >
              {quoted ? formatMoney(quoted.total, 'EUR') : '—'}
            </span>
            {#if editable}
              <button
                type="button"
                class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                aria-label={t('newOrder.removeLine')}
                onclick={() => form.removeLine(index)}
              >
                <XIcon class="size-4" />
              </button>
            {/if}
          </li>
        {/each}
        {#each [...form.pendingCards.values()] as card (card.id)}
          <li class="flex items-center gap-3">
            <span
              class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted"
            >
              {#if card.image}
                <img src={mediaUrl(card.image)} alt="" class="size-full object-contain" />
              {:else}
                <ImageOffIcon class="size-4 text-muted-foreground" />
              {/if}
            </span>
            <span class="min-w-0 flex-1 text-sm">
              <span class="block truncate">{card.title}</span>
              <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <LoaderCircleIcon class="size-3 animate-spin" />
                {t('newOrder.loadingOptions')}
              </span>
            </span>
            <button
              type="button"
              class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
              aria-label={t('newOrder.removeLine')}
              onclick={() => form.cancelPending(card.id)}
            >
              <XIcon class="size-4" />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
    {#if form.quote || form.quoteProblem}
      <div
        class={cn(
          'transition-opacity',
          !final && 'mt-auto border-t pt-3',
          form.quoting && 'opacity-30',
        )}
      >
        <OrderTotals {form} showReason={final} hideTotal={!final} />
      </div>
    {/if}
  </div>
  {#if !final && form.quote}
    <div
      class="flex items-center justify-between border-t px-4 py-3 text-base font-semibold tabular-nums"
      aria-busy={form.quoting}
    >
      <span class="flex items-center gap-2">
        {t('newOrder.total')}
        {#if form.quoting}
          <span class="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
            <LoaderCircleIcon class="size-3.5 animate-spin" />
            {t('newOrder.updatingPrice')}
          </span>
        {/if}
      </span>
      <span class={cn('transition-opacity', form.quoting && 'opacity-30')}>
        {formatMoney(form.quote.total, form.quote.currency)}
      </span>
    </div>
  {/if}
  {#if final}
    <BusyButton
      class="w-full"
      busy={form.busy}
      busyLabel={t('newOrder.creating')}
      onclick={() => form.create()}
    >
      {t('newOrder.create')}
    </BusyButton>
    <Button variant="link" class="w-full" onclick={() => form.back()}>{t('newOrder.back')}</Button>
  {/if}
</div>
