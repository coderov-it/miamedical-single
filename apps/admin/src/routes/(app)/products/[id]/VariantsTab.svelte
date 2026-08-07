<script lang="ts">
  import { api } from '~/lib/api';
  import IconPicker from '~/lib/components/IconPicker.svelte';
  import MoneyInput from '~/lib/components/MoneyInput.svelte';
  import SortableList from '~/lib/components/SortableList.svelte';
  import TranslatedInput from '~/lib/components/TranslatedInput.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import type { AdminPreset, AdminProduct, Localized, TabProps } from './shared';
  import { localizedOf, localizedOrNull } from './shared';

  let { product, onSaved }: TabProps = $props();

  interface OptionEdit {
    id?: string | undefined;
    value: string;
    label: Localized;
    skuCode: string;
    priceModifier: string;
    isDefault: boolean;
  }

  interface GroupEdit {
    id?: string | undefined;
    key: string;
    label: Localized;
    helpText: Localized;
    valueType: string;
    unit: string;
    isRequired: boolean;
    affectsSku: boolean;
    sourcePresetKey: string | null;
    minValue: string;
    maxValue: string;
    stepValue: string;
    hasPerUnitModifier: boolean;
    priceModifierPerUnit: string;
    icon: string | null;
    options: OptionEdit[];
  }

  const VALUE_TYPES = [
    ['single_select', 'Single select'],
    ['multi_select', 'Multiple select'],
    ['boolean', 'Yes / No'],
    ['number', 'Number'],
    ['number_range', 'Number range'],
    ['string', 'Free text'],
  ] as const;

  function toEdit(group: AdminProduct['variants'][number]): GroupEdit {
    return {
      id: group.id,
      key: group.key,
      label: localizedOf(group.label),
      helpText: localizedOf(group.helpText),
      valueType: group.valueType,
      unit: group.unit ?? '',
      isRequired: group.isRequired,
      affectsSku: group.affectsSku,
      sourcePresetKey: group.sourcePresetKey,
      minValue: group.minValue?.toString() ?? '',
      maxValue: group.maxValue?.toString() ?? '',
      stepValue: group.stepValue?.toString() ?? '',
      hasPerUnitModifier: group.priceModifierPerUnit !== null,
      priceModifierPerUnit: group.priceModifierPerUnit ?? '0.00',
      icon: group.icon,
      options: group.options.map((option) => ({
        id: option.id,
        value: option.value,
        label: localizedOf(option.label),
        skuCode: option.skuCode ?? '',
        priceModifier: option.priceModifier,
        isDefault: option.isDefault,
      })),
    };
  }

  let groups = $state<GroupEdit[]>(product.variants.map(toEdit));
  let presets = $state<AdminPreset[]>([]);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});
  let savedFlash = $state(false);

  $effect(() => {
    void api.api.admin.attributes
      .$get()
      .then((response) => unwrap<AdminPreset[]>(response))
      .then((data) => (presets = data.filter((preset) => preset.isActive)))
      .catch(() => undefined);
  });

  const modifierSuffix = $derived(
    product.pricingMode === 'rental' ? `€ / ${product.rentalUnit}` : '€',
  );

  const presetActive = (key: string) => groups.some((group) => group.sourcePresetKey === key);

  function togglePreset(preset: AdminPreset) {
    if (presetActive(preset.key)) {
      groups = groups.filter((group) => group.sourcePresetKey !== preset.key);
      return;
    }
    // Copy the preset into the product — it is owned outright from here on.
    groups = [
      ...groups,
      {
        key: preset.key,
        label: localizedOf(preset.label),
        helpText: { it: '' },
        valueType: preset.valueType,
        unit: preset.unit ?? '',
        isRequired: false,
        affectsSku: false,
        sourcePresetKey: preset.key,
        minValue: '',
        maxValue: '',
        stepValue: '',
        hasPerUnitModifier: false,
        priceModifierPerUnit: '0.00',
        icon: preset.icon,
        options: preset.options.map((option) => ({
          value: option.value,
          label: localizedOf(option.label),
          skuCode: option.skuCode ?? '',
          priceModifier: '0.00',
          isDefault: false,
        })),
      },
    ];
  }

  function addGroup() {
    groups = [
      ...groups,
      {
        key: '',
        label: { it: '' },
        helpText: { it: '' },
        valueType: 'single_select',
        unit: '',
        isRequired: false,
        affectsSku: false,
        sourcePresetKey: null,
        minValue: '',
        maxValue: '',
        stepValue: '',
        hasPerUnitModifier: false,
        priceModifierPerUnit: '0.00',
        icon: null,
        options: [],
      },
    ];
  }

  function addOption(group: GroupEdit) {
    group.options = [
      ...group.options,
      { value: '', label: { it: '' }, skuCode: '', priceModifier: '0.00', isDefault: false },
    ];
  }

  const isSelect = (type: string) => type === 'single_select' || type === 'multi_select';
  const hasOptions = (type: string) => isSelect(type) || type === 'boolean';
  const isNumeric = (type: string) => type === 'number' || type === 'number_range';
  const canAffectSku = (type: string) => type === 'single_select' || type === 'boolean';

  async function save() {
    saving = true;
    error = null;
    fields = {};
    try {
      const payload = groups.map((group, position) => ({
        ...(group.id ? { id: group.id } : {}),
        key: group.key,
        label: localizedOrNull(group.label) ?? { it: '' },
        helpText: localizedOrNull(group.helpText),
        valueType: group.valueType as 'string',
        unit: group.unit.trim() || null,
        isRequired: group.isRequired,
        affectsSku: canAffectSku(group.valueType) ? group.affectsSku : false,
        sourcePresetKey: group.sourcePresetKey,
        minValue: group.minValue === '' ? null : Number(group.minValue),
        maxValue: group.maxValue === '' ? null : Number(group.maxValue),
        stepValue: group.stepValue === '' ? null : Number(group.stepValue),
        priceModifierPerUnit:
          isNumeric(group.valueType) && group.hasPerUnitModifier
            ? group.priceModifierPerUnit
            : null,
        icon: group.icon,
        position,
        options: hasOptions(group.valueType)
          ? group.options.map((option, optionPosition) => ({
              ...(option.id ? { id: option.id } : {}),
              value: option.value,
              label: localizedOrNull(option.label) ?? { it: '' },
              skuCode: option.skuCode.trim() || null,
              priceModifier: option.priceModifier,
              isDefault: option.isDefault,
              position: optionPosition,
            }))
          : [],
      }));

      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].variants.$put({
          param: { id: product.id },
          json: payload,
        }),
      );
      onSaved(updated);
      groups = updated.variants.map(toEdit);
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

<div class="flex flex-col gap-6">
  <div>
    <h2 class="text-sm font-semibold">Common variants</h2>
    <p class="mt-1 text-xs text-neutral-500">
      Toggling a preset copies it into this product — it is then owned and edited here.
    </p>
    <div class="mt-2 flex flex-wrap gap-2">
      {#each presets as preset (preset.id)}
        <button
          type="button"
          class="rounded-full border px-3 py-1 text-xs transition"
          class:border-brand-600={presetActive(preset.key)}
          class:bg-brand-600={presetActive(preset.key)}
          class:text-white={presetActive(preset.key)}
          class:border-neutral-300={!presetActive(preset.key)}
          class:dark:border-neutral-700={!presetActive(preset.key)}
          onclick={() => togglePreset(preset)}
        >
          {preset.label.it}
        </button>
      {/each}
    </div>
  </div>

  <SortableList bind:items={groups} onRemove={(index) => (groups = groups.filter((_, i) => i !== index))}>
    {#snippet row(group)}
      <div class="flex flex-col gap-3">
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-1 block text-xs font-medium">Key</span>
            <input
              type="text"
              bind:value={group.key}
              placeholder="colore"
              class="w-full rounded-lg border border-neutral-300 px-2 py-1.5 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-medium">Type</span>
            <select
              bind:value={group.valueType}
              class="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            >
              {#each VALUE_TYPES as [value, label] (value)}
                <option {value}>{label}</option>
              {/each}
            </select>
          </label>
        </div>

        <TranslatedInput label="Label" bind:value={group.label} />

        <div class="flex flex-wrap items-center gap-4 text-xs">
          <label class="flex items-center gap-1.5">
            <input type="checkbox" bind:checked={group.isRequired} /> Required
          </label>
          {#if canAffectSku(group.valueType)}
            <label class="flex items-center gap-1.5" title="Is this a physically different item counted separately in the warehouse?">
              <input type="checkbox" bind:checked={group.affectsSku} /> Affects SKU matrix
            </label>
          {/if}
          <label class="flex items-center gap-1.5">
            Unit
            <input
              type="text"
              bind:value={group.unit}
              placeholder="cm"
              class="w-14 rounded border border-neutral-300 px-1.5 py-1 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          {#if group.sourcePresetKey}
            <span class="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-800">
              preset: {group.sourcePresetKey}
            </span>
          {/if}
        </div>

        {#if isNumeric(group.valueType)}
          <div class="flex flex-wrap items-end gap-3 text-xs">
            <label class="block">
              <span class="mb-1 block font-medium">Min</span>
              <input type="number" bind:value={group.minValue} class="w-20 rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" />
            </label>
            <label class="block">
              <span class="mb-1 block font-medium">Max</span>
              <input type="number" bind:value={group.maxValue} class="w-20 rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" />
            </label>
            <label class="block">
              <span class="mb-1 block font-medium">Step</span>
              <input type="number" bind:value={group.stepValue} class="w-20 rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" />
            </label>
            <label class="flex items-center gap-1.5 pb-1.5">
              <input type="checkbox" bind:checked={group.hasPerUnitModifier} />
              Price per unit
            </label>
            {#if group.hasPerUnitModifier}
              <MoneyInput label="" bind:value={group.priceModifierPerUnit} allowNegative suffix={`${modifierSuffix} per ${group.unit || 'unit'}`} />
            {/if}
          </div>
        {/if}

        <IconPicker label="Icon" bind:value={group.icon} />

        {#if hasOptions(group.valueType)}
          <div class="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/40">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs font-semibold">Options</span>
              <button type="button" class="text-brand-600 text-xs hover:underline" onclick={() => addOption(group)}>
                + Add option
              </button>
            </div>
            <div class="flex flex-col gap-2">
              {#each group.options as option, optionIndex (optionIndex)}
                <div class="flex flex-wrap items-end gap-2 rounded border border-neutral-200 p-2 text-xs dark:border-neutral-700">
                  <label class="block">
                    <span class="mb-0.5 block">Value</span>
                    <input type="text" bind:value={option.value} placeholder="grigio" class="w-24 rounded border border-neutral-300 px-1.5 py-1 font-mono dark:border-neutral-700 dark:bg-neutral-900" />
                  </label>
                  <div class="min-w-40 flex-1">
                    <TranslatedInput label="Label" bind:value={option.label} />
                  </div>
                  <label class="block">
                    <span class="mb-0.5 block">SKU code</span>
                    <input type="text" bind:value={option.skuCode} placeholder="GRI" class="w-16 rounded border border-neutral-300 px-1.5 py-1 font-mono uppercase dark:border-neutral-700 dark:bg-neutral-900" />
                  </label>
                  <MoneyInput label="Modifier" bind:value={option.priceModifier} allowNegative suffix={modifierSuffix} />
                  <label class="flex items-center gap-1 pb-1.5">
                    <input
                      type="checkbox"
                      checked={option.isDefault}
                      onchange={(event) => {
                        const checked = event.currentTarget.checked;
                        for (const other of group.options) other.isDefault = false;
                        option.isDefault = checked;
                      }}
                    />
                    Default
                  </label>
                  <button
                    type="button"
                    class="pb-1.5 text-red-500 hover:text-red-700"
                    onclick={() => (group.options = group.options.filter((_, i) => i !== optionIndex))}
                    aria-label="Remove option">✕</button
                  >
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/snippet}
  </SortableList>

  <button
    type="button"
    onclick={addGroup}
    class="self-start rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-500 transition hover:border-neutral-400 dark:border-neutral-700"
  >
    + Add variant group
  </button>

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
      {saving ? 'Saving…' : 'Save variants'}
    </button>
  </div>
</div>
