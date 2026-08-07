<script lang="ts">
  import { P } from '@mia/permissions';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { api } from '~/lib/api';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import type { AdminProduct, TabProps } from './shared';
  import { sameAsSaved } from './shared';
  import TabPanel from './tab-panel.svelte';

  let { product, onSaved, dirty }: TabProps = $props();

  const SECTION = 'pricing';

  const snapshot = (source: AdminProduct) => ({
    basePrice: source.basePrice,
    rentalUnit: source.rentalUnit ?? 'day',
  });

  let form = $state(untrack(() => snapshot(product)));
  let saved = $state(untrack(() => snapshot(product)));

  let seededFor = $state(untrack(() => product.id));
  $effect(() => {
    if (product.id === seededFor) return;
    seededFor = product.id;
    form = snapshot(product);
    saved = snapshot(product);
  });

  const isRental = $derived(product.pricingMode === 'rental');
  const isDirty = $derived(!sameAsSaved(form, saved));
  $effect(() => dirty.set(SECTION, isDirty));

  const canUpdate = $derived(session.can(P.PRODUCT_UPDATE));

  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

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
            ...(isRental ? { rentalUnit: form.rentalUnit as 'day' } : {}),
          },
        }),
      );
      saved = snapshot(updated);
      form = snapshot(updated);
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
        value={isRental ? `Rental, billed per ${product.rentalUnit}` : 'Fixed price'}
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
          <Select.Trigger class="w-40">
            {form.rentalUnit === 'hour' ? 'Hour' : 'Day'}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="day">Day</Select.Item>
            <Select.Item value="hour">Hour</Select.Item>
          </Select.Content>
        </Select.Root>
        {#if fields.rentalUnit}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.rentalUnit}</p>
        {/if}
      </div>
    {/if}

    <MoneyInput
      label={isRental ? `Base price per ${form.rentalUnit}` : 'Base price'}
      bind:value={form.basePrice}
      error={fields.basePrice}
      suffix={product.currency}
    />

    <p class="text-xs text-muted-foreground">
      Variant modifiers inherit this mode — on a rental product an option's “+ €4,00” means per {isRental
        ? form.rentalUnit
        : 'unit'}. A SKU's price override replaces the whole computed price.
    </p>
  </div>
</TabPanel>
