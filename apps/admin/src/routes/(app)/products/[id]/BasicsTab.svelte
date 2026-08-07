<script lang="ts">
  import { api } from '~/lib/api';
  import Field from '~/lib/components/Field.svelte';
  import TranslatedInput from '~/lib/components/TranslatedInput.svelte';
  import TranslatedTextarea from '~/lib/components/TranslatedTextarea.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import type { AdminCategory, AdminProduct, Localized, TabProps } from './shared';

  let { product, onSaved }: TabProps = $props();

  /**
   * The DTO carries `translations: { it: {…}, en: {…} }` per language; the
   * Translated* components bind per FIELD. This tab pivots between the two
   * shapes: DTO → six `{ it, en }` objects on load, back again on save.
   */
  const field = (key: keyof NonNullable<AdminProduct['translations']['it']>): Localized => ({
    it: (product.translations.it?.[key] as string | null) ?? '',
    en: (product.translations.en?.[key] as string | null) ?? undefined,
  });

  let title = $state(field('title'));
  let shortDescription = $state(field('shortDescription'));
  let description = $state(field('description'));
  let slug = $state(field('slug'));
  let metaTitle = $state(field('metaTitle'));
  let metaDescription = $state(field('metaDescription'));

  let baseSku = $state(product.baseSku);
  let brand = $state(product.brand ?? '');
  let status = $state(product.status);
  let categoryId = $state(product.categoryId);
  let isFeatured = $state(product.isFeatured);

  let categories = $state<AdminCategory[]>([]);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});
  let savedFlash = $state(false);

  $effect(() => {
    void api.api.admin.categories
      .$get()
      .then((response) => unwrap<AdminCategory[]>(response))
      .then((data) => (categories = data))
      .catch(() => undefined);
  });

  function translationFor(lang: 'it' | 'en') {
    const pickText = (value: Localized) => (lang === 'it' ? value.it : (value.en ?? ''));
    const t = {
      title: pickText(title).trim(),
      slug: pickText(slug).trim(),
      shortDescription: pickText(shortDescription).trim() || null,
      description: pickText(description).trim() || null,
      metaTitle: pickText(metaTitle).trim() || null,
      metaDescription: pickText(metaDescription).trim() || null,
    };
    // An English side without title+slug is "not translated yet", not an error.
    if (lang === 'en' && (!t.title || !t.slug)) return undefined;
    return t;
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
            baseSku,
            brand: brand.trim() || null,
            status,
            categoryId,
            isFeatured,
            translations: { it: translationFor('it')!, ...(en ? { en } : {}) },
          },
        }),
      );
      onSaved(updated);
      savedFlash = true;
      setTimeout(() => (savedFlash = false), 2000);
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }
</script>

<form
  class="flex flex-col gap-4"
  onsubmit={(event) => {
    event.preventDefault();
    void save();
  }}
>
  <TranslatedInput label="Title" bind:value={title} error={fields['translations.it.title']} />
  <TranslatedInput
    label="Slug"
    bind:value={slug}
    error={fields['translations.it.slug'] ?? fields['translations.en.slug']}
  />
  <TranslatedInput label="Short description" bind:value={shortDescription} required={false} />
  <TranslatedTextarea label="Description" bind:value={description} rows={8} />
  <TranslatedInput label="Meta title" bind:value={metaTitle} required={false} />
  <TranslatedInput label="Meta description" bind:value={metaDescription} required={false} />

  <div class="grid grid-cols-2 gap-4">
    <Field label="Base SKU" error={fields['baseSku']}>
      <input
        type="text"
        bind:value={baseSku}
        class="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm uppercase dark:border-neutral-700 dark:bg-neutral-900"
      />
    </Field>
    <Field label="Brand">
      <input
        type="text"
        bind:value={brand}
        class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
    </Field>
    <Field label="Category" hint="Changing it drops spec values from the old category." error={fields['categoryId']}>
      <select
        bind:value={categoryId}
        class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        {#each categories as category (category.id)}
          <option value={category.id}>{category.translations.it?.name ?? category.code}</option>
        {/each}
      </select>
    </Field>
    <Field label="Status">
      <select
        bind:value={status}
        class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>
    </Field>
  </div>

  <label class="flex items-center gap-2 text-sm">
    <input type="checkbox" bind:checked={isFeatured} />
    Featured on the home page
  </label>

  {#if error}
    <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
  {/if}

  <div class="flex items-center justify-end gap-3">
    {#if savedFlash}<span class="text-sm text-green-600">Saved ✓</span>{/if}
    <button
      type="submit"
      disabled={saving}
      class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
    >
      {saving ? 'Saving…' : 'Save basics'}
    </button>
  </div>
</form>
