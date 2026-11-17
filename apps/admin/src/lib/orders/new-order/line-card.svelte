<!--
  One line of the order: what the product asks about (package and start for a
  rental, add-ons, intake questions). No price field: the quote prices the line.
-->
<script lang="ts">
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import NumberStepper from '~/lib/components/number-stepper.svelte';
  import { formatMoney } from '~/lib/format';
  import { t } from '~/lib/ui-text';
  import { type LineDraft, isRental, needsTime, packageOf } from './line-draft';
  import type { OrderForm } from './order-form.svelte';

  interface Props {
    form: OrderForm;
    line: LineDraft;
    index: number;
  }

  let { form, line, index }: Props = $props();

  const at = $derived(`items.${index}`);
  const id = (suffix: string) => `no-line-${index}-${suffix}`;
  const packageLabel = $derived(packageOf(line)?.label ?? t('newOrder.packagePlaceholder'));

  /** The native input a free-answer question uses. */
  function inputType(valueType: string): 'number' | 'date' | 'text' {
    if (valueType === 'number') return 'number';
    if (valueType === 'date') return 'date';
    return 'text';
  }

  function answer(key: string): string[] {
    return line.answers[key] ?? [];
  }

  function toggleValue(key: string, value: string, on: boolean) {
    const current = answer(key).filter((entry) => entry !== value);
    line.answers[key] = on ? [...current, value] : current;
  }
</script>

{#snippet error(key: string)}
  {#if form.fields[key]}
    <p class="mt-1 text-xs text-destructive" role="alert">{form.fields[key]}</p>
  {/if}
{/snippet}

<div class="space-y-4 rounded-lg border p-3">
  <div class="flex items-center justify-between gap-3">
    <span class="font-medium">{line.product.title}</span>
    <Button
      variant="ghost"
      size="icon"
      class="text-destructive"
      aria-label={t('newOrder.removeLine')}
      onclick={() => form.removeLine(index)}
    >
      <Trash2Icon class="size-4" />
    </Button>
  </div>

  <div class="grid gap-3 sm:grid-cols-2">
    <div>
      <Label class="mb-1.5" for={id('quantity')}>{t('newOrder.quantity')}</Label>
      <NumberStepper
        id={id('quantity')}
        label={t('newOrder.quantity')}
        min={1}
        bind:value={line.quantity}
      />
      {@render error(`${at}.quantity`)}
    </div>

    {#if isRental(line)}
      <div>
        <Label class="mb-1.5" for={id('package')}>{t('newOrder.package')}</Label>
        <Select.Root type="single" bind:value={line.packageCode}>
          <Select.Trigger
            id={id('package')}
            class="w-full"
            aria-invalid={form.fields[`${at}.rentalPackageCode`] ? 'true' : undefined}
          >
            {packageLabel}
          </Select.Trigger>
          <Select.Content>
            {#each line.product.packages as pkg (pkg.code)}
              <Select.Item value={pkg.code}>{pkg.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        {@render error(`${at}.rentalPackageCode`)}
      </div>
      <div>
        <Label class="mb-1.5" for={id('date')}>{t('newOrder.startDate')}</Label>
        <Input
          id={id('date')}
          type="date"
          bind:value={line.startDate}
          aria-invalid={form.fields[`${at}.startDate`] ? 'true' : undefined}
        />
        {@render error(`${at}.startDate`)}
      </div>
      {#if needsTime(line)}
        <div>
          <Label class="mb-1.5" for={id('time')}>{t('newOrder.startTime')}</Label>
          <Input
            id={id('time')}
            type="time"
            bind:value={line.startTime}
            aria-invalid={form.fields[`${at}.startTime`] ? 'true' : undefined}
          />
          {@render error(`${at}.startTime`)}
        </div>
      {/if}
    {/if}
  </div>

  {#if line.product.addons.length > 0}
    <div class="space-y-2" id={id('addons')}>
      <p class="text-sm font-medium">{t('newOrder.addons')}</p>
      {#each line.product.addons as addon (addon.id)}
        <div class="flex items-center justify-between gap-3 text-sm">
          <span>
            {addon.name}
            <span class="text-muted-foreground">· {formatMoney(addon.price, 'EUR')}</span>
          </span>
          <div class="w-40">
            <NumberStepper
              label={addon.name}
              min={0}
              max={addon.maxQuantity ?? 10}
              bind:value={
                () => line.addons[addon.id] ?? 0, (value) => (line.addons[addon.id] = value)
              }
            />
          </div>
        </div>
      {/each}
      {@render error(`${at}.addons`)}
    </div>
  {/if}

  {#if line.product.questions.length > 0}
    <div class="space-y-3">
      {#each line.product.questions as question (question.key)}
        {@const answerId = id(`answer-${question.key}`)}
        <div>
          <Label class="mb-1.5" for={answerId}>
            {question.prompt}{question.isRequired ? ' *' : ''}
          </Label>
          {#if question.valueType === 'single_select'}
            <Select.Root
              type="single"
              value={answer(question.key)[0] ?? ''}
              onValueChange={(value) => (line.answers[question.key] = value ? [value] : [])}
            >
              <Select.Trigger id={answerId} class="w-full">
                {question.options.find((option) => option.value === answer(question.key)[0])
                  ?.label ?? '—'}
              </Select.Trigger>
              <Select.Content>
                {#each question.options as option (option.value)}
                  <Select.Item value={option.value}>{option.label}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          {:else if question.valueType === 'multi_select'}
            <div class="space-y-1.5" id={answerId} tabindex="-1">
              {#each question.options as option (option.value)}
                <div class="flex items-center gap-2 text-sm">
                  <Checkbox
                    id={`${answerId}-${option.value}`}
                    checked={answer(question.key).includes(option.value)}
                    onCheckedChange={(on) => toggleValue(question.key, option.value, on === true)}
                  />
                  <Label for={`${answerId}-${option.value}`}>{option.label}</Label>
                </div>
              {/each}
            </div>
          {:else if question.valueType === 'boolean'}
            <Checkbox
              id={answerId}
              checked={answer(question.key)[0] === 'yes'}
              onCheckedChange={(on) => (line.answers[question.key] = [on === true ? 'yes' : 'no'])}
            />
          {:else}
            <Input
              id={answerId}
              type={inputType(question.valueType)}
              value={answer(question.key)[0] ?? ''}
              oninput={(event) => (line.answers[question.key] = [event.currentTarget.value])}
              aria-invalid={form.fields[`${at}.answers.${question.key}`] ? 'true' : undefined}
            />
          {/if}
          {@render error(`${at}.answers.${question.key}`)}
        </div>
      {/each}
    </div>
  {/if}
</div>
