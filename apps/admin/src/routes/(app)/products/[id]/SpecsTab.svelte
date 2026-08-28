<!--
  Product spec values.

  The inputs here are generated from the *category's* spec definitions, so
  choosing a category on the Basics tab is what makes this tab appear at all.
  Each row states whether the value feeds a storefront filter or the comparison
  table, because that is the difference between "worth filling in" and "nice to
  have" — and it is not visible anywhere else.

  Brand sits here rather than on Basics because it is a specification of the
  product, not part of its identity. It is still a column on `products` and not
  a category spec, so saving this tab is two requests: a PATCH for the brand and
  the PUT for the values. They are reported honestly rather than as one save —
  see the error handling below.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import { toast } from 'svelte-sonner';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { api } from '~/lib/api';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import type { AdminCategory, AdminProduct, Localized, TabProps } from './shared';
  import { localizedOrNull, sameAsSaved } from './shared';
  import TabPanel from './tab-panel.svelte';

  let { product, onSaved, dirty }: TabProps = $props();

  const SECTION = 'specs';
  /** bits-ui reads `''` as "nothing selected", so absence needs a sentinel. */
  const NONE = '__none';

  interface SpecEdit {
    specId: string;
    numberValue: string;
    numberMin: string;
    numberMax: string;
    booleanValue: string;
    optionIds: string[];
    textValue: Localized;
  }

  const category = new Resource(
    () => product.categoryId,
    async (id, signal) =>
      unwrap<AdminCategory>(
        await api.api.admin.categories[':id'].$get({ param: { id } }, { init: { signal } }),
      ),
    { enabled: () => session.can(P.CATEGORY_READ) },
  );

  /**
   * A product column, so it lives outside the spec-value map. Seeded by the
   * same effect as `edits`, not at init: the category definitions arrive
   * asynchronously and both halves of this tab reseed on the same stamp.
   */
  let brand = $state('');
  let savedBrand = $state('');

  function snapshot(specs: AdminCategory['specs'], source: AdminProduct) {
    const next: Record<string, SpecEdit> = {};
    for (const spec of specs) {
      const value = source.specValues.find((entry) => entry.specId === spec.id);
      next[spec.id] = {
        specId: spec.id,
        numberValue: value?.numberValue?.toString() ?? '',
        numberMin: value?.numberMin?.toString() ?? '',
        numberMax: value?.numberMax?.toString() ?? '',
        booleanValue:
          value?.booleanValue === true ? 'true' : value?.booleanValue === false ? 'false' : NONE,
        optionIds: value?.optionIds ?? [],
        textValue: value?.textValue
          ? { it: value.textValue.it, en: value.textValue.en }
          : { it: '' },
      };
    }
    return next;
  }

  let edits = $state<Record<string, SpecEdit>>({});
  let saved = $state<Record<string, SpecEdit>>({});

  // Seeded once per (category, product) pair — the definitions arrive
  // asynchronously, so this cannot run at component init.
  let seededFor = $state<string | null>(null);
  $effect(() => {
    const specs = category.data?.specs;
    if (!specs) return;

    const stamp = `${product.id}:${product.categoryId}`;
    if (stamp === seededFor) return;
    seededFor = stamp;

    edits = snapshot(specs, product);
    saved = snapshot(specs, product);
    brand = product.brand ?? '';
    savedBrand = product.brand ?? '';
  });

  const isDirty = $derived(!sameAsSaved(edits, saved) || brand.trim() !== savedBrand);
  $effect(() => dirty.set(SECTION, isDirty));

  const canUpdate = $derived(session.can(P.PRODUCT_UPDATE));

  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  function isEmpty(spec: AdminCategory['specs'][number], edit: SpecEdit): boolean {
    switch (spec.valueType) {
      case 'number':
        return edit.numberValue === '';
      case 'number_range':
        return edit.numberMin === '' && edit.numberMax === '';
      case 'boolean':
        return edit.booleanValue === NONE;
      case 'single_select':
      case 'multi_select':
        return edit.optionIds.length === 0;
      default:
        return !edit.textValue.it.trim();
    }
  }

  async function save() {
    const specs = category.data?.specs;
    if (!specs) return;

    // Checked before the request: the server would reject it too, but naming
    // every missing field at once beats one round trip per omission.
    const missing = specs.filter((spec) => spec.isRequired && isEmpty(spec, edits[spec.id]!));
    if (missing.length > 0) {
      error = `Still required: ${missing.map((spec) => spec.label.it).join(', ')}.`;
      return;
    }

    saving = true;
    error = null;
    fields = {};

    try {
      const payload = specs
        .filter((spec) => !isEmpty(spec, edits[spec.id]!))
        .map((spec) => {
          const edit = edits[spec.id]!;
          return {
            specId: spec.id,
            numberValue: edit.numberValue === '' ? null : Number(edit.numberValue),
            numberMin: edit.numberMin === '' ? null : Number(edit.numberMin),
            numberMax: edit.numberMax === '' ? null : Number(edit.numberMax),
            booleanValue: edit.booleanValue === NONE ? null : edit.booleanValue === 'true',
            textValue: spec.valueType === 'string' ? localizedOrNull(edit.textValue) : null,
            optionIds: edit.optionIds,
          };
        });

      /* Brand first: if it fails the values are untouched, which is the easier
         half to reason about when a save only partly lands. */
      if (brand.trim() !== savedBrand) {
        await unwrap<AdminProduct>(
          await api.api.admin.products[':id'].$patch({
            param: { id: product.id },
            json: { brand: brand.trim() || null },
          }),
        );
      }

      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].specs.$put({
          param: { id: product.id },
          json: payload,
        }),
      );

      edits = snapshot(specs, updated);
      saved = snapshot(specs, updated);
      brand = updated.brand ?? '';
      savedBrand = updated.brand ?? '';
      dirty.clear(SECTION);
      onSaved(updated);
      toast.success('Specifications saved.');
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }

  const booleanLabel = (value: string) =>
    value === 'true' ? 'Sì' : value === 'false' ? 'No' : '—';
</script>

<TabPanel
  title="Specifications"
  description="Defined by the category. These are what the storefront filters and compares on."
  dirty={isDirty}
  {saving}
  error={error ?? category.error}
  onSave={category.data ? save : undefined}
  saveLabel="Save specifications"
  disabledReason={canUpdate ? undefined : 'You need product:update to change this.'}
>
  {#if !category.data}
    <div class="space-y-3">
      {#each { length: 4 } as _, row (row)}
        <Skeleton class="h-20 w-full" />
      {/each}
    </div>
  {:else}
    <div class="max-w-2xl space-y-3">
      <!--
        Brand is every category's spec, so it is written here rather than
        defined per category — it identifies the manufacturer of any aid, and
        making eighteen categories each declare their own "Marca" would be
        eighteen chances to word it differently.
      -->
      <div class="rounded-lg border p-4">
        <Label class="mb-2.5 block text-sm font-medium" for="specs-brand">Brand</Label>
        <Input id="specs-brand" bind:value={brand} disabled={!canUpdate} class="max-w-sm" />
      </div>

      {#if category.data.specs.length === 0}
        <p class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          The category “{category.data.translations.it?.name ?? category.data.code}” defines no
          further specifications. Add spec fields to it under Categories.
        </p>
      {/if}

      {#each category.data.specs as spec (spec.id)}
        {@const edit = edits[spec.id]}
        {#if edit}
          <div class="rounded-lg border p-4">
            <div class="mb-2.5 flex flex-wrap items-center gap-2">
              <Label class="text-sm font-medium">
                {spec.label.it}
                {#if spec.isRequired}<span class="text-destructive">*</span>{/if}
              </Label>
              {#if spec.unit}
                <span class="text-xs text-muted-foreground">({spec.unit})</span>
              {/if}
              <span class="ml-auto flex gap-1">
                {#if spec.isFilterable}<Badge variant="secondary">filter</Badge>{/if}
                {#if spec.isComparable}<Badge variant="secondary">compare</Badge>{/if}
              </span>
            </div>

            {#if spec.helpText?.it}
              <p class="mb-2 text-xs text-muted-foreground">{spec.helpText.it}</p>
            {/if}

            {#if spec.valueType === 'number'}
              <Input
                type="number"
                step="any"
                bind:value={edit.numberValue}
                disabled={!canUpdate}
                class="w-40"
                aria-label={spec.label.it}
              />
            {:else if spec.valueType === 'number_range'}
              <div class="flex items-center gap-2">
                <Input
                  type="number"
                  step="any"
                  bind:value={edit.numberMin}
                  placeholder="min"
                  disabled={!canUpdate}
                  class="w-28"
                  aria-label="{spec.label.it} minimum"
                />
                <span class="text-muted-foreground">–</span>
                <Input
                  type="number"
                  step="any"
                  bind:value={edit.numberMax}
                  placeholder="max"
                  disabled={!canUpdate}
                  class="w-28"
                  aria-label="{spec.label.it} maximum"
                />
              </div>
            {:else if spec.valueType === 'boolean'}
              <Select.Root type="single" bind:value={edit.booleanValue}>
                <Select.Trigger class="w-32">{booleanLabel(edit.booleanValue)}</Select.Trigger>
                <Select.Content>
                  <Select.Item value={NONE}>—</Select.Item>
                  <Select.Item value="true">Sì</Select.Item>
                  <Select.Item value="false">No</Select.Item>
                </Select.Content>
              </Select.Root>
            {:else if spec.valueType === 'single_select'}
              {@const selected = edit.optionIds[0] ?? NONE}
              <Select.Root
                type="single"
                value={selected}
                onValueChange={(value) => (edit.optionIds = value === NONE ? [] : [value])}
              >
                <Select.Trigger class="w-64">
                  {spec.options.find((option) => option.id === selected)?.label.it ?? '—'}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value={NONE}>—</Select.Item>
                  {#each spec.options as option (option.id)}
                    <Select.Item value={option.id}>{option.label.it}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            {:else if spec.valueType === 'multi_select'}
              <div class="flex flex-wrap gap-x-4 gap-y-2">
                {#each spec.options as option (option.id)}
                  <Label class="flex items-center gap-2 text-sm font-normal">
                    <Checkbox
                      checked={edit.optionIds.includes(option.id)}
                      disabled={!canUpdate}
                      onCheckedChange={(checked) => {
                        edit.optionIds = checked
                          ? [...edit.optionIds, option.id]
                          : edit.optionIds.filter((id) => id !== option.id);
                      }}
                    />
                    {option.label.it}
                  </Label>
                {/each}
              </div>
            {:else}
              <TranslatedInput
                label={spec.label.it}
                bind:value={edit.textValue}
                required={spec.isRequired}
              />
            {/if}
          </div>
        {/if}
      {/each}

      {#if Object.keys(fields).length > 0}
        <ul class="space-y-0.5 text-xs text-destructive">
          {#each Object.entries(fields) as [path, message] (path)}
            <li><code class="font-mono">{path}</code>: {message}</li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</TabPanel>
