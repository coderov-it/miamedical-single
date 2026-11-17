<script lang="ts">
  import { pricingModeLabel, rentalUnitOptions, unitLabel } from '@mia/i18n';
  import { P } from '@mia/permissions';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
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
  import { uiLang } from '~/lib/ui-lang.svelte';
  import { t } from '~/lib/ui-text';
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

  /** Back to what the server last returned — drops this tab's unsaved edits. */
  function discard() {
    addons = product.addons.map(toEdit);
    saved = comparable(addons);
  }

  $effect(() => {
    if (product.id === seededFor) return;
    seededFor = product.id;
    discard();
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
      pricingMode: allowedModes[0] ?? 'fixed',
      price: '0.00',
      rentalUnit: product.rentalUnit ?? 'day',
      /* Always 0 — an add-on the customer cannot decline is part of the
         product's price, which is why `is_required` was dropped. */
      minQuantity: 0,
      /* Single by default: multiple is something the back office opts into. */
      maxQuantity: '1',
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
      toast.success(t('products.addonsSaved'));
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }
</script>

<TabPanel
  title={t('products.tabAddons')}
  description={t('products.addonsDescription')}
  dirty={isDirty}
  {saving}
  {error}
  onSave={save}
  onDiscard={discard}
  disabledReason={canUpdate ? undefined : t('products.needUpdatePermission')}
>
  <div class="space-y-3">
    {#if product.pricingMode === 'fixed'}
      <p class="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        {t('products.addonsFixedNotice')}
      </p>
    {/if}

    {#if addons.length === 0}
      <p class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {t('products.addonsEmpty')}
      </p>
    {/if}

    <SortableList
      bind:items={addons}
      label={t('products.addonLabel')}
      key={(addon) => addon.uid}
      describe={(addon) => addon.name.it || t('products.addonFallback')}
      onRemove={(index) => addons.splice(index, 1)}
    >
      {#snippet row(addon)}
        <div class="space-y-3">
          <TranslatedInput label={t('products.fieldName')} bind:value={addon.name} />

          <TranslatedInput
            label={t('products.fieldDescription')}
            bind:value={addon.description}
            required={false}
            multiline
            rows={2}
          />

          <div class="flex flex-wrap items-end gap-3">
            <div>
              <Label class="mb-1.5">{t('products.addonPricing')}</Label>
              <Select.Root type="single" bind:value={addon.pricingMode}>
                <Select.Trigger class="w-28">
                  {pricingModeLabel(addon.pricingMode as 'fixed', uiLang.current)}
                </Select.Trigger>
                <Select.Content>
                  {#each allowedModes as mode (mode)}
                    <Select.Item value={mode}>{pricingModeLabel(mode, uiLang.current)}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>

            {#if addon.pricingMode === 'rental'}
              <div>
                <Label class="mb-1.5">{t('products.addonPer')}</Label>
                <Select.Root type="single" bind:value={addon.rentalUnit}>
                  <Select.Trigger class="w-24">
                    {unitLabel(addon.rentalUnit as 'day', uiLang.current)}
                  </Select.Trigger>
                  <Select.Content>
                    {#each rentalUnitOptions(uiLang.current) as option (option.value)}
                      <Select.Item value={option.value}>{option.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>
            {/if}

            <MoneyInput
              label={t('products.price')}
              bind:value={addon.price}
              suffix={addon.pricingMode === 'rental'
                ? `€ / ${unitLabel(addon.rentalUnit as 'day', uiLang.current)}`
                : '€'}
            />

            <!--
              "Multiple selectable" IS the max quantity: `1` means the storefront
              offers a bare tick, anything higher reveals a stepper. One control
              rather than a flag beside a number that could disagree with it.
            -->
            <div>
              <Label class="mb-1.5" for="addon-multi-{addon.uid}"
                >{t('products.addonSelectable')}</Label
              >
              <div class="flex h-9 items-center gap-2">
                <Checkbox
                  id="addon-multi-{addon.uid}"
                  checked={addon.maxQuantity !== '1'}
                  onCheckedChange={(checked) => (addon.maxQuantity = checked ? '' : '1')}
                />
                <Label for="addon-multi-{addon.uid}" class="font-normal"
                  >{t('products.addonMultiple')}</Label
                >
              </div>
            </div>
            {#if addon.maxQuantity !== '1'}
              <div>
                <Label class="mb-1.5" for="addon-max-{addon.uid}">{t('products.addonMaxQty')}</Label
                >
                <Input
                  id="addon-max-{addon.uid}"
                  type="number"
                  min="2"
                  bind:value={addon.maxQuantity}
                  placeholder="∞"
                  class="w-20"
                />
              </div>
            {/if}
          </div>

          <IconPicker
            label={t('products.addonIcon')}
            bind:value={addon.icon}
            profile="icon_1024"
            compact
          />
        </div>
      {/snippet}
    </SortableList>

    <Button variant="outline" size="sm" onclick={add}>
      <PlusIcon />
      {t('products.addAddon')}
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
