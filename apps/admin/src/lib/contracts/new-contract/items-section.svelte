<script lang="ts">
  import { P } from '@mia/permissions';
  import { perUnitLabel, unitLabel } from '@mia/i18n';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { api } from '~/lib/api';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { formatMoney } from '~/lib/format';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';
  import { uiLang } from '~/lib/ui-lang.svelte';
  import type { ContractForm } from './contract-form.svelte';
  import { endOf } from './item-draft';
  import { RESULT_ROW_CLASS, type ProductList } from './types';

  let { form }: { form: ContractForm } = $props();

  /** Which item row's product field is currently searching; one popover at a time. */
  let productSearchIndex = $state<number | null>(null);
  let productQuery = $state('');

  const productResults = new Resource(
    () => productQuery.trim(),
    async (q, signal) => {
      if (q.length < 2) return [] as ProductList;
      const res = await api.api.admin.products.$get(
        { query: { page: '1', perPage: '8', q, status: 'active' } },
        { init: { signal } },
      );
      const json = (await res.json()) as { data: ProductList };
      return json.data;
    },
    { enabled: () => session.can(P.PRODUCT_READ) && productSearchIndex !== null, debounce: 250 },
  );

  function onProductInput(index: number, value: string) {
    productSearchIndex = index;
    productQuery = value;
  }

  function pickProduct(index: number, product: ProductList[number]) {
    form.applyProduct(index, product);
    productSearchIndex = null;
    productQuery = '';
  }

  function removeItem(index: number) {
    form.removeItem(index);
    if (productSearchIndex === index) productSearchIndex = null;
  }
</script>

<!-- Items -->
<Card.Root class="gap-0 py-0">
  <div class="flex items-center justify-between border-b px-4 py-2.5">
    <span class="text-sm font-medium">{t('contracts.itemsTitle')}</span>
    <Button variant="ghost" size="sm" onclick={() => form.addItem()}>
      <PlusIcon class="size-4" />
      {t('contracts.addItem')}
    </Button>
  </div>
  <div class="space-y-4 p-4">
    {#each form.items as item, index (index)}
      <div class="space-y-3 rounded-lg border p-3">
        <div class="flex items-end gap-3">
          <div class="relative flex-1">
            <Label class="mb-1.5" for={`item-title-${index}`}>
              {t('contracts.itemProduct')}
            </Label>
            <Input
              id={`item-title-${index}`}
              bind:value={item.productTitle}
              placeholder={t('contracts.productPlaceholder')}
              autocomplete="off"
              oninput={(event) => onProductInput(index, event.currentTarget.value)}
              onfocus={() => onProductInput(index, item.productTitle)}
              onblur={() =>
                setTimeout(() => {
                  if (productSearchIndex === index) productSearchIndex = null;
                }, 150)}
            />
            {#if productSearchIndex === index && productQuery.trim().length >= 2}
              <div
                class="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-md border bg-popover shadow-md"
              >
                {#if productResults.loading && !productResults.hasData}
                  <p class="px-3 py-2 text-sm text-muted-foreground">
                    {t('contracts.searching')}
                  </p>
                {:else if (productResults.data ?? []).length === 0}
                  <p class="px-3 py-2 text-sm text-muted-foreground">
                    {t('contracts.productNoMatch')}
                  </p>
                {:else}
                  {#each productResults.data ?? [] as product (product.id)}
                    <button
                      type="button"
                      class={RESULT_ROW_CLASS}
                      onmousedown={(event) => {
                        event.preventDefault();
                        pickProduct(index, product);
                      }}
                    >
                      <span class="min-w-0 flex-1 truncate">{product.title}</span>
                      <span class="shrink-0 text-xs text-muted-foreground">
                        {formatMoney(product.basePrice, product.currency)}
                      </span>
                    </button>
                  {/each}
                {/if}
              </div>
            {/if}
          </div>
          {#if form.items.length > 1}
            <Button
              variant="ghost"
              size="icon"
              class="text-destructive"
              aria-label={t('contracts.removeItem')}
              onclick={() => removeItem(index)}
            >
              <Trash2Icon class="size-4" />
            </Button>
          {/if}
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <div>
            <Label class="mb-1.5" for={`item-qty-${index}`}>{t('contracts.itemQuantity')}</Label>
            <Input
              id={`item-qty-${index}`}
              type="number"
              min="1"
              bind:value={item.quantity}
              onchange={() => form.recomputeLineTotal(index)}
            />
          </div>
          <div>
            <Label class="mb-1.5" for={`item-duration-${index}`}>
              {t('contracts.itemDuration')}
            </Label>
            <div class="flex gap-2">
              <Input
                id={`item-duration-${index}`}
                type="number"
                min="1"
                bind:value={item.duration}
                onchange={() => form.recomputeLineTotal(index)}
              />
              <Select.Root type="single" bind:value={item.durationUnit}>
                <Select.Trigger class="w-28">
                  {unitLabel(item.durationUnit, uiLang.current, 'many')}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="day">
                    {unitLabel('day', uiLang.current, 'many')}
                  </Select.Item>
                  <Select.Item value="hour">
                    {unitLabel('hour', uiLang.current, 'many')}
                  </Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
          </div>
          <div onfocusout={() => form.recomputeLineTotal(index)}>
            <MoneyInput
              label={t('contracts.itemUnitPrice', {
                per: perUnitLabel(item.durationUnit, uiLang.current),
              })}
              bind:value={item.unitPrice}
              suffix="EUR"
            />
          </div>
          <div>
            <Label class="mb-1.5" for={`item-start-${index}`}>
              {t('contracts.itemStartDate')}
            </Label>
            <Input id={`item-start-${index}`} type="date" bind:value={item.startDate} />
          </div>
          {#if item.durationUnit === 'hour'}
            <div>
              <Label class="mb-1.5" for={`item-time-${index}`}>
                {t('contracts.itemStartTime')}
              </Label>
              <Input id={`item-time-${index}`} type="time" bind:value={item.startTime} />
            </div>
          {/if}
          <div>
            <!-- Derived, as on the storefront: the duration decides the end. -->
            <Label class="mb-1.5">{t('contracts.itemEnd')}</Label>
            <p
              class="flex h-9 items-center rounded-md border border-dashed px-3 text-sm tabular-nums"
            >
              {endOf(item)?.endDate ?? '—'}
              {endOf(item)?.endTime ?? ''}
            </p>
          </div>
          <MoneyInput label={t('contracts.itemLineTotal')} bind:value={item.total} suffix="EUR" />
        </div>
      </div>
    {/each}
  </div>
</Card.Root>
