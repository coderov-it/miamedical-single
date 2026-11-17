<!--
  One selected product, configured. A rental asks for a package, a start (and a time
  for hour packages) and shows the end date it implies; a sale asks for a quantity.
  The price strip is the server's quote for this line — nothing is computed here.
-->
<script lang="ts">
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ImageOffIcon from '@lucide/svelte/icons/image-off';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { cn } from '$lib/utils.js';
  import { mediaUrl } from '~/lib/api';
  import DateField from '~/lib/components/date-field.svelte';
  import NumberStepper from '~/lib/components/number-stepper.svelte';
  import { formatDate, formatMoney } from '~/lib/format';
  import { t } from '~/lib/ui-text';
  import AddonPicker from './addon-picker.svelte';
  import KindBadge from './kind-badge.svelte';
  import { type LineDraft, isRental, needsTime, pendingMessage } from './line-draft';
  import type { OrderForm } from './order-form.svelte';
  import PackagePicker from './package-picker.svelte';
  import QuestionField from './question-field.svelte';

  interface Props {
    form: OrderForm;
    line: LineDraft;
    index: number;
  }

  let { form, line, index }: Props = $props();

  const at = $derived(`items.${index}`);
  const id = (suffix: string) => `no-line-${index}-${suffix}`;
  const quoted = $derived(form.quoteLine(line));
  /** Only this line's own change makes it wait; a line still missing its date never spins. */
  const busy = $derived(form.lineQuoting(line));
  const today = new Date().toLocaleDateString('en-CA');
  const maxQuantity = $derived(!isRental(line) && line.product.stock > 0 ? line.product.stock : 99);
</script>

{#snippet error(key: string)}
  {#if form.fields[key]}
    <p class="mt-1 text-xs text-destructive" role="alert">{form.fields[key]}</p>
  {/if}
{/snippet}

{#snippet section(title: string)}
  <h4 class="mb-2 text-sm font-medium">{title}</h4>
{/snippet}

<article class="scroll-mb-28 overflow-hidden rounded-xl border bg-card">
  <header class="flex items-center gap-3 border-b bg-muted/40 p-3">
    <span
      class="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border bg-background"
    >
      {#if line.product.image}
        <img src={mediaUrl(line.product.image)} alt="" class="size-full object-contain" />
      {:else}
        <ImageOffIcon class="size-5 text-muted-foreground" />
      {/if}
    </span>
    <div class="min-w-0 flex-1">
      <h3 class="truncate font-medium">{line.product.title}</h3>
      <div class="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
        <KindBadge mode={line.product.mode} />
        <span class="truncate">{line.product.category.name}</span>
      </div>
    </div>
    <Button
      variant="ghost"
      size="icon"
      class="text-destructive hover:text-destructive"
      aria-label={t('newOrder.removeLine')}
      onclick={() => form.removeLine(index)}
    >
      <Trash2Icon class="size-4" />
    </Button>
  </header>

  <div class="space-y-5 p-4">
    {#if isRental(line)}
      <div>
        {@render section(t('newOrder.package'))}
        <PackagePicker
          id={id('package')}
          packages={line.product.packages}
          value={line.packageCode}
          invalid={!!form.fields[`${at}.rentalPackageCode`]}
          onPick={(code) => {
            line.packageCode = code;
            form.clear(`${at}.rentalPackageCode`);
          }}
        />
        {@render error(`${at}.rentalPackageCode`)}
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <Label class="mb-1.5" for={id('date')}>{t('newOrder.startDate')}</Label>
          <DateField
            id={id('date')}
            min={today}
            bind:value={line.startDate}
            onChange={() => form.clear(`${at}.startDate`)}
            invalid={!!form.fields[`${at}.startDate`]}
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
              oninput={() => form.clear(`${at}.startTime`)}
              aria-invalid={form.fields[`${at}.startTime`] ? 'true' : undefined}
            />
            {@render error(`${at}.startTime`)}
          </div>
        {/if}
      </div>
    {/if}

    {#if line.product.addons.length > 0}
      <div>
        {@render section(t('newOrder.addons'))}
        <AddonPicker id={id('addons')} {line} />
        {@render error(`${at}.addons`)}
      </div>
    {/if}

    {#if line.product.questions.length > 0}
      <div class="grid gap-4 sm:grid-cols-2">
        {#each line.product.questions as question (question.key)}
          <QuestionField
            id={id(`answer-${question.key}`)}
            {line}
            {question}
            error={form.fields[`${at}.answers.${question.key}`]}
            onAnswer={() => form.clear(`${at}.answers.${question.key}`)}
          />
        {/each}
      </div>
    {/if}

    <div class="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted/50 p-3">
      <div class="flex items-center gap-3">
        <Label class="text-sm" for={id('quantity')}>{t('newOrder.quantityShort')}</Label>
        <div class="w-48">
          <NumberStepper
            id={id('quantity')}
            label={t('newOrder.quantity')}
            min={1}
            max={maxQuantity}
            bind:value={line.quantity}
          />
        </div>
      </div>
      <!-- While the quote catches up with a change, the old figures dim under a spinner
           instead of passing for the new price. -->
      <div class="relative text-right" aria-busy={busy}>
        {#if busy}
          <span class="absolute inset-0 grid place-items-center">
            <LoaderCircleIcon class="size-5 animate-spin text-muted-foreground" />
          </span>
        {/if}
        <div class={cn('transition-opacity', busy && 'opacity-30')}>
          {#if quoted}
            {#if quoted.startDate && quoted.endDate}
              <p class="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                {formatDate(quoted.startDate)}
                <ArrowRightIcon class="size-3" />
                {formatDate(quoted.endDate)}
              </p>
            {/if}
            <p class="text-lg font-semibold tabular-nums">{formatMoney(quoted.total, 'EUR')}</p>
          {:else}
            <p class="text-sm text-muted-foreground">
              {t(pendingMessage(line) ?? 'newOrder.linePending')}
            </p>
          {/if}
        </div>
      </div>
    </div>
  </div>
</article>
