<script lang="ts">
  import { P } from '@mia/permissions';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { api } from '~/lib/api';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import ChipsField from './ChipsField.svelte';
  import type { AdminCategory, AdminProduct, ChipEdit, Localized, TabProps } from './shared';
  import { localizedOrNull, sameAsSaved } from './shared';
  import TabPanel from './tab-panel.svelte';

  let { product, onSaved, dirty }: TabProps = $props();

  const SECTION = 'basics';

  const STATUSES = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
  ] as const;

  /**
   * The DTO carries `translations: { it: {…}, en: {…} }` per language; the
   * Translated* components bind per FIELD. This pivots between the two shapes:
   * DTO → five `{ it, en }` objects on load, and back again on save.
   *
   * `description` is edited on its own tab but still travels in this payload:
   * the PATCH replaces a language's whole translation row, so a Basics save that
   * omitted it would blank the copy written next door. It is read straight from
   * `product` at save time for the same reason — see DescriptionTab.
   */
  function snapshot(source: AdminProduct) {
    const field = (key: keyof NonNullable<AdminProduct['translations']['it']>): Localized => ({
      it: (source.translations.it?.[key] as string | null) ?? '',
      en: (source.translations.en?.[key] as string | null) ?? undefined,
    });

    return {
      title: field('title'),
      shortDescription: field('shortDescription'),
      slug: field('slug'),
      metaTitle: field('metaTitle'),
      metaDescription: field('metaDescription'),
      baseSku: source.baseSku,
      brand: source.brand ?? '',
      status: source.status as string,
      categoryId: source.categoryId,
      isFeatured: source.isFeatured,
      chips: source.chips.map((chip): ChipEdit => ({
        uid: crypto.randomUUID(),
        text: { it: chip.it, en: chip.en },
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
  $effect(() => {
    if (product.id === seededFor) return;
    seededFor = product.id;
    form = snapshot(product);
    saved = snapshot(product);
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
      'Choose a category',
  );

  const canUpdate = $derived(session.can(P.PRODUCT_UPDATE));

  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  function translationFor(lang: 'it' | 'en') {
    const pick = (value: Localized) => (lang === 'it' ? value.it : (value.en ?? ''));
    const row = {
      title: pick(form.title).trim(),
      slug: pick(form.slug).trim(),
      shortDescription: pick(form.shortDescription).trim() || null,
      // Owned by the Description tab — carried through untouched.
      description: product.translations[lang]?.description ?? null,
      metaTitle: pick(form.metaTitle).trim() || null,
      metaDescription: pick(form.metaDescription).trim() || null,
    };
    // An English side without title+slug is "not translated yet", not an error.
    if (lang === 'en' && (!row.title || !row.slug)) return undefined;
    return row;
  }

  async function save() {
    saving = true;
    error = null;
    fields = {};

    try {
      const en = translationFor('en');
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].$patch({
          param: { id: product.id },
          json: {
            baseSku: form.baseSku,
            brand: form.brand.trim() || null,
            status: form.status as 'draft',
            categoryId: form.categoryId,
            isFeatured: form.isFeatured,
            // A row the editor added but never filled is not a chip — dropped
            // here rather than bounced back as a validation error.
            chips: form.chips
              .map((chip) => localizedOrNull(chip.text))
              .filter((chip): chip is Localized => chip !== null),
            translations: { it: translationFor('it')!, ...(en ? { en } : {}) },
          },
        }),
      );

      // Rebase both sides off the server's answer, so the dirty dot clears and
      // any normalisation the server applied is what the form now shows.
      saved = snapshot(updated);
      form = snapshot(updated);
      dirty.clear(SECTION);
      onSaved(updated);
      toast.success('Basics saved.');
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }
</script>

<TabPanel
  title="Basics"
  description="Names, descriptions and where this product sits in the catalog."
  dirty={isDirty}
  {saving}
  {error}
  onSave={save}
  saveLabel="Save basics"
  disabledReason={canUpdate ? undefined : 'You need product:update to change this.'}
>
  <div class="space-y-4">
    <TranslatedInput
      label="Title"
      bind:value={form.title}
      error={fields['translations.it.title']}
    />
    <TranslatedInput
      label="Slug"
      bind:value={form.slug}
      error={fields['translations.it.slug'] ?? fields['translations.en.slug']}
      hint="The URL segment on the storefront."
    />
    <TranslatedInput
      label="Short description"
      bind:value={form.shortDescription}
      required={false}
      hint="One line, shown on cards and in search results."
    />

    <ChipsField bind:items={form.chips} errors={fields} />

    <div class="grid gap-4 sm:grid-cols-2">
      <TranslatedInput label="Meta title" bind:value={form.metaTitle} required={false} />
      <TranslatedInput
        label="Meta description"
        bind:value={form.metaDescription}
        required={false}
      />
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <Label class="mb-1.5" for="basics-sku">Base SKU</Label>
        <Input
          id="basics-sku"
          bind:value={form.baseSku}
          class="font-mono uppercase"
          aria-invalid={fields.baseSku ? 'true' : undefined}
        />
        {#if fields.baseSku}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.baseSku}</p>
        {/if}
      </div>

      <div>
        <Label class="mb-1.5" for="basics-brand">Brand</Label>
        <Input id="basics-brand" bind:value={form.brand} />
      </div>

      <div>
        <Label class="mb-1.5">Category</Label>
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
          Changing it drops spec values belonging to the old category.
        </p>
        {#if fields.categoryId}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.categoryId}</p>
        {/if}
      </div>

      <div>
        <Label class="mb-1.5">Status</Label>
        <Select.Root type="single" bind:value={form.status}>
          <Select.Trigger class="w-full">
            {STATUSES.find((entry) => entry.value === form.status)?.label ?? form.status}
          </Select.Trigger>
          <Select.Content>
            {#each STATUSES as option (option.value)}
              <Select.Item value={option.value}>{option.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <Switch
        id="basics-featured"
        checked={form.isFeatured}
        onCheckedChange={(checked) => (form.isFeatured = checked)}
      />
      <Label for="basics-featured">Featured on the home page</Label>
    </div>
  </div>
</TabPanel>
