<script lang="ts">
  import { P } from '@mia/permissions';
  import type { InferResponseType } from 'hono/client';
  import { goto } from '$app/navigation';

  import { api } from '~/lib/api';
  import Field from '~/lib/components/Field.svelte';
  import MoneyInput from '~/lib/components/MoneyInput.svelte';
  import PermissionGate from '~/lib/components/PermissionGate.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';

  type Category = InferResponseType<typeof api.api.admin.categories.$get, 200>['data'][number];

  /**
   * Minimal create — Italian title + slug, category, pricing mode, price.
   * Everything else lives in the full editor the save redirects into.
   * The mode is permanent, and this is the one place it is chosen.
   */
  let title = $state('');
  let slug = $state('');
  let slugTouched = $state(false);
  let baseSku = $state('');
  let categoryId = $state('');
  let pricingMode = $state<'fixed' | 'rental'>('fixed');
  let rentalUnit = $state<'hour' | 'day'>('day');
  let basePrice = $state('0.00');

  let categories = $state<Category[]>([]);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  $effect(() => {
    void api.api.admin.categories
      .$get()
      .then((response) => unwrap<Category[]>(response))
      .then((data) => (categories = data))
      .catch((err) => (error = errorMessage(err)));
  });

  // Slug follows the title until the operator edits it by hand.
  $effect(() => {
    if (!slugTouched) slug = slugify(title);
  });

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[̀-ͯ]/g, '')
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/^-+|-+$/g, '')
      .slice(0, 120);
  }

  async function save() {
    saving = true;
    error = null;
    fields = {};
    try {
      const created = await unwrap<{ id: string }>(
        await api.api.admin.products.$post({
          json: {
            baseSku,
            categoryId,
            pricingMode,
            basePrice,
            ...(pricingMode === 'rental' ? { rentalUnit } : {}),
            translations: { it: { title, slug } },
          },
        }),
      );
      await goto(`/products/${created.id}`);
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }
</script>

<PermissionGate permission={P.PRODUCT_CREATE}>
  <div class="mx-auto max-w-xl">
    <h1 class="text-2xl font-semibold tracking-tight">New product</h1>

    <form
      class="mt-6 flex flex-col gap-4"
      onsubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <Field label="Title (Italian)" error={fields['translations.it.title']}>
        <input
          type="text"
          bind:value={title}
          required
          class="focus:border-brand-500 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </Field>

      <Field label="Slug (Italian)" error={fields['translations.it.slug']}>
        <input
          type="text"
          bind:value={slug}
          oninput={() => (slugTouched = true)}
          required
          class="focus:border-brand-500 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </Field>

      <Field
        label="Base SKU"
        error={fields['baseSku']}
        hint="Root of every generated SKU, e.g. MIA-LTE. Globally unique."
      >
        <input
          type="text"
          bind:value={baseSku}
          required
          class="focus:border-brand-500 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm uppercase dark:border-neutral-700 dark:bg-neutral-900"
        />
      </Field>

      <Field label="Category" error={fields['categoryId']}>
        <select
          bind:value={categoryId}
          required
          class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="" disabled>Choose…</option>
          {#each categories as category (category.id)}
            <option value={category.id}>{category.translations.it?.name ?? category.code}</option>
          {/each}
        </select>
      </Field>

      <div
        class="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20"
      >
        <Field
          label="Pricing mode"
          error={fields['pricingMode']}
          hint="Permanent. A product is sold OR rented — this can never be changed after creation."
        >
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm">
              <input type="radio" bind:group={pricingMode} value="fixed" /> Fixed price
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="radio" bind:group={pricingMode} value="rental" /> Rental
            </label>
          </div>
        </Field>

        {#if pricingMode === 'rental'}
          <div class="mt-3">
            <Field label="Billed per" error={fields['rentalUnit']}>
              <select
                bind:value={rentalUnit}
                class="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="day">Day</option>
                <option value="hour">Hour</option>
              </select>
            </Field>
          </div>
        {/if}

        <div class="mt-3">
          <MoneyInput
            label={pricingMode === 'rental' ? `Price per ${rentalUnit}` : 'Price'}
            bind:value={basePrice}
            error={fields['basePrice']}
            suffix="EUR"
          />
        </div>
      </div>

      {#if error}
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
      {/if}

      <div class="flex justify-end gap-2">
        <a
          href="/products"
          class="rounded-lg border border-neutral-300 px-4 py-2 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={saving}
          class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
        >
          {saving ? 'Creating…' : 'Create product'}
        </button>
      </div>
    </form>
  </div>
</PermissionGate>
