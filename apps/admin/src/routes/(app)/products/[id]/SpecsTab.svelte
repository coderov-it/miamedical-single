<script lang="ts">
  import { api } from '~/lib/api';
  import TranslatedInput from '~/lib/components/TranslatedInput.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import type { AdminCategory, AdminProduct, Localized, TabProps } from './shared';
  import { localizedOrNull } from './shared';

  let { product, onSaved }: TabProps = $props();

  /**
   * Inputs are driven by the category's spec definitions — selecting a
   * category in Basics is what makes them appear here. Saving blocks when a
   * required spec is empty.
   */
  interface SpecEdit {
    specId: string;
    numberValue: string;
    numberMin: string;
    numberMax: string;
    booleanValue: '' | 'true' | 'false';
    optionIds: string[];
    textValue: Localized;
  }

  let category = $state<AdminCategory | null>(null);
  let edits = $state<Record<string, SpecEdit>>({});
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});
  let savedFlash = $state(false);

  $effect(() => {
    void api.api.admin.categories[':id']
      .$get({ param: { id: product.categoryId } })
      .then((response) => unwrap<AdminCategory>(response))
      .then((data) => {
        category = data;
        const next: Record<string, SpecEdit> = {};
        for (const spec of data.specs) {
          const value = product.specValues.find((v) => v.specId === spec.id);
          next[spec.id] = {
            specId: spec.id,
            numberValue: value?.numberValue?.toString() ?? '',
            numberMin: value?.numberMin?.toString() ?? '',
            numberMax: value?.numberMax?.toString() ?? '',
            booleanValue:
              value?.booleanValue === true ? 'true' : value?.booleanValue === false ? 'false' : '',
            optionIds: value?.optionIds ?? [],
            textValue: value?.textValue ? { it: value.textValue.it, en: value.textValue.en } : { it: '' },
          };
        }
        edits = next;
      })
      .catch((err) => (error = errorMessage(err)));
  });

  function isEmpty(spec: AdminCategory['specs'][number], edit: SpecEdit): boolean {
    switch (spec.valueType) {
      case 'number':
        return edit.numberValue === '';
      case 'number_range':
        return edit.numberMin === '' && edit.numberMax === '';
      case 'boolean':
        return edit.booleanValue === '';
      case 'single_select':
      case 'multi_select':
        return edit.optionIds.length === 0;
      default:
        return !edit.textValue.it.trim();
    }
  }

  async function save() {
    if (!category) return;
    const missing = category.specs.filter(
      (spec) => spec.isRequired && isEmpty(spec, edits[spec.id]!),
    );
    if (missing.length > 0) {
      error = `Required: ${missing.map((spec) => spec.label.it).join(', ')}.`;
      return;
    }

    saving = true;
    error = null;
    fields = {};
    try {
      const payload = category.specs
        .filter((spec) => !isEmpty(spec, edits[spec.id]!))
        .map((spec) => {
          const edit = edits[spec.id]!;
          return {
            specId: spec.id,
            numberValue: edit.numberValue === '' ? null : Number(edit.numberValue),
            numberMin: edit.numberMin === '' ? null : Number(edit.numberMin),
            numberMax: edit.numberMax === '' ? null : Number(edit.numberMax),
            booleanValue: edit.booleanValue === '' ? null : edit.booleanValue === 'true',
            textValue: spec.valueType === 'string' ? localizedOrNull(edit.textValue) : null,
            optionIds: edit.optionIds,
          };
        });

      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].specs.$put({
          param: { id: product.id },
          json: payload,
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

{#if !category}
  <p class="text-sm text-neutral-500">Loading category specs…</p>
{:else if category.specs.length === 0}
  <p class="text-sm text-neutral-500">
    The category “{category.translations.it?.name ?? category.code}” defines no specifications.
  </p>
{:else}
  <div class="flex max-w-2xl flex-col gap-4">
    {#each category.specs as spec (spec.id)}
      {@const edit = edits[spec.id]}
      {#if edit}
        <div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div class="mb-2 flex items-center gap-2 text-sm font-medium">
            {spec.label.it}
            {#if spec.isRequired}<span class="text-red-500">*</span>{/if}
            {#if spec.unit}<span class="text-xs text-neutral-400">({spec.unit})</span>{/if}
            <span class="ml-auto flex gap-1 text-[10px] text-neutral-400">
              {#if spec.isFilterable}<span class="rounded bg-neutral-100 px-1 dark:bg-neutral-800">filter</span>{/if}
              {#if spec.isComparable}<span class="rounded bg-neutral-100 px-1 dark:bg-neutral-800">compare</span>{/if}
            </span>
          </div>

          {#if spec.valueType === 'number'}
            <input
              type="number"
              step="any"
              bind:value={edit.numberValue}
              class="w-40 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          {:else if spec.valueType === 'number_range'}
            <div class="flex items-center gap-2 text-sm">
              <input type="number" step="any" bind:value={edit.numberMin} placeholder="min" class="w-28 rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900" />
              –
              <input type="number" step="any" bind:value={edit.numberMax} placeholder="max" class="w-28 rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900" />
            </div>
          {:else if spec.valueType === 'boolean'}
            <select
              bind:value={edit.booleanValue}
              class="w-32 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">—</option>
              <option value="true">Sì</option>
              <option value="false">No</option>
            </select>
          {:else if spec.valueType === 'single_select'}
            <select
              value={edit.optionIds[0] ?? ''}
              onchange={(event) => {
                const id = event.currentTarget.value;
                edit.optionIds = id ? [id] : [];
              }}
              class="w-60 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">—</option>
              {#each spec.options as option (option.id)}
                <option value={option.id}>{option.label.it}</option>
              {/each}
            </select>
          {:else if spec.valueType === 'multi_select'}
            <div class="flex flex-wrap gap-3 text-sm">
              {#each spec.options as option (option.id)}
                <label class="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={edit.optionIds.includes(option.id)}
                    onchange={(event) => {
                      edit.optionIds = event.currentTarget.checked
                        ? [...edit.optionIds, option.id]
                        : edit.optionIds.filter((id) => id !== option.id);
                    }}
                  />
                  {option.label.it}
                </label>
              {/each}
            </div>
          {:else}
            <TranslatedInput label="" bind:value={edit.textValue} required={spec.isRequired} />
          {/if}
        </div>
      {/if}
    {/each}

    {#if error}
      <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
        {error}
        {#each Object.entries(fields) as [path, message] (path)}
          <span class="block text-xs">{path}: {message}</span>
        {/each}
      </p>
    {/if}

    <div class="flex items-center justify-end gap-3">
      {#if savedFlash}<span class="text-sm text-green-600">Saved ✓</span>{/if}
      <button
        type="button"
        onclick={() => void save()}
        disabled={saving}
        class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save specifications'}
      </button>
    </div>
  </div>
{/if}
