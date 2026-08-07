<script lang="ts">
  import { api } from '~/lib/api';
  import Field from '~/lib/components/Field.svelte';
  import MoneyInput from '~/lib/components/MoneyInput.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import type { AdminProduct, TabProps } from './shared';

  let { product, onSaved }: TabProps = $props();

  let basePrice = $state(product.basePrice);
  let rentalUnit = $state(product.rentalUnit ?? 'day');
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});
  let savedFlash = $state(false);

  const isRental = $derived(product.pricingMode === 'rental');

  async function save() {
    saving = true;
    error = null;
    fields = {};
    try {
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].$patch({
          param: { id: product.id },
          json: { basePrice, ...(isRental ? { rentalUnit } : {}) },
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
  class="flex max-w-md flex-col gap-4"
  onsubmit={(event) => {
    event.preventDefault();
    void save();
  }}
>
  <!-- pricingModeLocked: shown but never editable — the update schema omits
       the field and the repo never lists the column. -->
  <Field
    label="Pricing mode"
    hint="Chosen at creation and permanent: modifiers, SKUs and addons are all priced against it."
  >
    <input
      type="text"
      value={product.pricingMode === 'rental' ? `Rental, billed per ${product.rentalUnit}` : 'Fixed price'}
      disabled
      class="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50"
    />
  </Field>

  {#if isRental}
    <Field label="Billed per" error={fields['rentalUnit']}>
      <select
        bind:value={rentalUnit}
        class="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        <option value="day">Day</option>
        <option value="hour">Hour</option>
      </select>
    </Field>
  {/if}

  <MoneyInput
    label={isRental ? `Base price per ${rentalUnit}` : 'Base price'}
    bind:value={basePrice}
    error={fields['basePrice']}
    suffix={product.currency}
  />

  <p class="text-xs text-neutral-500">
    Variant modifiers inherit this mode — on a rental product an option's “+ €4,00” means
    per {isRental ? rentalUnit : 'unit'}. A SKU's price override replaces the whole computed
    price.
  </p>

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
      {saving ? 'Saving…' : 'Save pricing'}
    </button>
  </div>
</form>
