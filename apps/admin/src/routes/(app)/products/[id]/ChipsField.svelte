<!--
  The chips editor: up to five 20-character claims that ride on the product
  card and the top of the product page.

  Compact rows rather than `SortableList` cards — a chip is one short line, and
  a bordered card per chip would make five of them look like five sections. The
  order is the render order, so the arrows stay: the same up/down pair the other
  tabs use, because a stacked list is where up and down mean something. (A
  wrapping row of auto-width pills was tried and rejected: denser, but the
  reading order stops being obvious and every control has to shrink to fit.)

  The limits are visible rather than merely enforced: a live counter per row,
  "3 / 5" beside the label, and the (i) explaining why short wins. `maxlength`
  stops the 21st character, so the counter never has to scold.
-->
<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { flip } from 'svelte/animate';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { cn } from '$lib/utils.js';
  import InfoHint from '~/lib/components/info-hint.svelte';
  import { useContentLang } from '~/lib/content-lang.svelte';
  import { Reorder } from '~/lib/reorder.svelte';
  import { t } from '~/lib/ui-text';
  import type { ChipEdit } from './shared';
  import { MAX_CHIP_LENGTH, MAX_CHIPS } from './shared';
  import { languageOf, setTextFor, SOURCE_LANGUAGE, textFor } from '~/lib/i18n';

  interface Props {
    items: ChipEdit[];
    /** Server field errors, keyed `chips.0.it` as valibot reports them. */
    errors?: Record<string, string>;
  }

  let { items = $bindable(), errors = {} }: Props = $props();

  const contentLang = useContentLang();
  const lang = $derived(contentLang.current);

  /** Past this, a chip is close enough to the card's crop to warn about it. */
  const LONG_ENOUGH = 16;

  const isSource = $derived(lang === SOURCE_LANGUAGE);
  const textOf = (chip: ChipEdit) => textFor(chip.text, lang);

  // `setTextFor` keeps an emptied target language `undefined` rather than `''` —
  // that is what makes the chip fall back to the source language on the
  // storefront instead of rendering blank.
  const setText = (chip: ChipEdit, value: string) => setTextFor(chip.text, lang, value);

  const reorder = new Reorder();

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    items = next;
    reorder.mark(moved!.uid);
  }

  function add() {
    if (items.length >= MAX_CHIPS) return;
    items.push({ uid: crypto.randomUUID(), text: { it: '' } });
  }
</script>

<div>
  <div class="mb-1.5 flex items-center gap-2">
    <Label>{t('products.chipsLabel')}</Label>
    <InfoHint label={t('products.chipsAbout')}>
      <p class="font-medium text-foreground">{t('products.chipsHintTitle')}</p>
      <p>{t('products.chipsHintBody1', { max: MAX_CHIPS })}</p>
      <p>{t('products.chipsHintBody2', { max: MAX_CHIP_LENGTH })}</p>
    </InfoHint>
    <span class="ml-auto text-xs text-muted-foreground tabular-nums">
      {items.length} / {MAX_CHIPS}
    </span>
  </div>

  <ul class="flex flex-col gap-2">
    {#each items as chip, index (chip.uid)}
      {@const text = textOf(chip)}
      {@const error = errors[`chips.${index}.${lang}`]}
      <li animate:flip={reorder.flip}>
        <div
          class={cn(
            'flex items-center gap-2 rounded-lg transition-shadow duration-500',
            reorder.ring(chip.uid),
          )}
        >
          <div class="relative min-w-0 flex-1">
            <Input
              type="text"
              value={text}
              maxlength={MAX_CHIP_LENGTH}
              placeholder={isSource
                ? t('products.chipPlaceholder')
                : textFor(chip.text, SOURCE_LANGUAGE) || t('products.chipPlaceholder')}
              class="pr-13"
              aria-label={t('products.chipName', { n: index + 1 })}
              aria-invalid={error ? 'true' : undefined}
              oninput={(event) => setText(chip, event.currentTarget.value)}
            />
            <span
              class={cn(
                'pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs tabular-nums',
                text.length > LONG_ENOUGH
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground',
              )}
            >
              {text.length}/{MAX_CHIP_LENGTH}
            </span>
          </div>

          {#if items.length > 1}
            <ButtonGroup.Root>
              <Button
                variant="outline"
                size="icon"
                disabled={index === 0}
                onclick={() => move(index, -1)}
                aria-label={t('components.moveUp', {
                  name: t('products.chipName', { n: index + 1 }),
                })}
              >
                <ChevronUpIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={index === items.length - 1}
                onclick={() => move(index, 1)}
                aria-label={t('components.moveDown', {
                  name: t('products.chipName', { n: index + 1 }),
                })}
              >
                <ChevronDownIcon />
              </Button>
            </ButtonGroup.Root>
          {/if}

          <Button
            variant="ghost"
            size="icon"
            class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onclick={() => items.splice(index, 1)}
            aria-label={t('components.removeNamed', {
              name: t('products.chipName', { n: index + 1 }),
            })}
          >
            <Trash2Icon />
          </Button>
        </div>

        {#if error}
          <p class="mt-1 text-xs text-destructive" role="alert">{error}</p>
        {/if}
      </li>
    {/each}
  </ul>

  {#if items.length < MAX_CHIPS}
    <Button variant="outline" size="sm" class="mt-2" onclick={add}>
      <PlusIcon />
      {t('products.addChip')}
    </Button>
  {/if}

  <p class="mt-1.5 text-xs text-muted-foreground">
    {#if items.length === 0}
      {t('products.chipsEmpty')}
    {:else if !isSource}
      {t('products.chipsFallback', {
        language: languageOf(lang).label,
        source: languageOf(SOURCE_LANGUAGE).label,
      })}
    {:else}
      {t('products.chipsOrder')}
    {/if}
  </p>
</div>
