<script lang="ts">
  import { optionsOf, PRODUCT_STATUS } from '@mia/i18n';
  import { P } from '@mia/permissions';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { api } from '~/lib/api';
  import NumberStepper from '~/lib/components/number-stepper.svelte';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import { uiLang } from '~/lib/ui-lang.svelte';
  import { t } from '~/lib/ui-text';
  import ChipsField from './ChipsField.svelte';
  import type { AdminCategory, AdminProduct, ChipEdit, Localized, TabProps } from './shared';
  import { localizedOf, localizedOrNull, sameAsSaved, translationError } from './shared';
  import TabPanel from './tab-panel.svelte';
  import { buildTranslations, type LanguageCode, localizedFrom, textFor } from '~/lib/i18n';

  let { product, onSaved, dirty }: TabProps = $props();

  const SECTION = 'basics';

  /**
   * The DTO carries one `translations` row per language; the Translated*
   * components bind per FIELD. This pivots between the two shapes: DTO → five
   * localized objects on load, and back again on save. Both directions walk the
   * registry — `localizedFrom` on the way in, `buildTranslations` on the way
   * out — so a registered language is editable here without an edit.
   *
   * `description` is edited on its own tab but still travels in this payload:
   * the PATCH replaces a language's whole translation row, so a Basics save that
   * omitted it would blank the copy written next door. It is read straight from
   * `product` at save time for the same reason — see DescriptionTab.
   */
  function snapshot(source: AdminProduct) {
    const field = (key: keyof NonNullable<AdminProduct['translations']['it']>): Localized =>
      localizedFrom(source.translations, (row) => row[key] as string | null);

    return {
      title: field('title'),
      shortDescription: field('shortDescription'),
      slug: field('slug'),
      metaTitle: field('metaTitle'),
      metaDescription: field('metaDescription'),
      stock: source.stock,
      status: source.status as string,
      categoryId: source.categoryId,
      isFeatured: source.isFeatured,
      chips: source.chips.map((chip): ChipEdit => ({
        uid: crypto.randomUUID(),
        text: localizedOf(chip),
      })),
    };
  }

  /** `uid` is presentation-only, so it must not count towards dirtiness. */
  const comparable = (source: ReturnType<typeof snapshot>) => ({
    ...source,
    chips: source.chips.map((chip) => chip.text),
  });

  let form = $state(untrack(() => snapshot(product)));
  let saved = $state(untrack(() => snapshot(product)));

  // Re-seed when the product identity changes, not on every refreshed object:
  // a save hands back an equal-but-new DTO, and reseeding on that would be a
  // no-op at best and would stamp on in-flight edits at worst.
  let seededFor = $state(untrack(() => product.id));

  /** Back to what the server last returned — drops this tab's unsaved edits. */
  function discard() {
    form = snapshot(product);
    saved = snapshot(product);
  }

  $effect(() => {
    if (product.id === seededFor) return;
    seededFor = product.id;
    discard();
  });

  const isDirty = $derived(!sameAsSaved(comparable(form), comparable(saved)));
  $effect(() => dirty.set(SECTION, isDirty));

  const categories = new Resource(
    () => null,
    async (_key, signal) =>
      unwrap<AdminCategory[]>(await api.api.admin.categories.$get(undefined, { init: { signal } })),
    { enabled: () => session.can(P.CATEGORY_READ) },
  );

  const categoryOptions = $derived(categories.data ?? []);
  const categoryLabel = $derived(
    categoryOptions.find((entry) => entry.id === form.categoryId)?.translations.it?.name ??
      t('products.chooseCategory'),
  );

  const canUpdate = $derived(session.can(P.PRODUCT_UPDATE));
  const statusOptions = $derived(optionsOf(PRODUCT_STATUS, uiLang.current));

  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  function translationFor(lang: LanguageCode) {
    return {
      title: textFor(form.title, lang).trim(),
      slug: textFor(form.slug, lang).trim(),
      shortDescription: textFor(form.shortDescription, lang).trim() || null,
      // Owned by the Description tab — carried through untouched.
      description: product.translations[lang]?.description ?? null,
      metaTitle: textFor(form.metaTitle, lang).trim() || null,
      metaDescription: textFor(form.metaDescription, lang).trim() || null,
    };
  }

  async function save() {
    saving = true;
    error = null;
    fields = {};

    try {
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].$patch({
          param: { id: product.id },
          json: {
            stock: form.stock,
            status: form.status as 'draft',
            categoryId: form.categoryId,
            isFeatured: form.isFeatured,
            // A row the editor added but never filled is not a chip — dropped
            // here rather than bounced back as a validation error.
            chips: form.chips
              .map((chip) => localizedOrNull(chip.text))
              .filter((chip): chip is Localized => chip !== null),
            // A target language without title+slug is "not translated yet",
            // not an error — `buildTranslations` drops the row so the storefront
            // falls back per-language instead of serving a half-translated page.
            // Never null here: `translationFor` always builds a row, and the
            // source language's own title is what the form's validation guards.
            translations: buildTranslations(translationFor, (row) =>
              Boolean(row.title && row.slug),
            )!,
          },
        }),
      );

      // Rebase both sides off the server's answer, so the dirty dot clears and
      // any normalisation the server applied is what the form now shows.
      saved = snapshot(updated);
      form = snapshot(updated);
      dirty.clear(SECTION);
      onSaved(updated);
      toast.success(t('products.basicsSaved'));
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }
</script>

<TabPanel
  title={t('products.tabBasics')}
  description={t('products.basicsDescription')}
  dirty={isDirty}
  {saving}
  {error}
  onSave={save}
  onDiscard={discard}
  disabledReason={canUpdate ? undefined : t('products.needUpdatePermission')}
>
  <div class="space-y-4">
    <TranslatedInput
      label={t('products.fieldTitle')}
      bind:value={form.title}
      error={translationError(fields, 'title')}
    />
    <TranslatedInput
      label={t('products.fieldSlug')}
      bind:value={form.slug}
      error={translationError(fields, 'slug')}
      hint={t('products.slugHint')}
    />
    <TranslatedInput
      label={t('products.fieldShortDescription')}
      bind:value={form.shortDescription}
      required={false}
      hint={t('products.shortDescriptionHint')}
    />

    <!--
      Category and Status sit under the copy rather than at the foot of the tab:
      the category decides what the Specs tab can even ask for, and changing it
      drops the values belonging to the old one, so it is a decision an operator
      has to see while writing rather than find afterwards.
    -->
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <Label class="mb-1.5">{t('products.fieldCategory')}</Label>
        <Select.Root type="single" bind:value={form.categoryId}>
          <Select.Trigger class="w-full">{categoryLabel}</Select.Trigger>
          <Select.Content>
            {#each categoryOptions as category (category.id)}
              <Select.Item value={category.id}>
                {category.translations.it?.name ?? category.code}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <p class="mt-1 text-xs text-muted-foreground">
          {t('products.categoryChangeHint')}
        </p>
        {#if fields.categoryId}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.categoryId}</p>
        {/if}
      </div>

      <div>
        <Label class="mb-1.5">{t('products.fieldStatus')}</Label>
        <Select.Root type="single" bind:value={form.status}>
          <Select.Trigger class="w-full">
            {statusOptions.find((entry) => entry.value === form.status)?.label ?? form.status}
          </Select.Trigger>
          <Select.Content>
            {#each statusOptions as option (option.value)}
              <Select.Item value={option.value}>{option.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>

    <div class="grid items-start gap-4 sm:grid-cols-2">
      <ChipsField bind:items={form.chips} errors={fields} />

      <!--
        A product IS its stock-keeping unit, so this one figure is the whole of
        availability: at zero the storefront renders the product dead — no price,
        an "Esaurito" plate — and the order endpoint refuses the line.
      -->
      <div>
        <Label class="mb-1.5" for="basics-stock">{t('products.fieldStock')}</Label>
        <NumberStepper
          id="basics-stock"
          bind:value={form.stock}
          min={0}
          disabled={!canUpdate}
          label={t('products.fieldStock')}
        />
        {#if fields.stock}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.stock}</p>
        {/if}
      </div>
    </div>

    <div class="flex items-center gap-2">
      <Switch
        id="basics-featured"
        checked={form.isFeatured}
        onCheckedChange={(checked) => (form.isFeatured = checked)}
      />
      <Label for="basics-featured">{t('products.featuredOnHome')}</Label>
    </div>

    <!--
      SEO last. It is the only block here that describes the product to a
      machine rather than to the shop. The description is a textarea because
      Google renders ~160 characters of it and a single line hides all but the
      last few words being typed.
    -->
    <div class="grid items-start gap-4 border-t pt-4 sm:grid-cols-2">
      <TranslatedInput
        label={t('products.fieldMetaTitle')}
        bind:value={form.metaTitle}
        required={false}
      />
      <TranslatedInput
        label={t('products.fieldMetaDescription')}
        bind:value={form.metaDescription}
        required={false}
        multiline
        rows={3}
      />
    </div>
  </div>
</TabPanel>
