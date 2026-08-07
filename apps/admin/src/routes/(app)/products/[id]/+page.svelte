<script lang="ts">
  import { P } from '@mia/permissions';
  import { page } from '$app/state';

  import { api } from '~/lib/api';
  import PermissionGate from '~/lib/components/PermissionGate.svelte';
  import { editorLang } from '~/lib/editor-lang.svelte';
  import { errorMessage, unwrap } from '~/lib/request';
  import AddonsTab from './AddonsTab.svelte';
  import BasicsTab from './BasicsTab.svelte';
  import FaqsTab from './FaqsTab.svelte';
  import MediaTab from './MediaTab.svelte';
  import PricingTab from './PricingTab.svelte';
  import QuestionsTab from './QuestionsTab.svelte';
  import type { AdminProduct } from './shared';
  import SkusTab from './SkusTab.svelte';
  import SpecsTab from './SpecsTab.svelte';
  import TermsTab from './TermsTab.svelte';
  import VariantsTab from './VariantsTab.svelte';

  const productId = $derived(page.params.id ?? '');

  let product = $state<AdminProduct | null>(null);
  let error = $state<string | null>(null);

  const TABS = [
    ['basics', 'Basics'],
    ['pricing', 'Pricing'],
    ['variants', 'Variants'],
    ['skus', 'SKUs'],
    ['specs', 'Specs'],
    ['media', 'Media'],
    ['addons', 'Addons'],
    ['faqs', 'FAQs'],
    ['questions', 'Questions'],
    ['terms', 'Terms'],
  ] as const;
  let tab = $state<(typeof TABS)[number][0]>('basics');

  $effect(() => {
    const id = productId;
    if (!id) return;
    void api.api.admin.products[':id']
      .$get({ param: { id } })
      .then((response) => unwrap<AdminProduct>(response))
      .then((data) => (product = data))
      .catch((err) => (error = errorMessage(err)));
  });

  function onSaved(updated: AdminProduct) {
    product = updated;
  }

  const enBadge = $derived(product?.translationStatus.en ?? 'missing');
</script>

<PermissionGate permission={P.PRODUCT_READ}>
  {#if error}
    <p class="rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>
  {:else if !product}
    <p class="text-sm text-neutral-500">Loading…</p>
  {:else}
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <a href="/products" class="text-xs text-neutral-500 hover:underline">← Products</a>
        <h1 class="text-2xl font-semibold tracking-tight">
          {product.translations.it?.title ?? product.baseSku}
        </h1>
        <div class="mt-1 flex items-center gap-2 text-xs text-neutral-500">
          <span class="font-mono">{product.baseSku}</span>
          <span>·</span>
          <span>{product.status}</span>
          <span>·</span>
          <span>{product.pricingMode === 'rental' ? `rental / ${product.rentalUnit}` : 'fixed price'}</span>
          <span>·</span>
          <span
            class:text-green-600={enBadge === 'complete'}
            class:text-amber-600={enBadge === 'partial'}
          >
            English: {enBadge}
          </span>
        </div>
      </div>

      <!-- The persistent IT/EN switch — drives every Translated* field at once. -->
      <div class="flex items-center gap-1 rounded-lg border border-neutral-300 p-1 dark:border-neutral-700">
        {#each ['it', 'en'] as const as lang (lang)}
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-semibold uppercase transition"
            class:bg-brand-600={editorLang.current === lang}
            class:text-white={editorLang.current === lang}
            onclick={() => editorLang.set(lang)}
          >
            {lang === 'it' ? 'Italiano' : 'English'}
          </button>
        {/each}
      </div>
    </div>

    <nav class="mt-6 flex flex-wrap gap-1 border-b border-neutral-200 dark:border-neutral-800">
      {#each TABS as [key, title] (key)}
        <button
          type="button"
          class="border-b-2 px-3 py-2 text-sm transition"
          class:border-brand-600={tab === key}
          class:font-medium={tab === key}
          class:border-transparent={tab !== key}
          class:text-neutral-500={tab !== key}
          onclick={() => (tab = key)}
        >
          {title}
        </button>
      {/each}
    </nav>

    <div class="mt-6 max-w-4xl">
      {#if tab === 'basics'}
        <BasicsTab {product} {onSaved} />
      {:else if tab === 'pricing'}
        <PricingTab {product} {onSaved} />
      {:else if tab === 'variants'}
        <VariantsTab {product} {onSaved} />
      {:else if tab === 'skus'}
        <SkusTab {product} {onSaved} />
      {:else if tab === 'specs'}
        <SpecsTab {product} {onSaved} />
      {:else if tab === 'media'}
        <MediaTab {product} {onSaved} />
      {:else if tab === 'addons'}
        <AddonsTab {product} {onSaved} />
      {:else if tab === 'faqs'}
        <FaqsTab {product} {onSaved} />
      {:else if tab === 'questions'}
        <QuestionsTab {product} {onSaved} />
      {:else}
        <TermsTab {product} {onSaved} />
      {/if}
    </div>
  {/if}
</PermissionGate>
