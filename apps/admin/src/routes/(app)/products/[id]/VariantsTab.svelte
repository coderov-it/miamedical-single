<!--
  Variant groups: the options a customer picks, and what each one does to the
  price and the SKU.

  Groups are collapsible because there are usually several and each is a dense
  form. Only `single_select` and `boolean` may drive the SKU matrix — a
  multi-select would make the combination count unbounded — so that toggle is
  hidden rather than disabled for the other types, and `affectsSku` is forced
  false on the way out in case the type changed after it was ticked.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Collapsible from '$lib/components/ui/collapsible/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import { VALUE_TYPES } from '~/lib/categories/spec-edit';
  import IconPicker from '~/lib/components/icon-picker.svelte';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import SortableList from '~/lib/components/sortable-list.svelte';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import type { AdminPreset, AdminProduct, Localized, TabProps } from './shared';
  import { localizedOf, localizedOrNull, sameAsSaved } from './shared';
  import TabPanel from './tab-panel.svelte';

  let { product, onSaved, dirty }: TabProps = $props();

  const SECTION = 'variants';

  interface OptionEdit {
    uid: string;
    id?: string | undefined;
    value: string;
    label: Localized;
    skuCode: string;
    priceModifier: string;
    isDefault: boolean;
  }

  interface GroupEdit {
    uid: string;
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

  const isSelect = (type: string) => type === 'single_select' || type === 'multi_select';
  const hasOptions = (type: string) => isSelect(type) || type === 'boolean';
  const isNumeric = (type: string) => type === 'number' || type === 'number_range';
  const canAffectSku = (type: string) => type === 'single_select' || type === 'boolean';

  const toEdit = (group: AdminProduct['variants'][number]): GroupEdit => ({
    uid: group.id,
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
      uid: option.id,
      id: option.id,
      value: option.value,
      label: localizedOf(option.label),
      skuCode: option.skuCode ?? '',
      priceModifier: option.priceModifier,
      isDefault: option.isDefault,
    })),
  });

  const comparable = (rows: GroupEdit[]) =>
    rows.map(({ uid: _uid, options, ...rest }) => ({
      ...rest,
      options: options.map(({ uid: _optionUid, ...option }) => option),
    }));

  let groups = $state(untrack(() => product.variants.map(toEdit)));
  let saved = $state(untrack(() => comparable(groups)));
  let open = $state<Record<string, boolean>>({});

  let seededFor = $state(untrack(() => product.id));
  $effect(() => {
    if (product.id === seededFor) return;
    seededFor = product.id;
    groups = product.variants.map(toEdit);
    saved = comparable(groups);
  });

  const isDirty = $derived(!sameAsSaved(comparable(groups), saved));
  $effect(() => dirty.set(SECTION, isDirty));

  const canUpdate = $derived(session.can(P.PRODUCT_UPDATE));

  const presets = new Resource(
    () => null,
    async (_key, signal) =>
      unwrap<AdminPreset[]>(await api.api.admin.attributes.$get(undefined, { init: { signal } })),
    { enabled: () => session.can(P.ATTRIBUTE_READ) },
  );

  const activePresets = $derived((presets.data ?? []).filter((preset) => preset.isActive));

  const modifierSuffix = $derived(
    product.pricingMode === 'rental' ? `€ / ${product.rentalUnit}` : '€',
  );

  const presetActive = (key: string) => groups.some((group) => group.sourcePresetKey === key);

  function togglePreset(preset: AdminPreset) {
    if (presetActive(preset.key)) {
      groups = groups.filter((group) => group.sourcePresetKey !== preset.key);
      return;
    }

    // A preset is a template: this copies it in, and the product owns the copy
    // outright from here on. Later edits to the preset never reach back.
    const group: GroupEdit = {
      uid: crypto.randomUUID(),
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
        uid: crypto.randomUUID(),
        value: option.value,
        label: localizedOf(option.label),
        skuCode: option.skuCode ?? '',
        priceModifier: '0.00',
        isDefault: false,
      })),
    };
    groups.push(group);
    open[group.uid] = true;
  }

  function addGroup() {
    const group: GroupEdit = {
      uid: crypto.randomUUID(),
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
    };
    groups.push(group);
    open[group.uid] = true;
  }

  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  async function save() {
    saving = true;
    error = null;
    fields = {};

    try {
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].variants.$put({
          param: { id: product.id },
          json: groups.map((group, position) => ({
            ...(group.id ? { id: group.id } : {}),
            key: group.key,
            label: localizedOrNull(group.label) ?? { it: '' },
            helpText: localizedOrNull(group.helpText),
            valueType: group.valueType as 'string',
            unit: group.unit.trim() || null,
            isRequired: group.isRequired,
            // Forced false when the type cannot drive a SKU, in case the type
            // was changed after the toggle was ticked.
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
          })),
        }),
      );

      groups = updated.variants.map(toEdit);
      saved = comparable(groups);
      dirty.clear(SECTION);
      onSaved(updated);
      toast.success('Variants saved.');
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }
</script>

<TabPanel
  title="Variants"
  description="The choices a customer makes, and what each one does to the price and the SKU."
  dirty={isDirty}
  {saving}
  {error}
  onSave={save}
  saveLabel="Save variants"
  disabledReason={canUpdate ? undefined : 'You need product:update to change this.'}
>
  <div class="space-y-5">
    {#if activePresets.length > 0}
      <div>
        <Label class="text-sm font-medium">Common variants</Label>
        <p class="mt-0.5 text-xs text-muted-foreground">
          Toggling a preset copies it into this product — it is owned and edited here from then on.
        </p>
        <div class="mt-2 flex flex-wrap gap-1.5">
          {#each activePresets as preset (preset.id)}
            {@const active = presetActive(preset.key)}
            <button
              type="button"
              onclick={() => togglePreset(preset)}
              aria-pressed={active}
              disabled={!canUpdate}
              class={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50',
                active ? 'border-transparent bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              {preset.label.it}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    {#if groups.length === 0}
      <p class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No variant groups. Without one this product has a single SKU.
      </p>
    {/if}

    <SortableList
      bind:items={groups}
      key={(group) => group.uid}
      describe={(group) => group.label.it || 'this group'}
      onRemove={(index) => groups.splice(index, 1)}
    >
      {#snippet row(group)}
        <Collapsible.Root
          bind:open={() => open[group.uid] ?? false, (value: boolean) => (open[group.uid] = value)}
        >
          <div class="flex items-center gap-2">
            <Collapsible.Trigger
              class="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 text-left"
            >
              <ChevronRightIcon
                class={cn(
                  'size-4 shrink-0 text-muted-foreground transition-transform',
                  open[group.uid] && 'rotate-90',
                )}
              />
              {#if group.label.it}
                <span class="truncate text-sm font-medium">{group.label.it}</span>
              {:else}
                <span class="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span class="size-1.5 rounded-full bg-destructive"></span>
                  No name yet
                </span>
              {/if}
              {#if group.sourcePresetKey}
                <Badge variant="secondary">preset</Badge>
              {/if}
              {#if group.affectsSku && canAffectSku(group.valueType)}
                <Badge variant="outline">SKU</Badge>
              {/if}
              <span class="ml-auto shrink-0 text-xs text-muted-foreground">
                {VALUE_TYPES.find((type) => type.value === group.valueType)?.label ??
                  group.valueType}
                {#if hasOptions(group.valueType)}· {group.options.length}{/if}
              </span>
            </Collapsible.Trigger>
          </div>

          <Collapsible.Content>
            <div class="mt-3 space-y-3 border-t pt-3">
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label class="mb-1.5" for="vg-key-{group.uid}">Key</Label>
                  <Input
                    id="vg-key-{group.uid}"
                    bind:value={group.key}
                    placeholder="colore"
                    class="font-mono text-xs"
                  />
                </div>
                <div>
                  <Label class="mb-1.5">Type</Label>
                  <Select.Root type="single" bind:value={group.valueType}>
                    <Select.Trigger class="w-full">
                      {VALUE_TYPES.find((type) => type.value === group.valueType)?.label ??
                        group.valueType}
                    </Select.Trigger>
                    <Select.Content>
                      {#each VALUE_TYPES as type (type.value)}
                        <Select.Item value={type.value}>{type.label}</Select.Item>
                      {/each}
                    </Select.Content>
                  </Select.Root>
                </div>
              </div>

              <TranslatedInput label="Label" bind:value={group.label} />
              <TranslatedInput label="Help text" bind:value={group.helpText} required={false} />

              <div class="flex flex-wrap items-end gap-4">
                <div class="flex items-center gap-2 pb-2">
                  <Switch
                    id="vg-required-{group.uid}"
                    checked={group.isRequired}
                    onCheckedChange={(checked) => (group.isRequired = checked)}
                  />
                  <Label for="vg-required-{group.uid}" class="text-sm">Required</Label>
                </div>

                {#if canAffectSku(group.valueType)}
                  <div class="flex items-center gap-2 pb-2">
                    <Switch
                      id="vg-sku-{group.uid}"
                      checked={group.affectsSku}
                      onCheckedChange={(checked) => (group.affectsSku = checked)}
                    />
                    <Label for="vg-sku-{group.uid}" class="text-sm">Affects SKU</Label>
                  </div>
                {/if}

                {#if isNumeric(group.valueType)}
                  <div>
                    <Label class="mb-1.5" for="vg-unit-{group.uid}">Unit</Label>
                    <Input id="vg-unit-{group.uid}" bind:value={group.unit} class="w-20" />
                  </div>
                  <div>
                    <Label class="mb-1.5" for="vg-min-{group.uid}">Min</Label>
                    <Input
                      id="vg-min-{group.uid}"
                      type="number"
                      bind:value={group.minValue}
                      class="w-20"
                    />
                  </div>
                  <div>
                    <Label class="mb-1.5" for="vg-max-{group.uid}">Max</Label>
                    <Input
                      id="vg-max-{group.uid}"
                      type="number"
                      bind:value={group.maxValue}
                      class="w-20"
                    />
                  </div>
                  <div>
                    <Label class="mb-1.5" for="vg-step-{group.uid}">Step</Label>
                    <Input
                      id="vg-step-{group.uid}"
                      type="number"
                      bind:value={group.stepValue}
                      class="w-20"
                    />
                  </div>
                {/if}
              </div>

              {#if isNumeric(group.valueType)}
                <div class="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/40 p-3">
                  <div class="flex items-center gap-2 pb-2">
                    <Switch
                      id="vg-perunit-{group.uid}"
                      checked={group.hasPerUnitModifier}
                      onCheckedChange={(checked) => (group.hasPerUnitModifier = checked)}
                    />
                    <Label for="vg-perunit-{group.uid}" class="text-sm">Price per unit</Label>
                  </div>
                  {#if group.hasPerUnitModifier}
                    <MoneyInput
                      label="Per unit"
                      bind:value={group.priceModifierPerUnit}
                      allowNegative
                      suffix={modifierSuffix}
                    />
                  {/if}
                </div>
              {/if}

              <IconPicker label="Icon" bind:value={group.icon} compact />

              {#if hasOptions(group.valueType)}
                <div class="rounded-lg border bg-muted/40 p-3">
                  <div class="mb-2 flex items-center justify-between">
                    <Label class="text-xs font-semibold">Options</Label>
                    <Button
                      variant="ghost"
                      size="xs"
                      onclick={() =>
                        group.options.push({
                          uid: crypto.randomUUID(),
                          value: '',
                          label: { it: '' },
                          skuCode: '',
                          priceModifier: '0.00',
                          isDefault: false,
                        })}
                    >
                      <PlusIcon />
                      Add option
                    </Button>
                  </div>

                  <div
                    class="space-y-2 {group.options.length > 4 ? 'max-h-80 overflow-y-auto' : ''}"
                  >
                    {#each group.options as option (option.uid)}
                      <div class="flex flex-wrap items-end gap-2 rounded-md bg-card p-2">
                        <div class="min-w-40 flex-1">
                          <TranslatedInput label="Label" bind:value={option.label} />
                        </div>
                        <div>
                          <Label class="mb-1 text-xs" for="vo-value-{option.uid}">Value</Label>
                          <Input
                            id="vo-value-{option.uid}"
                            bind:value={option.value}
                            class="h-8 w-28 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <Label class="mb-1 text-xs" for="vo-sku-{option.uid}">SKU</Label>
                          <Input
                            id="vo-sku-{option.uid}"
                            bind:value={option.skuCode}
                            class="h-8 w-20 font-mono text-xs uppercase"
                          />
                        </div>
                        <MoneyInput
                          label="Modifier"
                          bind:value={option.priceModifier}
                          allowNegative
                          suffix={modifierSuffix}
                        />
                        <div class="flex items-center gap-2 pb-2">
                          <Switch
                            id="vo-default-{option.uid}"
                            checked={option.isDefault}
                            onCheckedChange={(checked) => {
                              // Exactly one default per single-select group —
                              // two would make the preselected option arbitrary.
                              if (checked && group.valueType === 'single_select') {
                                for (const entry of group.options) entry.isDefault = false;
                              }
                              option.isDefault = checked;
                            }}
                          />
                          <Label for="vo-default-{option.uid}" class="text-xs">Default</Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          class="mb-0.5 text-muted-foreground hover:text-destructive"
                          aria-label="Remove option"
                          onclick={() =>
                            (group.options = group.options.filter(
                              (entry) => entry.uid !== option.uid,
                            ))}
                        >
                          <XIcon />
                        </Button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      {/snippet}
    </SortableList>

    <Button variant="outline" size="sm" onclick={addGroup} disabled={!canUpdate}>
      <PlusIcon />
      Add variant group
    </Button>

    {#if Object.keys(fields).length > 0}
      <ul class="space-y-0.5 text-xs text-destructive">
        {#each Object.entries(fields) as [path, message] (path)}
          <li><code class="font-mono">{path}</code>: {message}</li>
        {/each}
      </ul>
    {/if}
  </div>
</TabPanel>
