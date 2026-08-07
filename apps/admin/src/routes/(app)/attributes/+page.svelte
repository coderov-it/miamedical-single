<script lang="ts">
  import { P } from '@mia/permissions';
  import type { InferResponseType } from 'hono/client';

  import { api } from '~/lib/api';
  import IconPicker from '~/lib/components/IconPicker.svelte';
  import PermissionGate from '~/lib/components/PermissionGate.svelte';
  import TranslatedInput from '~/lib/components/TranslatedInput.svelte';
  import { editorLang } from '~/lib/editor-lang.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';

  type Preset = InferResponseType<typeof api.api.admin.attributes.$get, 200>['data'][number];
  type Localized = { it: string; en?: string | undefined };

  interface PresetEdit {
    id?: string | undefined;
    key: string;
    label: Localized;
    valueType: string;
    unit: string;
    isActive: boolean;
    icon: string | null;
    options: { id?: string | undefined; value: string; label: Localized; skuCode: string }[];
  }

  const VALUE_TYPES = [
    ['single_select', 'Single select'],
    ['multi_select', 'Multiple select'],
    ['boolean', 'Yes / No'],
    ['number', 'Number'],
    ['number_range', 'Number range'],
    ['string', 'Free text'],
  ] as const;

  let presets = $state<Preset[]>([]);
  let editing = $state<PresetEdit | null>(null);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  async function load() {
    loading = true;
    try {
      presets = await unwrap<Preset[]>(await api.api.admin.attributes.$get());
    } catch (err) {
      error = errorMessage(err);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void load();
  });

  function startEdit(preset?: Preset) {
    editing = preset
      ? {
          id: preset.id,
          key: preset.key,
          label: { it: preset.label.it, en: preset.label.en },
          valueType: preset.valueType,
          unit: preset.unit ?? '',
          isActive: preset.isActive,
          icon: preset.icon,
          options: preset.options.map((option) => ({
            id: option.id,
            value: option.value,
            label: { it: option.label.it, en: option.label.en },
            skuCode: option.skuCode ?? '',
          })),
        }
      : {
          key: '',
          label: { it: '' },
          valueType: 'single_select',
          unit: '',
          isActive: true,
          icon: null,
          options: [],
        };
  }

  const isSelect = (type: string) => type === 'single_select' || type === 'multi_select';

  async function save() {
    if (!editing) return;
    saving = true;
    error = null;
    fields = {};
    const payload = {
      key: editing.key,
      label: editing.label.en?.trim()
        ? { it: editing.label.it, en: editing.label.en }
        : { it: editing.label.it },
      valueType: editing.valueType as 'string',
      unit: editing.unit.trim() || null,
      isActive: editing.isActive,
      icon: editing.icon,
      options: isSelect(editing.valueType)
        ? editing.options.map((option, position) => ({
            ...(option.id ? { id: option.id } : {}),
            value: option.value,
            label: option.label.en?.trim()
              ? { it: option.label.it, en: option.label.en }
              : { it: option.label.it },
            skuCode: option.skuCode.trim() || null,
            position,
          }))
        : [],
    };
    try {
      if (editing.id) {
        await unwrap(
          await api.api.admin.attributes[':id'].$patch({
            param: { id: editing.id },
            json: payload,
          }),
        );
      } else {
        await unwrap(await api.api.admin.attributes.$post({ json: payload }));
      }
      editing = null;
      await load();
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }

  async function remove(preset: Preset) {
    if (!confirm(`Delete preset "${preset.label.it}"? Products keep their copied groups.`)) return;
    try {
      await unwrap(await api.api.admin.attributes[':id'].$delete({ param: { id: preset.id } }));
      await load();
    } catch (err) {
      error = errorMessage(err);
    }
  }
</script>

<PermissionGate permission={P.ATTRIBUTE_READ}>
  <div class="flex items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Attribute presets</h1>
      <p class="mt-1 text-sm text-neutral-500">
        The toggleable “common variants” — copied into a product, then owned by it.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1 rounded-lg border border-neutral-300 p-1 dark:border-neutral-700">
        {#each ['it', 'en'] as const as lang (lang)}
          <button
            type="button"
            class="rounded-md px-2 py-1 text-xs font-semibold uppercase transition"
            class:bg-brand-600={editorLang.current === lang}
            class:text-white={editorLang.current === lang}
            onclick={() => editorLang.set(lang)}
          >
            {lang}
          </button>
        {/each}
      </div>
      {#if session.can(P.ATTRIBUTE_CREATE)}
        <button
          type="button"
          onclick={() => startEdit()}
          class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
        >
          New preset
        </button>
      {/if}
    </div>
  </div>

  {#if error && !editing}
    <p class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
  {/if}

  {#if editing}
    <form
      class="mt-6 flex max-w-2xl flex-col gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
      onsubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div class="grid grid-cols-2 gap-3">
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Key</span>
          <input type="text" bind:value={editing.key} required class="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Type</span>
          <select bind:value={editing.valueType} class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">
            {#each VALUE_TYPES as [value, label] (value)}
              <option {value}>{label}</option>
            {/each}
          </select>
        </label>
      </div>

      <TranslatedInput label="Label" bind:value={editing.label} error={fields['label.it']} />

      <div class="flex items-center gap-4 text-sm">
        <label class="flex items-center gap-1.5">
          Unit
          <input type="text" bind:value={editing.unit} placeholder="cm" class="w-16 rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" />
        </label>
        <label class="flex items-center gap-1.5">
          <input type="checkbox" bind:checked={editing.isActive} /> Active (offered in the editor)
        </label>
      </div>

      <IconPicker label="Icon (copied into seeded groups)" bind:value={editing.icon} />

      {#if isSelect(editing.valueType)}
        <div class="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/40">
          <div class="mb-2 flex items-center justify-between text-xs">
            <span class="font-semibold">Default options</span>
            <button
              type="button"
              class="text-brand-600 hover:underline"
              onclick={() => {
                if (editing) {
                  editing.options = [
                    ...editing.options,
                    { value: '', label: { it: '' }, skuCode: '' },
                  ];
                }
              }}
            >
              + Add option
            </button>
          </div>
          {#each editing.options as option, index (index)}
            <div class="mb-2 flex items-end gap-2">
              <label class="block text-xs">
                <span class="mb-0.5 block">Value</span>
                <input type="text" bind:value={option.value} class="w-24 rounded border border-neutral-300 px-1.5 py-1 font-mono dark:border-neutral-700 dark:bg-neutral-900" />
              </label>
              <div class="flex-1"><TranslatedInput label="Label" bind:value={option.label} /></div>
              <label class="block text-xs">
                <span class="mb-0.5 block">SKU code</span>
                <input type="text" bind:value={option.skuCode} class="w-16 rounded border border-neutral-300 px-1.5 py-1 font-mono uppercase dark:border-neutral-700 dark:bg-neutral-900" />
              </label>
              <button
                type="button"
                class="pb-1.5 text-xs text-red-500"
                onclick={() => {
                  if (editing) editing.options = editing.options.filter((_, i) => i !== index);
                }}
                aria-label="Remove option">✕</button
              >
            </div>
          {/each}
        </div>
      {/if}

      {#if error}
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
      {/if}

      <div class="flex justify-end gap-2">
        <button
          type="button"
          onclick={() => (editing = null)}
          class="rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save preset'}
        </button>
      </div>
    </form>
  {/if}

  {#if loading}
    <p class="mt-6 text-sm text-neutral-500">Loading…</p>
  {:else}
    <div class="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <table class="w-full text-sm">
        <thead class="bg-neutral-50 text-left dark:bg-neutral-800/50">
          <tr>
            <th class="px-4 py-3 font-medium">Label</th>
            <th class="px-4 py-3 font-medium">Key</th>
            <th class="px-4 py-3 font-medium">Type</th>
            <th class="px-4 py-3 font-medium">Options</th>
            <th class="px-4 py-3 font-medium">Active</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {#each presets as preset (preset.id)}
            <tr class="border-t border-neutral-100 dark:border-neutral-800">
              <td class="px-4 py-3 font-medium">{preset.label.it}</td>
              <td class="px-4 py-3 font-mono text-xs text-neutral-500">{preset.key}</td>
              <td class="px-4 py-3 text-neutral-500">{preset.valueType}</td>
              <td class="px-4 py-3 text-neutral-500">{preset.options.length || '—'}</td>
              <td class="px-4 py-3">{preset.isActive ? '✓' : '—'}</td>
              <td class="px-4 py-3 text-right">
                {#if session.can(P.ATTRIBUTE_UPDATE)}
                  <button type="button" class="text-brand-600 text-xs hover:underline" onclick={() => startEdit(preset)}>
                    Edit
                  </button>
                {/if}
                {#if session.can(P.ATTRIBUTE_DELETE)}
                  <button type="button" class="ml-2 text-xs text-red-600 hover:underline" onclick={() => void remove(preset)}>
                    Delete
                  </button>
                {/if}
              </td>
            </tr>
          {:else}
            <tr><td class="px-4 py-8 text-center text-neutral-500" colspan="6">No presets yet.</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</PermissionGate>
