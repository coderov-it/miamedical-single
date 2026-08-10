<!--
  The product editor shell.

  Three things it does that the old page did not:

  1. The open tab lives in `?tab=`, so a refresh, a Back, and a link shared with
     a colleague all land on the same panel.
  2. Panels stay mounted. Switching tabs no longer discards what you typed —
     which was a real data-loss bug, not a papercut.
  3. Each tab reports its own dirty state, shown as a dot on the strip and
     guarded on the way *out of the page* by <UnsavedChangesGuard>.

  Saves stay per-tab. The API is per-tab too (`PATCH /products/:id`, then a PUT
  per collection), so one "Save everything" button would be several requests
  pretending to be one transaction — and a partial failure would leave the
  screen lying about what got through.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { toast } from 'svelte-sonner';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { env } from '$env/dynamic/public';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import ContentLangTabs from '~/lib/components/content-lang-tabs.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import UnsavedChangesGuard from '~/lib/components/unsaved-changes-guard.svelte';
  import { provideContentLang } from '~/lib/content-lang.svelte';
  import { DirtyState } from '~/lib/dirty.svelte';
  import { formatMoney, relativeTime } from '~/lib/format';
  import { errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';
  import { uiLang } from '~/lib/ui-lang.svelte';
  import AddonsTab from './AddonsTab.svelte';
  import BasicsTab from './BasicsTab.svelte';
  import DescriptionTab from './DescriptionTab.svelte';
  import FaqsTab from './FaqsTab.svelte';
  import MediaTab from './MediaTab.svelte';
  import PricingTab from './PricingTab.svelte';
  import QuestionsTab from './QuestionsTab.svelte';
  import type { AdminProduct } from './shared';
  import SkusTab from './SkusTab.svelte';
  import SpecsTab from './SpecsTab.svelte';
  import { PRODUCT_TABS, parseTab, tabLabel } from './tabs';
  import TermsTab from './TermsTab.svelte';
  import VariantsTab from './VariantsTab.svelte';

  const product = new Resource(
    () => page.params.id,
    async (id, signal) =>
      unwrap<AdminProduct>(
        await api.api.admin.products[':id'].$get({ param: { id: id! } }, { init: { signal } }),
      ),
    { enabled: () => session.can(P.PRODUCT_READ) },
  );

  const dirty = new DirtyState();

  // One editing language for the whole editor — every bilingual field on
  // every tab follows the IT/EN tabs on the strip below.
  const contentLang = provideContentLang();

  const activeTab = $derived(parseTab(page.url.searchParams.get('tab')));

  function openTab(key: string) {
    const params = new URLSearchParams(page.url.search);
    params.set('tab', key);
    // `replaceState` — ten tabs would otherwise bury the page you arrived from
    // under ten history entries on the way back out.
    void goto(`${page.url.pathname}?${params}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });
  }

  function onSaved(updated: AdminProduct) {
    product.set(updated);
  }

  let deleting = $state(false);
  let deleteBusy = $state(false);

  async function confirmDelete() {
    const current = product.data;
    if (!current) return;

    deleteBusy = true;
    try {
      await unwrap(await api.api.admin.products[':id'].$delete({ param: { id: current.id } }));
      // Clear first: the guard must not challenge a navigation away from a
      // product that no longer exists.
      dirty.clearAll();
      toast.success(`Deleted "${current.translations.it?.title ?? current.baseSku}".`);
      await goto(routes.products);
    } catch (err) {
      toast.error(errorMessage(err));
      deleteBusy = false;
    }
  }

  // Header title is *read* content — it follows the interface language.
  const title = $derived(
    (uiLang.current === 'en' ? product.data?.translations.en?.title : undefined) ||
      product.data?.translations.it?.title ||
      product.data?.baseSku ||
      'Product',
  );

  /** Only offered once the product is actually reachable on the storefront. */
  const storefrontUrl = $derived.by(() => {
    const base = env.PUBLIC_SITE_URL;
    const slug = product.data?.translations.it?.slug;
    if (!base || !slug || product.data?.status !== 'active') return null;
    return `${base.replace(/\/$/, '')}/prodotti/${slug}`;
  });
</script>

<UnsavedChangesGuard {dirty} label={tabLabel} />

<section class="admin-page">
  <PageHeader eyebrow="Catalog" title={product.data ? title : 'Product'}>
    {#snippet actions()}
      {#if storefrontUrl}
        <Button href={storefrontUrl} target="_blank" rel="noreferrer" variant="outline">
          <ExternalLinkIcon />
          View on site
        </Button>
      {/if}
      <Button href={routes.products} variant="outline">
        <ArrowLeftIcon />
        Products
      </Button>
      {#if session.can(P.PRODUCT_DELETE) && product.data}
        <Button variant="destructive" onclick={() => (deleting = true)}>
          <Trash2Icon />
          Delete
        </Button>
      {/if}
    {/snippet}
  </PageHeader>

  {#if product.error}
    <Empty.Root class="border bg-card">
      <Empty.Header>
        <Empty.Title>This product could not be loaded</Empty.Title>
        <Empty.Description>{product.error}</Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button variant="outline" onclick={() => product.refresh()}>Try again</Button>
      </Empty.Content>
    </Empty.Root>
  {:else if !product.data}
    <div class="space-y-4">
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-96 w-full" />
    </div>
  {:else}
    {@const current = product.data}
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <code class="font-mono text-muted-foreground">{current.baseSku}</code>
      <Badge variant={current.status === 'active' ? 'default' : 'secondary'}>
        {current.status}
      </Badge>
      <Badge variant="outline">
        {current.pricingMode === 'rental' ? `rental / ${current.rentalUnit}` : 'fixed price'}
      </Badge>
      <Badge variant="outline">
        {formatMoney(current.basePrice, current.currency)}
      </Badge>
      {#if current.translationStatus.en === 'complete'}
        <Badge variant="outline" class="border-emerald-500/40 text-emerald-600">EN complete</Badge>
      {:else if current.translationStatus.en === 'partial'}
        <Badge variant="outline" class="border-amber-500/40 text-amber-600">EN partial</Badge>
      {:else}
        <Badge variant="outline" class="border-amber-500/40 text-amber-600">EN missing</Badge>
      {/if}
      <span class="ml-auto text-muted-foreground">
        Updated {relativeTime(current.updatedAt)}
      </span>
    </div>

    <!--
      A plain button strip rather than the Tabs primitive: the panels below are
      all mounted at once, which is the opposite of what a tablist implies to
      a screen reader. `aria-current` describes what is actually true here.

      The IT/EN tabs at the right end are the editor-wide content language —
      pinned outside the scroll region so they never disappear behind ten
      section tabs on a narrow screen.
    -->
    <div class="flex items-stretch border-b">
      <div class="min-w-0 flex-1 overflow-x-auto">
        <div class="flex min-w-max gap-1">
          {#each PRODUCT_TABS as tab (tab.key)}
            {@const active = activeTab === tab.key}
            <button
              type="button"
              onclick={() => openTab(tab.key)}
              aria-current={active ? 'page' : undefined}
              class={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-primary font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              {#if dirty.has(tab.key)}
                <span
                  class="size-1.5 rounded-full bg-primary"
                  title="Unsaved changes in {tab.label}"
                ></span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
      <ContentLangTabs
        lang={contentLang}
        enMissing={current.translationStatus.en !== 'complete'}
        class="shrink-0 border-l pl-1"
      />
    </div>

    <!-- Every panel mounted; only the active one is shown. -->
    <div class="max-w-5xl">
      {#each PRODUCT_TABS as tab (tab.key)}
        <div hidden={activeTab !== tab.key}>
          {#if tab.key === 'basics'}
            <BasicsTab product={current} {onSaved} {dirty} />
          {:else if tab.key === 'description'}
            <DescriptionTab product={current} {onSaved} {dirty} />
          {:else if tab.key === 'pricing'}
            <PricingTab product={current} {onSaved} {dirty} />
          {:else if tab.key === 'variants'}
            <VariantsTab product={current} {onSaved} {dirty} />
          {:else if tab.key === 'skus'}
            <SkusTab product={current} {onSaved} {dirty} />
          {:else if tab.key === 'specs'}
            <SpecsTab product={current} {onSaved} {dirty} />
          {:else if tab.key === 'media'}
            <MediaTab product={current} {onSaved} {dirty} />
          {:else if tab.key === 'addons'}
            <AddonsTab product={current} {onSaved} {dirty} />
          {:else if tab.key === 'faqs'}
            <FaqsTab product={current} {onSaved} {dirty} />
          {:else if tab.key === 'questions'}
            <QuestionsTab product={current} {onSaved} {dirty} />
          {:else}
            <TermsTab product={current} {onSaved} {dirty} />
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</section>

<AlertDialog.Root
  open={deleting}
  onOpenChange={(open) => {
    if (!open) deleting = false;
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete this product?</AlertDialog.Title>
      <AlertDialog.Description>
        "{title}" and everything attached to it — SKUs, variants, specs, media — are removed. This
        cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={deleteBusy}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        disabled={deleteBusy}
        class={buttonVariants({ variant: 'destructive' })}
        onclick={(event) => {
          event.preventDefault();
          void confirmDelete();
        }}
      >
        {deleteBusy ? 'Deleting…' : 'Delete product'}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
