<script lang="ts">
  import { P } from '@mia/permissions';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { api } from '~/lib/api';
  import IconPicker from '~/lib/components/icon-picker.svelte';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import SortableList from '~/lib/components/sortable-list.svelte';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import type { AdminProduct, Localized, TabProps } from './shared';
  import { localizedOf, localizedOrNull, sameAsSaved } from './shared';
  import TabPanel from './tab-panel.svelte';

  let { product, onSaved, dirty }: TabProps = $props();

  const SECTION = 'addons';

  interface AddonEdit {
    uid: string;
    id?: string | undefined;
    name: Localized;
    description: Localized;
    sku: string;
    pricingMode: string;
    price: string;
    rentalUnit: string;
    minQuantity: number;
    maxQuantity: string;
    icon: string | null;
  }

  const toEdit = (addon: AdminProduct['addons'][number]): AddonEdit => ({
    uid: addon.id,
    id: addon.id,
    name: localizedOf(addon.name),
    description: localizedOf(addon.description),
    sku: addon.sku ?? '',
    pricingMode: addon.pricingMode,
    price: addon.price,
    rentalUnit: addon.rentalUnit ?? 'day',
    minQuantity: addon.minQuantity,
    maxQuantity: addon.maxQuantity?.toString() ?? '',
    icon: addon.icon,
  });

  const comparable = (rows: AddonEdit[]) => rows.map(({ uid: _uid, ...rest }) => rest);

  let addons = $state(untrack(() => product.addons.map(toEdit)));
  let saved = $state(untrack(() => comparable(addons)));

  let seededFor = $state(untrack(() => product.id));
  $effect(() => {
    if (product.id === seededFor) return;
    seededFor = product.id;
    addons = product.addons.map(toEdit);
    saved = comparable(addons);
  });

  const isDirty = $derived(!sameAsSaved(comparable(addons), saved));
  $effect(() => dirty.set(SECTION, isDirty));

  const canUpdate = $derived(session.can(P.PRODUCT_UPDATE));

  /** fixed product → ['fixed']; rental product → ['rental', 'fixed']. */
  const allowedModes = $derived(product.allowedAddonModes);

  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  function add() {
    addons.push({
      uid: crypto.randomUUID(),
      name: { it: '' },
      description: { it: '' },
      sku: '',
      pricingMode: allowedModes[0] ?? 'fixed',
      price: '0.00',
      rentalUnit: product.rentalUnit ?? 'day',
      minQuantity: 0,
      maxQuantity: '',
      icon: null,
    });
  }

  async function save() {
    saving = true;
    error = null;
    fields = {};

    try {
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].addons.$put({
          param: { id: product.id },
          json: addons.map((addon, position) => ({
            ...(addon.id ? { id: addon.id } : {}),
            name: localizedOrNull(addon.name) ?? { it: '' },
            description: localizedOrNull(addon.description),
            sku: addon.sku.trim() || null,
            pricingMode: addon.pricingMode as 'fixed',
            price: addon.price,
            // A fixed addon has no unit to bill against, so this must be null
            // rather than a leftover from a mode the operator switched away from.
            rentalUnit: addon.pricingMode === 'rental' ? (addon.rentalUnit as 'day') : null,
            minQuantity: addon.minQuantity,
            maxQuantity: addon.maxQuantity === '' ? null : Number(addon.maxQuantity),
            icon: addon.icon,
            position,
          })),
        }),
      );

      addons = updated.addons.map(toEdit);
      saved = comparable(addons);
      dirty.clear(SECTION);
      onSaved(updated);
      toast.success('Addons saved.');
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }
</script>

<TabPanel
  title="Addons"
  description="Optional extras offered alongside the product, in this order."
  dirty={isDirty}
  {saving}
  {error}
  onSave={save}
  saveLabel="Save addons"
  disabledReason={canUpdate ? undefined : 'You need product:update to change this.'}
>
  <div class="space-y-3">
    {#if product.pricingMode === 'fixed'}
      <p class="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        This product is sold at a fixed price, so its addons can only be fixed-price too — a rental
        addon would have nothing to bill against.
      </p>
    {/if}

    {#if addons.length === 0}
      <p class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No addons yet.
      </p>
    {/if}

    <SortableList
      bind:items={addons}
      label="Addon"
      key={(addon) => addon.uid}
      describe={(addon) => addon.name.it || 'this addon'}
      onRemove={(index) => addons.splice(index, 1)}
    >
      {#snippet row(addon)}
        <div class="space-y-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <TranslatedInput label="Name" bind:value={addon.name} />
            <div>
              <Label class="mb-1.5" for="addon-sku-{addon.uid}">SKU</Label>
              <Input
                id="addon-sku-{addon.uid}"
                bind:value={addon.sku}
                class="font-mono uppercase"
                placeholder="Optional"
              />
            </div>
          </div>

          <TranslatedInput
            label="Description"
            bind:value={addon.description}
            required={false}
            multiline
            rows={2}
          />

          <div class="flex flex-wrap items-end gap-3">
            <div>
              <Label class="mb-1.5">Pricing</Label>
              <Select.Root type="single" bind:value={addon.pricingMode}>
                <Select.Trigger class="w-28">{addon.pricingMode}</Select.Trigger>
                <Select.Content>
                  {#each allowedModes as mode (mode)}
                    <Select.Item value={mode}>{mode}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>

            {#if addon.pricingMode === 'rental'}
              <div>
                <Label class="mb-1.5">Per</Label>
                <Select.Root type="single" bind:value={addon.rentalUnit}>
                  <Select.Trigger class="w-24">{addon.rentalUnit}</Select.Trigger>
                  <Select.Content>
                    <Select.Item value="day">day</Select.Item>
                    <Select.Item value="hour">hour</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>
            {/if}

            <MoneyInput
              label="Price"
              bind:value={addon.price}
              suffix={addon.pricingMode === 'rental' ? `€ / ${addon.rentalUnit}` : '€'}
            />

            <div>
              <Label class="mb-1.5" for="addon-min-{addon.uid}">Min qty</Label>
              <Input
                id="addon-min-{addon.uid}"
                type="number"
                min="0"
                bind:value={addon.minQuantity}
                class="w-20"
              />
            </div>
            <div>
              <Label class="mb-1.5" for="addon-max-{addon.uid}">Max qty</Label>
              <Input
                id="addon-max-{addon.uid}"
                type="number"
                min="1"
                bind:value={addon.maxQuantity}
                placeholder="∞"
                class="w-20"
              />
            </div>

          </div>

          <IconPicker label="Icon" bind:value={addon.icon} profile="icon_1024" compact />
        </div>
      {/snippet}
    </SortableList>

    <Button variant="outline" size="sm" onclick={add}>
      <PlusIcon />
      Add addon
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
