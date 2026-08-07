<script lang="ts">
  import { api, formatMoney } from '~/lib/api';
  import { errorMessage, unwrapFull } from '~/lib/request';
  import type { AdminProduct, TabProps } from './shared';

  let { product, onSaved }: TabProps = $props();

  let generating = $state(false);
  let error = $state<string | null>(null);
  let lastGeneration = $state<{ created: number; deactivated: number; total: number } | null>(null);

  /** Label a SKU's combination from the variant option ids. */
  const optionLabel = $derived.by(() => {
    const map = new Map<string, string>();
    for (const group of product.variants) {
      for (const option of group.options) {
        map.set(option.id, `${group.label.it}: ${option.label.it}`);
      }
    }
    return map;
  });

  const affectingGroups = $derived(product.variants.filter((group) => group.affectsSku));
  const expectedCombos = $derived(
    affectingGroups.reduce((total, group) => total * Math.max(group.options.length, 1), 1),
  );

  async function generate() {
    generating = true;
    error = null;
    try {
      const body = await unwrapFull<{
        data: AdminProduct;
        generation: { created: number; deactivated: number; total: number };
      }>(
        await api.api.admin.products[':id'].skus.generate.$post({
          param: { id: product.id },
        }),
      );
      onSaved(body.data);
      lastGeneration = body.generation;
    } catch (err) {
      error = errorMessage(err);
    } finally {
      generating = false;
    }
  }

  async function patchSku(
    skuId: string,
    patch: { stock?: number; priceOverride?: string | null; isActive?: boolean },
  ) {
    error = null;
    try {
      const body = await unwrapFull<{ data: AdminProduct }>(
        await api.api.admin.products[':id'].skus[':skuId'].$patch({
          param: { id: product.id, skuId },
          json: patch,
        }),
      );
      onSaved(body.data);
    } catch (err) {
      error = errorMessage(err);
    }
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
    <div class="text-sm">
      {#if affectingGroups.length === 0}
        <p class="text-neutral-500">
          No variant group joins the SKU matrix. Mark single-select or yes/no groups as
          “affects SKU” first.
        </p>
      {:else}
        <p>
          Matrix of
          {#each affectingGroups as group, index (group.id)}
            {index > 0 ? ' × ' : ''}<strong>{group.label.it}</strong> ({group.options.length})
          {/each}
          → <strong>{expectedCombos}</strong> combinations.
        </p>
        <p class="mt-1 text-xs text-neutral-500">
          Existing combinations are kept; vanished ones are deactivated, never deleted — printed
          labels must still resolve.
        </p>
      {/if}
      {#if lastGeneration}
        <p class="mt-1 text-xs text-green-600">
          Generated: {lastGeneration.created} new, {lastGeneration.deactivated} deactivated,
          {lastGeneration.total} total.
        </p>
      {/if}
    </div>
    <button
      type="button"
      onclick={() => void generate()}
      disabled={generating || affectingGroups.length === 0}
      class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
    >
      {generating ? 'Generating…' : 'Generate matrix'}
    </button>
  </div>

  {#if error}
    <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
  {/if}

  <div class="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
    <table class="w-full text-sm">
      <thead class="bg-neutral-50 text-left dark:bg-neutral-800/50">
        <tr>
          <th class="px-3 py-2 font-medium">SKU</th>
          <th class="px-3 py-2 font-medium">Combination</th>
          <th class="px-3 py-2 font-medium">Stock</th>
          <th class="px-3 py-2 font-medium">Price override</th>
          <th class="px-3 py-2 text-right font-medium">Resolved</th>
          <th class="px-3 py-2 font-medium">Active</th>
        </tr>
      </thead>
      <tbody>
        {#each product.skus as sku (sku.id)}
          <tr
            class="border-t border-neutral-100 dark:border-neutral-800"
            class:opacity-50={!sku.isActive}
          >
            <td class="px-3 py-2 font-mono text-xs">{sku.sku}</td>
            <td class="px-3 py-2 text-xs text-neutral-500">
              {sku.optionIds.map((id) => optionLabel.get(id) ?? '?').join(' · ')}
            </td>
            <td class="px-3 py-2">
              <input
                type="number"
                min="0"
                value={sku.stock}
                onchange={(event) =>
                  void patchSku(sku.id, { stock: Number(event.currentTarget.value) })}
                class="w-20 rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
              />
            </td>
            <td class="px-3 py-2">
              <input
                type="text"
                placeholder="—"
                value={sku.priceOverride ?? ''}
                onchange={(event) => {
                  const raw = event.currentTarget.value.trim().replace(',', '.');
                  void patchSku(sku.id, {
                    priceOverride: raw === '' ? null : /^\d+$/.test(raw) ? `${raw}.00` : raw,
                  });
                }}
                class="w-24 rounded border border-neutral-300 px-2 py-1 text-right text-xs tabular-nums dark:border-neutral-700 dark:bg-neutral-900"
              />
            </td>
            <td class="px-3 py-2 text-right tabular-nums">
              {formatMoney(sku.resolvedPrice, product.currency)}
            </td>
            <td class="px-3 py-2">
              <input
                type="checkbox"
                checked={sku.isActive}
                onchange={(event) =>
                  void patchSku(sku.id, { isActive: event.currentTarget.checked })}
              />
            </td>
          </tr>
        {:else}
          <tr>
            <td class="px-3 py-6 text-center text-neutral-500" colspan="6">
              No SKUs yet — generate the matrix.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
