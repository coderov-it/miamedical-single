<!--
  Add-ons as toggle cards, like the storefront's extras: tick to take one, and a
  stepper appears on those the back office allows more than one of. A per-day
  add-on states its rate; the quote does the multiplying.
-->
<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';

  import { cn } from '$lib/utils.js';
  import NumberStepper from '~/lib/components/number-stepper.svelte';
  import { formatMoney } from '~/lib/format';
  import { t } from '~/lib/ui-text';
  import type { LineDraft } from './line-draft';
  import { UNIT_LABELS } from './types';

  interface Props {
    id: string;
    line: LineDraft;
  }

  let { id, line }: Props = $props();

  const DEFAULT_MAX = 10;
  const quantityOf = (addonId: string) => line.addons[addonId] ?? 0;
  const allowsMany = (max: number | null) => max === null || max > 1;

  function toggle(addon: LineDraft['product']['addons'][number]) {
    line.addons[addon.id] = quantityOf(addon.id) > 0 ? 0 : Math.max(1, addon.minQuantity);
  }
</script>

<div {id} class="grid gap-2 sm:grid-cols-2">
  {#each line.product.addons as addon (addon.id)}
    {@const taken = quantityOf(addon.id) > 0}
    <div
      class={cn(
        'rounded-xl border bg-card transition-colors',
        taken && 'border-primary bg-primary/5 ring-2 ring-primary',
      )}
    >
      <button
        type="button"
        aria-pressed={taken}
        onclick={() => toggle(addon)}
        class="flex w-full items-center gap-3 rounded-xl p-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span
          class={cn(
            'grid size-5 shrink-0 place-items-center rounded-md border',
            taken && 'border-primary bg-primary text-primary-foreground',
          )}
        >
          {#if taken}<CheckIcon class="size-3.5" strokeWidth={3} />{/if}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-medium">{addon.name}</span>
          {#if addon.description}
            <span class="block truncate text-xs text-muted-foreground">{addon.description}</span>
          {/if}
        </span>
        <span class="shrink-0 text-sm font-semibold tabular-nums">
          {formatMoney(addon.price, 'EUR')}
          {#if addon.rentalUnit}
            <span class="text-xs font-normal text-muted-foreground">
              / {t(UNIT_LABELS[addon.rentalUnit])}
            </span>
          {/if}
        </span>
      </button>
      {#if taken && allowsMany(addon.maxQuantity)}
        <div class="flex items-center justify-between gap-3 border-t px-3 py-2">
          <span class="text-xs text-muted-foreground">{t('newOrder.quantity')}</span>
          <div class="w-36">
            <NumberStepper
              label={addon.name}
              min={Math.max(1, addon.minQuantity)}
              max={addon.maxQuantity ?? DEFAULT_MAX}
              bind:value={() => quantityOf(addon.id), (value) => (line.addons[addon.id] = value)}
            />
          </div>
        </div>
      {/if}
    </div>
  {/each}
</div>
