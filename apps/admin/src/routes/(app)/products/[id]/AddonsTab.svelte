<script lang="ts">
  import { api } from '~/lib/api';
  import IconPicker from '~/lib/components/IconPicker.svelte';
  import MoneyInput from '~/lib/components/MoneyInput.svelte';
  import SortableList from '~/lib/components/SortableList.svelte';
  import TranslatedInput from '~/lib/components/TranslatedInput.svelte';
  import TranslatedTextarea from '~/lib/components/TranslatedTextarea.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import type { AdminProduct, Localized, TabProps } from './shared';
  import { localizedOf, localizedOrNull } from './shared';

  let { product, onSaved }: TabProps = $props();

  interface AddonEdit {
    id?: string | undefined;
    name: Localized;
    description: Localized;
    sku: string;
    pricingMode: 'fixed' | 'rental';
    price: string;
    rentalUnit: 'hour' | 'day';
    minQuantity: number;
    maxQuantity: string;
    isRequired: boolean;
    icon: string | null;
  }

  function toEdit(addon: AdminProduct['addons'][number]): AddonEdit {
    return {
      id: addon.id,
      name: localizedOf(addon.name),
      description: localizedOf(addon.description),
      sku: addon.sku ?? '',
      pricingMode: addon.pricingMode,
      price: addon.price,
      rentalUnit: addon.rentalUnit ?? 'day',
      minQuantity: addon.minQuantity,
      maxQuantity: addon.maxQuantity?.toString() ?? '',
      isRequired: addon.isRequired,
      icon: addon.icon,
    };
  }

  let addons = $state<AddonEdit[]>(product.addons.map(toEdit));
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});
  let savedFlash = $state(false);

  /** fixed product → ['fixed']; rental product → ['rental', 'fixed']. */
  const allowedModes = $derived(product.allowedAddonModes);

  function addAddon() {
    addons = [
      ...addons,
      {
        name: { it: '' },
        description: { it: '' },
        sku: '',
        pricingMode: allowedModes[0] ?? 'fixed',
        price: '0.00',
        rentalUnit: product.rentalUnit ?? 'day',
        minQuantity: 0,
        maxQuantity: '',
        isRequired: false,
        icon: null,
      },
    ];
  }

  async function save() {
    saving = true;
    error = null;
    fields = {};
    try {
      const payload = addons.map((addon, position) => ({
        ...(addon.id ? { id: addon.id } : {}),
        name: localizedOrNull(addon.name) ?? { it: '' },
        description: localizedOrNull(addon.description),
        sku: addon.sku.trim() || null,
        pricingMode: addon.pricingMode,
        price: addon.price,
        rentalUnit: addon.pricingMode === 'rental' ? addon.rentalUnit : null,
        minQuantity: addon.minQuantity,
        maxQuantity: addon.maxQuantity === '' ? null : Number(addon.maxQuantity),
        isRequired: addon.isRequired,
        icon: addon.icon,
        position,
      }));

      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].addons.$put({
          param: { id: product.id },
          json: payload,
        }),
      );
      onSaved(updated);
      addons = updated.addons.map(toEdit);
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

<div class="flex max-w-3xl flex-col gap-4">
  {#if product.pricingMode === 'fixed'}
    <p class="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500 dark:bg-neutral-800/40">
      This product is sold at a fixed price, so its addons can only be fixed-price too — a rental
      addon would have nothing to bill against.
    </p>
  {/if}

  <SortableList bind:items={addons} onRemove={(index) => (addons = addons.filter((_, i) => i !== index))}>
    {#snippet row(addon)}
      <div class="flex flex-col gap-3">
        <TranslatedInput label="Name" bind:value={addon.name} />
        <TranslatedTextarea label="Description" bind:value={addon.description} rows={2} />

        <div class="flex flex-wrap items-end gap-3 text-xs">
          <label class="block">
            <span class="mb-1 block font-medium">SKU</span>
            <input
              type="text"
              bind:value={addon.sku}
              class="w-32 rounded border border-neutral-300 px-2 py-1.5 font-mono uppercase dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>

          <label class="block">
            <span class="mb-1 block font-medium">Pricing</span>
            <select
              bind:value={addon.pricingMode}
              class="rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {#each allowedModes as mode (mode)}
                <option value={mode}>{mode}</option>
              {/each}
            </select>
          </label>

          {#if addon.pricingMode === 'rental'}
            <label class="block">
              <span class="mb-1 block font-medium">Per</span>
              <select
                bind:value={addon.rentalUnit}
                class="rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="day">day</option>
                <option value="hour">hour</option>
              </select>
            </label>
          {/if}

          <MoneyInput
            label="Price"
            bind:value={addon.price}
            suffix={addon.pricingMode === 'rental' ? `€ / ${addon.rentalUnit}` : '€'}
          />

          <label class="block">
            <span class="mb-1 block font-medium">Min qty</span>
            <input type="number" min="0" bind:value={addon.minQuantity} class="w-16 rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900" />
          </label>
          <label class="block">
            <span class="mb-1 block font-medium">Max qty</span>
            <input type="number" min="1" bind:value={addon.maxQuantity} placeholder="∞" class="w-16 rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900" />
          </label>
          <label class="flex items-center gap-1.5 pb-1.5">
            <input type="checkbox" bind:checked={addon.isRequired} /> Required
          </label>
        </div>

        <IconPicker label="Icon (up to 1024 × 1024)" bind:value={addon.icon} profile="icon_1024" />
      </div>
    {/snippet}
  </SortableList>

  <button
    type="button"
    onclick={addAddon}
    class="self-start rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-500 transition hover:border-neutral-400 dark:border-neutral-700"
  >
    + Add addon
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
      {saving ? 'Saving…' : 'Save addons'}
    </button>
  </div>
</div>
