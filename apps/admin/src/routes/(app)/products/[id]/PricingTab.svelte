<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { durationLabel, rentalUnitOptions, unitLabel } from '@mia/i18n';
  import { P } from '@mia/permissions';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { api } from '~/lib/api';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import SortableList from '~/lib/components/sortable-list.svelte';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import { uiLang } from '~/lib/ui-lang.svelte';
  import type { AdminProduct, Localized, TabProps } from './shared';
  import { localizedOf, sameAsSaved } from './shared';
  import TabPanel from './tab-panel.svelte';

  let { product, onSaved, dirty }: TabProps = $props();

  const SECTION = 'pricing';

  type RentalUnit = 'hour' | 'day';

  /**
   * `code` is carried but never edited: an order line records it, so renaming
   * or re-pricing a package must not rewrite what past orders point at. New
   * rows derive one from the package's own identity (duration + unit) and it
   * is frozen from then on.
   */
  interface PackageEdit {
    uid: string;
    code: string;
    name: Localized;
    price: string;
    /** A string, not a number: an empty field while typing is not 0. */
    duration: string;
    unit: RentalUnit;
  }

  const toEdit = (item: AdminProduct['rentalPackages'][number]): PackageEdit => ({
    uid: item.code,
    code: item.code,
    name: localizedOf(item.name),
    price: item.price,
    duration: String(item.duration),
    unit: item.unit,
  });

  const snapshot = (source: AdminProduct) => ({
    basePrice: source.basePrice,
    rentalUnit: (source.rentalUnit ?? 'day') as RentalUnit,
  });

  /** `uid` is presentation-only, so it must not count towards dirtiness. */
  const comparable = (rows: PackageEdit[]) => rows.map(({ uid: _uid, ...rest }) => rest);

  let form = $state(untrack(() => snapshot(product)));
  let saved = $state(untrack(() => snapshot(product)));
  let packages = $state(untrack(() => product.rentalPackages.map(toEdit)));
  let savedPackages = $state(untrack(() => comparable(packages)));

  let seededFor = $state(untrack(() => product.id));
  $effect(() => {
    if (product.id === seededFor) return;
    seededFor = product.id;
    form = snapshot(product);
    saved = snapshot(product);
    packages = product.rentalPackages.map(toEdit);
    savedPackages = comparable(packages);
  });

  const isRental = $derived(product.pricingMode === 'rental');
  const isDirty = $derived(
    !sameAsSaved(form, saved) || !sameAsSaved(comparable(packages), savedPackages),
  );
  $effect(() => dirty.set(SECTION, isDirty));

  const canUpdate = $derived(session.can(P.PRODUCT_UPDATE));

  /** Matches `RentalPackagesSchema` — the server rejects a 16th. */
  const MAX_PACKAGES = 15;
  const unitOptions = $derived(rentalUnitOptions(uiLang.current));
  const perUnit = $derived(unitLabel(form.rentalUnit, uiLang.current));

  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  /** `7-day`, `12-hour` — machine tokens, deduped against the rows in hand. */
  function deriveCode(duration: string, unit: RentalUnit): string {
    const base = `${Number(duration) || 1}-${unit}`;
    if (!packages.some((item) => item.code === base)) return base;
    for (let n = 2; ; n++) {
      const candidate = `${base}-${n}`;
      if (!packages.some((item) => item.code === candidate)) return candidate;
    }
  }

  function add() {
    const unit = form.rentalUnit;
    packages.push({
      uid: crypto.randomUUID(),
      code: deriveCode('1', unit),
      name: { it: '' },
      price: '0.00',
      duration: '1',
      unit,
    });
  }

  async function save() {
    saving = true;
    error = null;
    fields = {};

    try {
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].$patch({
          param: { id: product.id },
          json: {
            basePrice: form.basePrice,
            ...(isRental
              ? {
                  rentalUnit: form.rentalUnit,
                  rentalPackages: packages.map((item) => ({
                    code: item.code,
                    // Italian is mandatory; fall back to the composed duration
                    // label so an unnamed row saves as "7 giorni" rather than
                    // failing validation on an empty string.
                    name: item.name.it.trim()
                      ? {
                          it: item.name.it.trim(),
                          ...(item.name.en?.trim() ? { en: item.name.en.trim() } : {}),
                        }
                      : { it: durationLabel(Number(item.duration) || 1, item.unit, 'it') },
                    price: item.price,
                    duration: Number(item.duration) || 1,
                    unit: item.unit,
                  })),
                }
              : {}),
          },
        }),
      );
      saved = snapshot(updated);
      form = snapshot(updated);
      packages = updated.rentalPackages.map(toEdit);
      savedPackages = comparable(packages);
      dirty.clear(SECTION);
      onSaved(updated);
      toast.success('Pricing saved.');
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }
</script>

<TabPanel
  title="Pricing"
  description="The base figure everything else is computed from."
  dirty={isDirty}
  {saving}
  {error}
  onSave={save}
  saveLabel="Save pricing"
  disabledReason={canUpdate ? undefined : 'You need product:update to change this.'}
>
  <div class="space-y-6">
    <div class="max-w-md space-y-4">
      <!--
        Shown but never editable: the update schema omits the field and the repo
        never lists the column. Hiding it entirely would be worse — the mode is
        the single most consequential thing about a product's pricing, and it
        belongs on the pricing tab even when it cannot be changed.
      -->
      <div>
        <Label class="mb-1.5" for="pricing-mode">Pricing mode</Label>
        <Input
          id="pricing-mode"
          value={isRental
            ? `Rental, billed per ${unitLabel(form.rentalUnit, uiLang.current)}`
            : 'Fixed price'}
          disabled
        />
        <p class="mt-1 text-xs text-muted-foreground">
          Chosen at creation and permanent: modifiers, SKUs and addons are all priced against it.
        </p>
      </div>

      {#if isRental}
        <div>
          <Label class="mb-1.5">Billed per</Label>
          <Select.Root type="single" bind:value={form.rentalUnit}>
            <Select.Trigger class="w-40">{perUnit}</Select.Trigger>
            <Select.Content>
              {#each unitOptions as option (option.value)}
                <Select.Item value={option.value}>{option.label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if fields.rentalUnit}
            <p class="mt-1 text-xs text-destructive" role="alert">{fields.rentalUnit}</p>
          {/if}
        </div>
      {/if}

      <MoneyInput
        label={isRental ? `Base price per ${perUnit}` : 'Base price'}
        bind:value={form.basePrice}
        error={fields.basePrice}
        suffix={product.currency}
      />

      <p class="text-xs text-muted-foreground">
        Variant modifiers inherit this mode — on a rental product an option's “+ €4,00” means per {isRental
          ? perUnit
          : 'unit'}. A SKU's price override replaces the whole computed price.
      </p>
    </div>

    <!--
      Packages are not part of the SKU matrix and nothing derives them from the
      base price: each is a duration sold at a total the operator typed. The
      base rate above stays sellable for any duration a customer asks for.
    -->
    {#if isRental}
      <div class="space-y-3 border-t pt-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-medium">Rental packages</h3>
            <p class="text-xs text-muted-foreground">
              Fixed durations at a fixed total, offered beside the base rate. Customers can still
              rent for any duration at €{form.basePrice} per {perUnit}.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onclick={add}
            disabled={packages.length >= MAX_PACKAGES}
          >
            <PlusIcon />
            Add package
          </Button>
        </div>

        {#if fields.rentalPackages}
          <p class="text-xs text-destructive" role="alert">{fields.rentalPackages}</p>
        {/if}

        {#if packages.length === 0}
          <p class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No packages yet — this product rents by {perUnit} only.
          </p>
        {/if}

        <SortableList
          bind:items={packages}
          key={(item) => item.uid}
          describe={(item) => item.name.it || 'this package'}
          onRemove={(index) => packages.splice(index, 1)}
        >
          {#snippet row(item)}
            <div class="grid flex-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
              <TranslatedInput
                label="Package name"
                bind:value={item.name}
                required={false}
                placeholder={durationLabel(Number(item.duration) || 1, item.unit, uiLang.current)}
              />

              <MoneyInput label="Total price" bind:value={item.price} suffix={product.currency} />

              <div>
                <Label class="mb-1.5" for="pkg-duration-{item.uid}">Duration</Label>
                <Input
                  id="pkg-duration-{item.uid}"
                  type="number"
                  min="1"
                  max="3650"
                  bind:value={item.duration}
                  class="w-24 text-right tabular-nums"
                />
              </div>

              <div>
                <Label class="mb-1.5">Unit</Label>
                <Select.Root type="single" bind:value={item.unit}>
                  <Select.Trigger class="w-28">
                    {unitLabel(
                      item.unit,
                      uiLang.current,
                      Number(item.duration) === 1 ? 'one' : 'many',
                    )}
                  </Select.Trigger>
                  <Select.Content>
                    {#each unitOptions as option (option.value)}
                      <Select.Item value={option.value}>{option.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>
            </div>
          {/snippet}
        </SortableList>

        {#if packages.length >= MAX_PACKAGES}
          <p class="text-xs text-muted-foreground">
            {MAX_PACKAGES} packages is the maximum.
          </p>
        {/if}
      </div>
    {/if}
  </div>
</TabPanel>
