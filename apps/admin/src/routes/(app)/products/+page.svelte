<script lang="ts">
  import { P } from '@mia/permissions';
  import { optionsOf, PRODUCT_STATUS, productStatusLabel, unitLabel } from '@mia/i18n';
  import ImageIcon from '@lucide/svelte/icons/image';
  import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
  import PackageIcon from '@lucide/svelte/icons/package';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SearchIcon from '@lucide/svelte/icons/search';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { api, mediaUrl } from '~/lib/api';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { formatMoney, relativeTime } from '~/lib/format';
  import { QueryDraft, QueryState } from '~/lib/query-state.svelte';
  import { errorMessage, unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';
  import { uiLang } from '~/lib/ui-lang.svelte';
  import { t } from '~/lib/ui-text';
  import TranslationProgress from '~/lib/components/translation-progress.svelte';
  import { progressFromStates } from '~/lib/i18n';
  import BusyLabel from '~/lib/components/busy-label.svelte';
  import ProductStatusControl from '~/lib/components/product-status-control.svelte';

  type ListResponse = InferResponseType<typeof api.api.admin.products.$get, 200>;
  type Product = ListResponse['data'][number];
  type Category = InferResponseType<typeof api.api.admin.categories.$get, 200>['data'][number];

  const ANY = '__any';

  // Filters live in the URL, so a filtered list is shareable and survives a
  // refresh. `__any` rather than '' because bits-ui treats an empty string as
  // "no selection" and would render the placeholder instead of "All statuses".
  const query = new QueryState({ q: '', status: ANY, category: ANY, page: 1 });
  const draft = new QueryDraft(query);

  const products = new Resource(
    // The interface language is part of the key: the api client sends it as
    // `?locale`, the server resolves titles and search with it — so switching
    // language has to refetch, not just re-render.
    () => ({ ...query.current, locale: uiLang.current }),
    async (current, signal) =>
      unwrapFull<ListResponse>(
        await api.api.admin.products.$get(
          {
            query: {
              page: String(current.page),
              ...(current.q ? { q: current.q } : {}),
              ...(current.status !== ANY ? { status: current.status } : {}),
              ...(current.category !== ANY ? { category: current.category } : {}),
            },
          },
          { init: { signal } },
        ),
      ),
    { enabled: () => session.can(P.PRODUCT_READ) },
  );

  const categories = new Resource(
    () => null,
    async (_key, signal) =>
      unwrapFull<{ data: Category[] }>(
        await api.api.admin.categories.$get(undefined, { init: { signal } }),
      ),
    { enabled: () => session.can(P.CATEGORY_READ) },
  );

  const rows = $derived(products.data?.data ?? []);
  const categoryOptions = $derived(categories.data?.data ?? []);

  const statuses = $derived([
    { value: ANY, label: t('products.allStatuses') },
    ...optionsOf(PRODUCT_STATUS, uiLang.current),
  ]);

  const statusLabel = $derived(
    statuses.find((s) => s.value === draft.values.status)?.label ?? t('products.allStatuses'),
  );
  // Category names in the filter follow the interface language too.
  const categoryName = (category: Category) =>
    category.translations[uiLang.current]?.name ?? category.translations.it?.name ?? category.code;

  const categoryLabel = $derived(
    draft.values.category === ANY
      ? t('products.allCategories')
      : (() => {
          const match = categoryOptions.find((c) => c.code === draft.values.category);
          return match ? categoryName(match) : draft.values.category;
        })(),
  );

  const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    active: 'default',
    draft: 'secondary',
    archived: 'outline',
  };

  // A saved status shows at once, without refetching the whole page of rows.
  let savedStatus = $state<Record<string, string>>({});

  let deleting = $state<Product | null>(null);
  let deleteBusy = $state(false);

  async function confirmDelete() {
    const target = deleting;
    if (!target) return;

    deleteBusy = true;
    try {
      await unwrapFull(await api.api.admin.products[':id'].$delete({ param: { id: target.id } }));
      toast.success(t('products.deleted', { title: target.title || t('entities.productNoun') }));
      deleting = null;
      products.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      deleteBusy = false;
    }
  }
</script>

<section class="admin-page">
  <PageHeader
    eyebrow={t('nav.catalog')}
    title={t('nav.products')}
    description={t('products.listDescription')}
  >
    {#snippet actions()}
      {#if session.can(P.PRODUCT_CREATE)}
        <Button href={routes.productNew}>
          <PlusIcon />
          {t('products.newProduct')}
        </Button>
      {/if}
    {/snippet}
  </PageHeader>

  <ListCard
    countKey="entities.product"
    meta={products.data?.meta}
    loading={products.loading}
    error={products.error}
    isEmpty={rows.length === 0}
    onPage={(page) => query.set({ page })}
    onRetry={() => products.refresh()}
    skeletonColumns={7}
  >
    {#snippet filters()}
      <!--
        Applied on submit, not on every keystroke: a request per character
        rewrites history under the Back button and makes the table twitch.
      -->
      <form
        class="flex flex-wrap items-center gap-2"
        onsubmit={(event) => {
          event.preventDefault();
          draft.apply();
        }}
      >
        <div class="relative">
          <SearchIcon
            class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            bind:value={draft.values.q}
            placeholder={t('products.searchPlaceholder')}
            aria-label={t('products.searchAria')}
            class="h-8 w-56 pl-8"
          />
        </div>

        <Select.Root type="single" bind:value={draft.values.category}>
          <Select.Trigger class="w-44" aria-label={t('products.filterCategoryAria')}>
            {categoryLabel}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ANY}>{t('products.allCategories')}</Select.Item>
            {#each categoryOptions as option (option.id)}
              <Select.Item value={option.code}>
                {categoryName(option)}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <Select.Root type="single" bind:value={draft.values.status}>
          <Select.Trigger class="w-36" aria-label={t('products.filterStatusAria')}
            >{statusLabel}</Select.Trigger
          >
          <Select.Content>
            {#each statuses as option (option.value)}
              <Select.Item value={option.value}>{option.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <Button type="submit" variant="secondary">{t('products.filterApply')}</Button>
        {#if query.isFiltered}
          <Button type="button" variant="ghost" onclick={() => draft.clear()}
            >{t('products.filterClear')}</Button
          >
        {/if}
      </form>
    {/snippet}

    {#snippet table()}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-[40%]">{t('products.colProduct')}</Table.Head>
            <Table.Head>{t('products.colCategory')}</Table.Head>
            <Table.Head>{t('products.colStatus')}</Table.Head>
            <Table.Head>{t('products.colTranslations')}</Table.Head>
            <Table.Head>{t('products.colUpdated')}</Table.Head>
            <Table.Head class="text-right">{t('products.colStock')}</Table.Head>
            <Table.Head class="text-right">{t('products.colPrice')}</Table.Head>
            <Table.Head class="w-10"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as product (product.id)}
            <Table.Row>
              <Table.Cell>
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted"
                  >
                    {#if product.thumbnail}
                      <img
                        src={mediaUrl(product.thumbnail)}
                        alt=""
                        class="size-full object-cover"
                        loading="lazy"
                      />
                    {:else}
                      <ImageIcon class="size-4 text-muted-foreground" />
                    {/if}
                  </div>
                  <div class="min-w-0">
                    <a
                      href={routes.productDetail(product.id)}
                      class="block truncate font-medium hover:underline"
                    >
                      {product.title || t('products.untitled')}
                    </a>
                    <p class="truncate text-xs text-muted-foreground">
                      {product.categoryName}
                    </p>
                  </div>
                </div>
              </Table.Cell>

              <Table.Cell class="text-muted-foreground">{product.categoryName}</Table.Cell>

              <Table.Cell>
                {#if session.can(P.PRODUCT_UPDATE)}
                  <ProductStatusControl
                    productId={product.id}
                    status={savedStatus[product.id] ?? product.status}
                    mode="select"
                    onChanged={(_, next) => (savedStatus[product.id] = next)}
                  />
                {:else}
                  <Badge variant={statusVariant[product.status] ?? 'outline'}>
                    {productStatusLabel(product.status, uiLang.current)}
                  </Badge>
                {/if}
              </Table.Cell>

              <Table.Cell>
                <TranslationProgress
                  progress={progressFromStates(product.translationStatus.languages)}
                />
              </Table.Cell>

              <Table.Cell class="text-muted-foreground">
                {relativeTime(product.updatedAt)}
              </Table.Cell>

              <!--
                Zero reads as a warning rather than a number: the storefront
                renders such a product dead and refuses to take an order for it,
                which is worth spotting from the list.
              -->
              <Table.Cell class="text-right tabular-nums">
                {#if product.stock > 0}
                  {product.stock}
                {:else}
                  <span class="text-amber-600 dark:text-amber-400">0</span>
                {/if}
              </Table.Cell>

              <!--
                A rental has no price of its own — its packages are the price —
                so the column shows the marketing rate it advertises, and a dash
                when it advertises none. The packages themselves live on the
                pricing tab; a list column cannot say fifteen figures.
              -->
              <Table.Cell class="text-right tabular-nums">
                {#if product.pricingMode === 'rental'}
                  {#if product.marketingRate}
                    {formatMoney(product.marketingRate, product.currency)}
                    <span class="text-muted-foreground"
                      >/{unitLabel(product.rentalUnit ?? 'day', uiLang.current)}</span
                    >
                  {:else}
                    <span class="text-muted-foreground">—</span>
                  {/if}
                {:else}
                  {formatMoney(product.basePrice ?? '0.00', product.currency)}
                {/if}
              </Table.Cell>

              <Table.Cell>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                    aria-label={t('products.rowActions')}
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">
                    <!-- A real anchor, so Edit can be middle-clicked like the title. -->
                    <DropdownMenu.Item>
                      {#snippet child({ props })}
                        <a href={routes.productDetail(product.id)} {...props}>
                          <PencilIcon />
                          {t('common.edit')}
                        </a>
                      {/snippet}
                    </DropdownMenu.Item>
                    {#if session.can(P.PRODUCT_DELETE)}
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        variant="destructive"
                        onSelect={() => (deleting = product)}
                      >
                        <Trash2Icon />
                        {t('common.delete')}
                      </DropdownMenu.Item>
                    {/if}
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/snippet}

    {#snippet empty()}
      <Empty.Root class="border-0">
        <Empty.Header>
          <Empty.Media variant="icon"><PackageIcon /></Empty.Media>
          <Empty.Title>
            {query.isFiltered ? t('products.emptyFilteredTitle') : t('products.emptyTitle')}
          </Empty.Title>
          <Empty.Description>
            {query.isFiltered ? t('products.emptyFilteredHint') : t('products.emptyHint')}
          </Empty.Description>
        </Empty.Header>
        <Empty.Content>
          {#if query.isFiltered}
            <Button variant="outline" onclick={() => draft.clear()}
              >{t('products.clearFilters')}</Button
            >
          {:else if session.can(P.PRODUCT_CREATE)}
            <Button href={routes.productNew}>
              <PlusIcon />
              {t('products.newProduct')}
            </Button>
          {/if}
        </Empty.Content>
      </Empty.Root>
    {/snippet}
  </ListCard>
</section>

<AlertDialog.Root
  open={deleting !== null}
  onOpenChange={(open) => {
    if (!open) deleting = null;
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{t('products.deleteTitle')}</AlertDialog.Title>
      <AlertDialog.Description>
        {t('products.deleteDescription', { title: deleting?.title ?? '' })}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={deleteBusy}>{t('common.cancel')}</AlertDialog.Cancel>
      <AlertDialog.Action
        disabled={deleteBusy}
        class={buttonVariants({ variant: 'destructive' })}
        onclick={(event) => {
          // Keep the dialog up while the request is in flight; it closes on success.
          event.preventDefault();
          void confirmDelete();
        }}
      >
        <BusyLabel busy={deleteBusy} label={t('products.deleting')}
          >{t('products.deleteAction')}</BusyLabel
        >
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
