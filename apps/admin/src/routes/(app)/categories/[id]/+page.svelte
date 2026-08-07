<script lang="ts">
  import { P } from '@mia/permissions';
  import type { InferResponseType } from 'hono/client';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import { api } from '~/lib/api';
  import Field from '~/lib/components/Field.svelte';
  import IconPicker from '~/lib/components/IconPicker.svelte';
  import PermissionGate from '~/lib/components/PermissionGate.svelte';
  import SortableList from '~/lib/components/SortableList.svelte';
  import TranslatedInput from '~/lib/components/TranslatedInput.svelte';
  import TranslatedTextarea from '~/lib/components/TranslatedTextarea.svelte';
  import { editorLang } from '~/lib/editor-lang.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';

  type Category = InferResponseType<
    (typeof api.api.admin.categories)[':id']['$get'],
    200
  >['data'];

  type Localized = { it: string; en?: string | undefined };

  const categoryId = $derived(page.params.id ?? '');

  interface SpecOptionEdit {
    id?: string | undefined;
    value: string;
    label: Localized;
  }

  interface SpecEdit {
    id?: string | undefined;
    key: string;
    label: Localized;
    helpText: Localized;
    valueType: string;
    unit: string;
    isRequired: boolean;
    isFilterable: boolean;
    isComparable: boolean;
    icon: string | null;
    options: SpecOptionEdit[];
  }

  const VALUE_TYPES = [
    ['single_select', 'Single select'],
    ['multi_select', 'Multiple select'],
    ['boolean', 'Yes / No'],
    ['number', 'Number'],
    ['number_range', 'Number range'],
    ['string', 'Free text'],
  ] as const;

  let category = $state<Category | null>(null);
  let code = $state('');
  let isActive = $state(true);
  let icon = $state<string | null>(null);
  let name = $state<Localized>({ it: '' });
  let description = $state<Localized>({ it: '' });
  let slug = $state<Localized>({ it: '' });
  let specs = $state<SpecEdit[]>([]);

  let saving = $state(false);
  let savingSpecs = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});
  let savedFlash = $state(false);

  const localizedField = (
    it: string | null | undefined,
    en: string | null | undefined,
  ): Localized => ({ it: it ?? '', en: en ?? undefined });

  function hydrate(data: Category) {
    category = data;
    code = data.code;
    isActive = data.isActive;
    icon = data.icon;
    name = localizedField(data.translations.it?.name, data.translations.en?.name);
    description = localizedField(
      data.translations.it?.description,
      data.translations.en?.description,
    );
    slug = localizedField(data.translations.it?.slug, data.translations.en?.slug);
    specs = data.specs.map((spec) => ({
      id: spec.id,
      key: spec.key,
      label: { it: spec.label.it, en: spec.label.en },
      helpText: spec.helpText ? { it: spec.helpText.it, en: spec.helpText.en } : { it: '' },
      valueType: spec.valueType,
      unit: spec.unit ?? '',
      isRequired: spec.isRequired,
      isFilterable: spec.isFilterable,
      isComparable: spec.isComparable,
      icon: spec.icon,
      options: spec.options.map((option) => ({
        id: option.id,
        value: option.value,
        label: { it: option.label.it, en: option.label.en },
      })),
    }));
  }

  $effect(() => {
    const id = categoryId;
    if (!id) return;
    void api.api.admin.categories[':id']
      .$get({ param: { id } })
      .then((response) => unwrap<Category>(response))
      .then(hydrate)
      .catch((err) => (error = errorMessage(err)));
  });

  function translationsPayload() {
    const forLang = (lang: 'it' | 'en') => {
      const pick = (value: Localized) => (lang === 'it' ? value.it : (value.en ?? ''));
      const t = {
        name: pick(name).trim(),
        slug: pick(slug).trim(),
        description: pick(description).trim() || null,
      };
      if (lang === 'en' && (!t.name || !t.slug)) return undefined;
      return t;
    };
    const en = forLang('en');
    return { it: forLang('it')!, ...(en ? { en } : {}) };
  }

  async function saveBasics() {
    saving = true;
    error = null;
    fields = {};
    try {
      const updated = await unwrap<Category>(
        await api.api.admin.categories[':id'].$patch({
          param: { id: categoryId },
          json: { code, isActive, icon, translations: translationsPayload() },
        }),
      );
      hydrate(updated);
      savedFlash = true;
      setTimeout(() => (savedFlash = false), 2000);
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }

  const isSelect = (type: string) => type === 'single_select' || type === 'multi_select';

  const localizedOrNull = (value: Localized) => {
    const it = value.it.trim();
    if (!it) return null;
    const en = value.en?.trim();
    return en ? { it, en } : { it };
  };

  async function saveSpecs() {
    savingSpecs = true;
    error = null;
    fields = {};
    try {
      const updated = await unwrap<Category>(
        await api.api.admin.categories[':id'].specs.$put({
          param: { id: categoryId },
          json: specs.map((spec, position) => ({
            ...(spec.id ? { id: spec.id } : {}),
            key: spec.key,
            label: localizedOrNull(spec.label) ?? { it: '' },
            helpText: localizedOrNull(spec.helpText),
            valueType: spec.valueType as 'string',
            unit: spec.unit.trim() || null,
            isRequired: spec.isRequired,
            isFilterable: spec.isFilterable,
            isComparable: spec.isComparable,
            icon: spec.icon,
            position,
            options: isSelect(spec.valueType)
              ? spec.options.map((option, optionPosition) => ({
                  ...(option.id ? { id: option.id } : {}),
                  value: option.value,
                  label: localizedOrNull(option.label) ?? { it: '' },
                  position: optionPosition,
                }))
              : [],
          })),
        }),
      );
      hydrate(updated);
      savedFlash = true;
      setTimeout(() => (savedFlash = false), 2000);
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      savingSpecs = false;
    }
  }

  async function remove() {
    if (!confirm('Delete this category? Its specs are deleted with it.')) return;
    error = null;
    try {
      await unwrap(await api.api.admin.categories[':id'].$delete({ param: { id: categoryId } }));
      await goto('/categories');
    } catch (err) {
      error = errorMessage(err);
    }
  }
</script>

<PermissionGate permission={P.CATEGORY_READ}>
  {#if !category}
    <p class="text-sm text-neutral-500">{error ?? 'Loading…'}</p>
  {:else}
    <div class="flex items-center justify-between gap-4">
      <div>
        <a href="/categories" class="text-xs text-neutral-500 hover:underline">← Categories</a>
        <h1 class="text-2xl font-semibold tracking-tight">
          {category.translations.it?.name ?? category.code}
        </h1>
      </div>
      <div class="flex items-center gap-1 rounded-lg border border-neutral-300 p-1 dark:border-neutral-700">
        {#each ['it', 'en'] as const as lang (lang)}
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-semibold uppercase transition"
            class:bg-brand-600={editorLang.current === lang}
            class:text-white={editorLang.current === lang}
            onclick={() => editorLang.set(lang)}
          >
            {lang === 'it' ? 'Italiano' : 'English'}
          </button>
        {/each}
      </div>
    </div>

    <div class="mt-6 grid max-w-4xl gap-8 lg:grid-cols-2">
      <section class="flex flex-col gap-4">
        <h2 class="text-sm font-semibold">Basics</h2>
        <TranslatedInput label="Name" bind:value={name} error={fields['translations.it.name']} />
        <TranslatedInput label="Slug" bind:value={slug} error={fields['translations.it.slug']} />
        <TranslatedTextarea label="Description" bind:value={description} rows={3} />
        <Field label="Code" error={fields['code']}>
          <input type="text" bind:value={code} class="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </Field>
        <IconPicker label="Icon (256 × 256)" bind:value={icon} />
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={isActive} /> Active
        </label>

        <div class="flex items-center justify-between">
          {#if session.can(P.CATEGORY_DELETE)}
            <button type="button" onclick={() => void remove()} class="text-sm text-red-600 hover:underline">
              Delete category
            </button>
          {:else}
            <span></span>
          {/if}
          <div class="flex items-center gap-3">
            {#if savedFlash}<span class="text-sm text-green-600">Saved ✓</span>{/if}
            <button
              type="button"
              onclick={() => void saveBasics()}
              disabled={saving}
              class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save basics'}
            </button>
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="text-sm font-semibold">Specifications</h2>
        <p class="text-xs text-neutral-500">
          Appear in the product editor when this category is selected. Filterable specs drive the
          storefront filters; comparable ones the compare view.
        </p>

        <SortableList bind:items={specs} onRemove={(index) => (specs = specs.filter((_, i) => i !== index))}>
          {#snippet row(spec)}
            <div class="flex flex-col gap-2">
              <div class="grid grid-cols-2 gap-2">
                <label class="block text-xs">
                  <span class="mb-0.5 block font-medium">Key</span>
                  <input type="text" bind:value={spec.key} class="w-full rounded border border-neutral-300 px-2 py-1.5 font-mono dark:border-neutral-700 dark:bg-neutral-900" />
                </label>
                <label class="block text-xs">
                  <span class="mb-0.5 block font-medium">Type</span>
                  <select bind:value={spec.valueType} class="w-full rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900">
                    {#each VALUE_TYPES as [value, label] (value)}
                      <option {value}>{label}</option>
                    {/each}
                  </select>
                </label>
              </div>
              <TranslatedInput label="Label" bind:value={spec.label} />
              <div class="flex flex-wrap items-center gap-3 text-xs">
                <label class="flex items-center gap-1"><input type="checkbox" bind:checked={spec.isRequired} /> Required</label>
                <label class="flex items-center gap-1"><input type="checkbox" bind:checked={spec.isFilterable} /> Filterable</label>
                <label class="flex items-center gap-1"><input type="checkbox" bind:checked={spec.isComparable} /> Comparable</label>
                <label class="flex items-center gap-1">
                  Unit
                  <input type="text" bind:value={spec.unit} placeholder="cm" class="w-14 rounded border border-neutral-300 px-1.5 py-1 dark:border-neutral-700 dark:bg-neutral-900" />
                </label>
              </div>
              {#if isSelect(spec.valueType)}
                <div class="rounded bg-neutral-50 p-2 dark:bg-neutral-800/40">
                  <div class="mb-1 flex items-center justify-between text-xs">
                    <span class="font-semibold">Options</span>
                    <button
                      type="button"
                      class="text-brand-600 hover:underline"
                      onclick={() => (spec.options = [...spec.options, { value: '', label: { it: '' } }])}
                    >
                      + Add
                    </button>
                  </div>
                  {#each spec.options as option, optionIndex (optionIndex)}
                    <div class="mb-1 flex items-end gap-2">
                      <label class="block text-xs">
                        <span class="mb-0.5 block">Value</span>
                        <input type="text" bind:value={option.value} class="w-24 rounded border border-neutral-300 px-1.5 py-1 font-mono dark:border-neutral-700 dark:bg-neutral-900" />
                      </label>
                      <div class="flex-1"><TranslatedInput label="Label" bind:value={option.label} /></div>
                      <button
                        type="button"
                        class="pb-1.5 text-xs text-red-500"
                        onclick={() => (spec.options = spec.options.filter((_, i) => i !== optionIndex))}
                        aria-label="Remove option">✕</button
                      >
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/snippet}
        </SortableList>

        <button
          type="button"
          onclick={() =>
            (specs = [
              ...specs,
              {
                key: '',
                label: { it: '' },
                helpText: { it: '' },
                valueType: 'number',
                unit: '',
                isRequired: false,
                isFilterable: false,
                isComparable: false,
                icon: null,
                options: [],
              },
            ])}
          class="self-start rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-500 transition hover:border-neutral-400 dark:border-neutral-700"
        >
          + Add spec
        </button>

        <div class="flex justify-end">
          <button
            type="button"
            onclick={() => void saveSpecs()}
            disabled={savingSpecs}
            class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
          >
            {savingSpecs ? 'Saving…' : 'Save specs'}
          </button>
        </div>
      </section>
    </div>

    {#if error}
      <p class="mt-4 max-w-4xl rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
        {error}
        {#each Object.entries(fields) as [path, message] (path)}
          <span class="block text-xs">{path}: {message}</span>
        {/each}
      </p>
    {/if}
  {/if}
</PermissionGate>
