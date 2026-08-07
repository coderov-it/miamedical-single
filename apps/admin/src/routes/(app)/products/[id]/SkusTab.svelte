<!--
  The SKU matrix, as a spreadsheet rather than a form.

  The old version fired a `PATCH` on every cell blur and reloaded the whole
  product aggregate with each one — twenty rows meant twenty round trips and
  twenty full re-renders. Here edits are local and one Save flushes only the
  rows that actually changed.

  It is still N requests (the API is per-SKU), and the save reports honestly
  when only some of them land rather than claiming a clean save.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import WandSparklesIcon from '@lucide/svelte/icons/wand-sparkles';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import { formatMoney } from '~/lib/format';
  import { errorMessage, unwrapFull } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import type { AdminProduct, TabProps } from './shared';
  import { sameAsSaved } from './shared';
  import TabPanel from './tab-panel.svelte';

  let { product, onSaved, dirty }: TabProps = $props();

  const SECTION = 'skus';

  interface SkuEdit {
    id: string;
    sku: string;
    optionIds: string[];
    resolvedPrice: string;
    stock: number;
    priceOverride: string;
    isActive: boolean;
  }

  const snapshot = (source: AdminProduct): SkuEdit[] =>
    source.skus.map((sku) => ({
      id: sku.id,
      sku: sku.sku,
      optionIds: [...sku.optionIds],
      resolvedPrice: sku.resolvedPrice,
      stock: sku.stock,
      priceOverride: sku.priceOverride ?? '',
      isActive: sku.isActive,
    }));

  /** Only the editable columns count towards dirtiness. */
  const comparable = (rows: SkuEdit[]) =>
    rows.map((row) => ({
      id: row.id,
      stock: row.stock,
      priceOverride: row.priceOverride,
      isActive: row.isActive,
    }));

  let rows = $state(untrack(() => snapshot(product)));
  let saved = $state(untrack(() => comparable(rows)));

  // Generation rewrites the matrix, so this reseeds on the SKU set changing
  // as well as on the product changing.
  let seededFor = $state(untrack(() => `${product.id}:${product.skus.length}`));
  $effect(() => {
    const stamp = `${product.id}:${product.skus.length}`;
    if (stamp === seededFor) return;
    seededFor = stamp;
    rows = snapshot(product);
    saved = comparable(rows);
  });

  const isDirty = $derived(!sameAsSaved(comparable(rows), saved));
  $effect(() => dirty.set(SECTION, isDirty));

  const canUpdate = $derived(session.can(P.PRODUCT_UPDATE));

  let saving = $state(false);
  let generating = $state(false);
  let error = $state<string | null>(null);
  let lastGeneration = $state<{ created: number; deactivated: number; total: number } | null>(null);

  /** Label a SKU's combination from its variant option ids. */
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
      }>(await api.api.admin.products[':id'].skus.generate.$post({ param: { id: product.id } }));

      onSaved(body.data);
      lastGeneration = body.generation;
      toast.success(
        `${body.generation.created} new, ${body.generation.deactivated} deactivated, ${body.generation.total} total.`,
      );
    } catch (err) {
      error = errorMessage(err);
      toast.error(error);
    } finally {
      generating = false;
    }
  }

  /** `1` → `1.00`, `1,5` → `1.5`; blank means "no override", not zero. */
  function normalizeOverride(raw: string): string | null {
    const text = raw.trim().replace(',', '.');
    if (text === '') return null;
    return /^\d+$/.test(text) ? `${text}.00` : text;
  }

  async function save() {
    saving = true;
    error = null;

    const before = new Map(saved.map((row) => [row.id, row]));
    const changed = rows.filter((row) => {
      const original = before.get(row.id);
      return (
        !original ||
        original.stock !== row.stock ||
        original.priceOverride !== row.priceOverride ||
        original.isActive !== row.isActive
      );
    });

    let latest: AdminProduct | null = null;
    let failed = 0;

    // Sequential rather than parallel: each response carries the whole
    // aggregate, and concurrent writes would race over which one is "last".
    for (const row of changed) {
      try {
        const body = await unwrapFull<{ data: AdminProduct }>(
          await api.api.admin.products[':id'].skus[':skuId'].$patch({
            param: { id: product.id, skuId: row.id },
            json: {
              stock: row.stock,
              priceOverride: normalizeOverride(row.priceOverride),
              isActive: row.isActive,
            },
          }),
        );
        latest = body.data;
      } catch (err) {
        failed += 1;
        error = errorMessage(err);
      }
    }

    if (latest) {
      rows = snapshot(latest);
      saved = comparable(rows);
      onSaved(latest);
    }

    if (failed === 0) {
      dirty.clear(SECTION);
      toast.success(
        changed.length === 0
          ? 'Nothing to save.'
          : `Saved ${changed.length} of ${rows.length} SKUs.`,
      );
    } else {
      // Do NOT clear the dirty flag — some rows genuinely did not save.
      toast.error(`${failed} of ${changed.length} SKUs failed to save.`);
    }

    saving = false;
  }
</script>

<TabPanel
  title="SKUs"
  description="One sellable row per variant combination. Stock and price overrides are edited in place."
  dirty={isDirty}
  {saving}
  {error}
  onSave={save}
  saveLabel="Save SKUs"
  disabledReason={canUpdate ? undefined : 'You need product:update to change this.'}
>
  <div class="space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3 rounded-lg border bg-muted/30 p-4">
      <div class="min-w-0 text-sm">
        {#if affectingGroups.length === 0}
          <p class="text-muted-foreground">
            No variant group joins the SKU matrix. Mark a single-select or yes/no group as “affects
            SKU” on the Variants tab first.
          </p>
        {:else}
          <p>
            Matrix of
            {#each affectingGroups as group, index (group.id)}
              {index > 0 ? ' × ' : ''}<strong>{group.label.it}</strong> ({group.options.length})
            {/each}
            → <strong>{expectedCombos}</strong> combinations.
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            Existing combinations are kept; vanished ones are deactivated, never deleted — a printed
            label must still resolve.
          </p>
        {/if}
        {#if lastGeneration}
          <p class="mt-1 text-xs text-emerald-600">
            Generated: {lastGeneration.created} new, {lastGeneration.deactivated} deactivated,
            {lastGeneration.total} total.
          </p>
        {/if}
      </div>

      <Button
        variant="secondary"
        onclick={generate}
        disabled={generating || affectingGroups.length === 0 || !canUpdate}
      >
        <WandSparklesIcon />
        {generating ? 'Generating…' : 'Generate matrix'}
      </Button>
    </div>

    <div class="overflow-x-auto rounded-lg border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-10 text-right text-muted-foreground">#</Table.Head>
            <Table.Head>SKU</Table.Head>
            <Table.Head>Combination</Table.Head>
            <Table.Head class="w-24">Stock</Table.Head>
            <Table.Head class="w-32">Override</Table.Head>
            <Table.Head class="w-28 text-right">Resolved</Table.Head>
            <Table.Head class="w-20">Active</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as row, index (row.id)}
            <Table.Row class={cn(!row.isActive && 'opacity-55')}>
              <Table.Cell class="text-right text-xs text-muted-foreground tabular-nums">
                {index + 1}
              </Table.Cell>
              <Table.Cell class="font-mono text-xs">{row.sku}</Table.Cell>
              <Table.Cell class="text-xs text-muted-foreground">
                {row.optionIds.map((id) => optionLabel.get(id) ?? '?').join(' · ')}
              </Table.Cell>
              <Table.Cell>
                <Input
                  type="number"
                  min="0"
                  bind:value={row.stock}
                  disabled={!canUpdate}
                  aria-label="Stock for {row.sku}"
                  class="h-7 w-20 text-right text-xs tabular-nums"
                />
              </Table.Cell>
              <Table.Cell>
                <Input
                  bind:value={row.priceOverride}
                  placeholder="—"
                  disabled={!canUpdate}
                  aria-label="Price override for {row.sku}"
                  class="h-7 w-28 text-right text-xs tabular-nums"
                />
              </Table.Cell>
              <Table.Cell class="text-right text-xs tabular-nums">
                {formatMoney(row.resolvedPrice, product.currency)}
              </Table.Cell>
              <Table.Cell>
                <Switch
                  checked={row.isActive}
                  disabled={!canUpdate}
                  onCheckedChange={(checked) => (row.isActive = checked)}
                  aria-label="{row.sku} active"
                />
              </Table.Cell>
            </Table.Row>
          {:else}
            <Table.Row>
              <Table.Cell colspan={7} class="py-8 text-center text-muted-foreground">
                No SKUs yet — generate the matrix.
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>

    <p class="text-xs text-muted-foreground">
      The resolved price updates after saving — it is computed on the server from the base price,
      the variant modifiers and any override.
    </p>
  </div>
</TabPanel>
