<!--
  The spec fields on a category — the thing that actually makes the storefront
  filterable and comparable, and the densest editor in the admin.

  Rows are collapsed by default and shaded one step down from the sheet body
  (`bg-muted/30`), with their contents back on `bg-card`. That two-step nesting
  is what keeps twenty rows legible; a flat list of twenty open forms is not.

  A row with no label shows a red dot rather than an empty heading. "Untitled"
  reads like a name; the dot reads like unfinished work, which is what it is.
-->
<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Collapsible from '$lib/components/ui/collapsible/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { cn } from '$lib/utils.js';
  import IconPicker from '~/lib/components/icon-picker.svelte';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import { editorLang } from '~/lib/editor-lang.svelte';
  import OptionListEditor from './option-list-editor.svelte';
  import { isSelectType, VALUE_TYPES, type SpecEdit } from './spec-edit';

  interface Props {
    specs: SpecEdit[];
    disabled?: boolean;
  }

  let { specs = $bindable(), disabled = false }: Props = $props();

  /**
   * Open state is keyed by the row's stable `uid`, not its index — splicing a
   * row out of the middle would otherwise leave the wrong row expanded.
   */
  let open = $state<Record<string, boolean>>({});

  function add() {
    const spec: SpecEdit = {
      uid: crypto.randomUUID(),
      key: '',
      label: { it: '' },
      helpText: { it: '' },
      valueType: 'single_select',
      unit: '',
      isRequired: false,
      isFilterable: true,
      isComparable: true,
      icon: null,
      tips: '',
      options: [],
    };
    specs.push(spec);
    open[spec.uid] = true;
  }

  function remove(index: number) {
    const [removed] = specs.splice(index, 1);
    if (removed) delete open[removed.uid];
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= specs.length) return;
    const [row] = specs.splice(index, 1);
    if (row) specs.splice(target, 0, row);
  }

  const title = (spec: SpecEdit) =>
    (editorLang.current === 'en' ? spec.label.en : spec.label.it) || spec.label.it;

  const TOGGLES = [
    {
      key: 'isFilterable' as const,
      label: 'Storefront filter',
      hint: 'Shows as a filter in the category listing.',
    },
    {
      key: 'isComparable' as const,
      label: 'Comparable',
      hint: 'Appears as a row in the product comparison table.',
    },
    {
      key: 'isRequired' as const,
      label: 'Required',
      hint: 'A product in this category cannot be published without it.',
    },
  ];
</script>

<div class="space-y-2">
  {#each specs as spec, index (spec.uid)}
    {@const label = title(spec)}
    <Collapsible.Root
      bind:open={() => open[spec.uid] ?? false, (value: boolean) => (open[spec.uid] = value)}
      class="overflow-hidden rounded-lg border bg-muted/30"
    >
      <div class="flex items-center gap-2 px-2 py-1.5">
        <Collapsible.Trigger
          class="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-muted"
        >
          <ChevronRightIcon
            class={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              open[spec.uid] && 'rotate-90',
            )}
          />
          {#if label}
            <span class="truncate text-sm font-medium">{label}</span>
          {:else}
            <span class="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span class="size-1.5 rounded-full bg-destructive"></span>
              No name yet
            </span>
          {/if}
          {#if spec.key}
            <code class="truncate font-mono text-xs text-muted-foreground">{spec.key}</code>
          {/if}
          <span class="ml-auto shrink-0 text-xs text-muted-foreground">
            {VALUE_TYPES.find((type) => type.value === spec.valueType)?.label ?? spec.valueType}
          </span>
        </Collapsible.Trigger>

        <div class="flex shrink-0 items-center">
          <!-- Buttons rather than drag: reordering twenty rows by keyboard has
               to work, and it is the only reorder that works on touch too. -->
          <Button
            variant="ghost"
            size="icon-sm"
            {disabled}
            aria-label="Move {label || 'field'} up"
            onclick={() => move(index, -1)}
          >
            <GripVerticalIcon class="rotate-90" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            class="text-destructive"
            {disabled}
            aria-label="Remove {label || 'field'}"
            onclick={() => remove(index)}
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>

      <Collapsible.Content>
        <div class="space-y-4 border-t bg-card p-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <TranslatedInput label="Label" bind:value={spec.label} placeholder="Larghezza seduta" />
            <div>
              <Label class="mb-1.5" for="spec-key-{spec.uid}">Key</Label>
              <Input
                id="spec-key-{spec.uid}"
                bind:value={spec.key}
                placeholder="larghezza_seduta"
                class="font-mono"
              />
              <p class="mt-1 text-xs text-muted-foreground">
                Used in filter URLs and in the product API. Changing it orphans existing values.
              </p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <Label class="mb-1.5">Value type</Label>
                <Select.Root type="single" bind:value={spec.valueType}>
                  <Select.Trigger class="w-full">
                    {VALUE_TYPES.find((type) => type.value === spec.valueType)?.label ??
                      'Choose a type'}
                  </Select.Trigger>
                  <Select.Content>
                    {#each VALUE_TYPES as type (type.value)}
                      <Select.Item value={type.value}>{type.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>

              <!-- Only numbers carry a unit, so the field appears with them. -->
              {#if spec.valueType === 'number' || spec.valueType === 'number_range'}
                <div>
                  <Label class="mb-1.5" for="spec-unit-{spec.uid}">Unit</Label>
                  <Input id="spec-unit-{spec.uid}" bind:value={spec.unit} placeholder="cm" />
                </div>
              {/if}
            </div>

            <IconPicker label="Icon" bind:value={spec.icon} compact />
          </div>

          <TranslatedInput
            label="Help text"
            bind:value={spec.helpText}
            required={false}
            multiline
            rows={2}
            placeholder="Shown under the filter on the storefront."
          />

          {#if isSelectType(spec.valueType)}
            <OptionListEditor bind:options={spec.options} {disabled} />
          {/if}

          <div class="grid gap-3 rounded-lg border bg-muted/40 p-3 sm:grid-cols-3">
            {#each TOGGLES as toggle (toggle.key)}
              <div class="flex items-start gap-2.5">
                <Switch
                  id="{toggle.key}-{spec.uid}"
                  checked={spec[toggle.key]}
                  onCheckedChange={(checked) => (spec[toggle.key] = checked)}
                  {disabled}
                />
                <div class="min-w-0">
                  <Label for="{toggle.key}-{spec.uid}" class="text-sm">{toggle.label}</Label>
                  <p class="mt-0.5 text-xs leading-snug text-muted-foreground">{toggle.hint}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  {:else}
    <div class="rounded-lg border border-dashed p-6 text-center">
      <p class="text-sm text-muted-foreground">
        No spec fields yet. They are what make this category filterable and comparable.
      </p>
    </div>
  {/each}

  <Button type="button" variant="outline" size="sm" {disabled} onclick={add}>
    <PlusIcon />
    Add spec field
  </Button>
</div>
