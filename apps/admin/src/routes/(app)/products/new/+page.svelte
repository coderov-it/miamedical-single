<!--
  Minimal create: Italian title and slug, category, pricing mode, price.
  Everything else belongs in the full editor this redirects into — a
  twelve-section form before the product exists is how drafts never get made.

  The pricing mode is the exception, and it is why this page exists at all:
  it is permanent, and this is the only place it can ever be chosen.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { goto } from '$app/navigation';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { api } from '~/lib/api';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type Category = InferResponseType<typeof api.api.admin.categories.$get, 200>['data'][number];

  let title = $state('');
  let slug = $state('');
  let slugTouched = $state(false);
  let baseSku = $state('');
  let categoryId = $state('');
  let pricingMode = $state('fixed');
  let rentalUnit = $state('day');
  let basePrice = $state('0.00');

  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  const categories = new Resource(
    () => null,
    async (_key, signal) =>
      unwrap<Category[]>(await api.api.admin.categories.$get(undefined, { init: { signal } })),
    { enabled: () => session.can(P.CATEGORY_READ) },
  );

  const categoryOptions = $derived(categories.data ?? []);
  const categoryLabel = $derived(
    categoryOptions.find((entry) => entry.id === categoryId)?.translations.it?.name ?? 'Choose…',
  );

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[̀-ͯ]/g, '')
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/^-+|-+$/g, '')
      .slice(0, 120);
  }

  // The slug tracks the title until the operator edits it by hand, after which
  // it is theirs — a slug that keeps rewriting itself is unusable.
  $effect(() => {
    if (!slugTouched) slug = slugify(title);
  });

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
            pricingMode: pricingMode as 'fixed',
            basePrice,
            ...(pricingMode === 'rental' ? { rentalUnit: rentalUnit as 'day' } : {}),
            translations: { it: { title, slug } },
          },
        }),
      );
      toast.success(`Created "${title}".`);
      await goto(routes.productDetail(created.id));
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
      saving = false;
    }
  }
</script>

<section class="admin-page mx-auto max-w-2xl">
  <PageHeader
    eyebrow="Catalog"
    title="New product"
    description="Just enough to create a draft. The full editor opens next."
  />

  <form
    onsubmit={(event) => {
      event.preventDefault();
      void save();
    }}
  >
    <Card.Root class="gap-0 py-0">
      <div class="space-y-4 p-5">
        <div>
          <Label class="mb-1.5" for="new-title">Title (Italian)</Label>
          <Input
            id="new-title"
            bind:value={title}
            required
            aria-invalid={fields['translations.it.title'] ? 'true' : undefined}
          />
          {#if fields['translations.it.title']}
            <p class="mt-1 text-xs text-destructive" role="alert">
              {fields['translations.it.title']}
            </p>
          {/if}
        </div>

        <div>
          <Label class="mb-1.5" for="new-slug">Slug (Italian)</Label>
          <Input
            id="new-slug"
            bind:value={slug}
            oninput={() => (slugTouched = true)}
            required
            class="font-mono"
            aria-invalid={fields['translations.it.slug'] ? 'true' : undefined}
          />
          {#if fields['translations.it.slug']}
            <p class="mt-1 text-xs text-destructive" role="alert">
              {fields['translations.it.slug']}
            </p>
          {/if}
        </div>

        <div>
          <Label class="mb-1.5" for="new-sku">Base SKU</Label>
          <Input id="new-sku" bind:value={baseSku} required class="font-mono uppercase" />
          <p class="mt-1 text-xs text-muted-foreground">
            Root of every generated SKU, e.g. <code class="font-mono">MIA-LTE</code>. Globally
            unique.
          </p>
          {#if fields.baseSku}
            <p class="mt-1 text-xs text-destructive" role="alert">{fields.baseSku}</p>
          {/if}
        </div>

        <div>
          <Label class="mb-1.5">Category</Label>
          <Select.Root type="single" bind:value={categoryId}>
            <Select.Trigger class="w-full">{categoryLabel}</Select.Trigger>
            <Select.Content>
              {#each categoryOptions as category (category.id)}
                <Select.Item value={category.id}>
                  {category.translations.it?.name ?? category.code}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if fields.categoryId}
            <p class="mt-1 text-xs text-destructive" role="alert">{fields.categoryId}</p>
          {/if}
        </div>
      </div>

      <!-- Visually set apart because it is the one irreversible choice here. -->
      <div class="space-y-4 border-y border-amber-500/30 bg-amber-500/5 p-5">
        <div class="flex items-start gap-2">
          <TriangleAlertIcon class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <Label class="text-sm font-medium">Pricing mode</Label>
            <p class="mt-0.5 text-xs text-muted-foreground">
              Permanent. A product is sold <em>or</em> rented, and this can never be changed after creation.
            </p>
          </div>
        </div>

        <RadioGroup.Root bind:value={pricingMode} class="flex gap-6">
          <div class="flex items-center gap-2">
            <RadioGroup.Item value="fixed" id="mode-fixed" />
            <Label for="mode-fixed" class="font-normal">Fixed price</Label>
          </div>
          <div class="flex items-center gap-2">
            <RadioGroup.Item value="rental" id="mode-rental" />
            <Label for="mode-rental" class="font-normal">Rental</Label>
          </div>
        </RadioGroup.Root>

        <div class="flex flex-wrap items-end gap-4">
          {#if pricingMode === 'rental'}
            <div>
              <Label class="mb-1.5">Billed per</Label>
              <Select.Root type="single" bind:value={rentalUnit}>
                <Select.Trigger class="w-32">
                  {rentalUnit === 'hour' ? 'Hour' : 'Day'}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="day">Day</Select.Item>
                  <Select.Item value="hour">Hour</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
          {/if}

          <MoneyInput
            label={pricingMode === 'rental' ? `Price per ${rentalUnit}` : 'Price'}
            bind:value={basePrice}
            error={fields.basePrice}
            suffix="EUR"
          />
        </div>
      </div>

      {#if error}
        <p class="bg-destructive/5 px-5 py-3 text-sm text-destructive" role="alert">{error}</p>
      {/if}

      <div class="flex items-center justify-between gap-3 bg-muted/40 px-5 py-3">
        <Button href={routes.products} variant="ghost">Cancel</Button>
        <Button type="submit" disabled={saving}>
          {#if saving}<Spinner />{/if}
          {saving ? 'Creating…' : 'Create product'}
        </Button>
      </div>
    </Card.Root>
  </form>
</section>
