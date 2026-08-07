<script lang="ts">
  import { P } from '@mia/permissions';
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
    () => query.current,
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

  const statuses = [
    { value: ANY, label: 'All statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
  ];

  const statusLabel = $derived(
    statuses.find((s) => s.value === draft.values.status)?.label ?? 'All statuses',
  );
  const categoryLabel = $derived(
    draft.values.category === ANY
      ? 'All categories'
      : (categoryOptions.find((c) => c.code === draft.values.category)?.translations.it?.name ??
          draft.values.category),
  );

  const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    active: 'default',
    draft: 'secondary',
    archived: 'outline',
  };

  let deleting = $state<Product | null>(null);
  let deleteBusy = $state(false);

  async function confirmDelete() {
    const target = deleting;
    if (!target) return;

    deleteBusy = true;
    try {
      await unwrapFull(await api.api.admin.products[':id'].$delete({ param: { id: target.id } }));
      toast.success(`Deleted "${target.title || target.baseSku}".`);
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
    eyebrow="Catalog"
    title="Products"
    description="Everything in the catalog, in every state — draft, live and archived."
  >
    {#snippet actions()}
      {#if session.can(P.PRODUCT_CREATE)}
        <Button href={routes.productNew}>
          <PlusIcon />
          New product
        </Button>
      {/if}
    {/snippet}
  </PageHeader>

  <ListCard
    noun="product"
    meta={products.data?.meta}
    loading={products.loading}
    error={products.error}
    isEmpty={rows.length === 0}
    onPage={(page) => query.set({ page })}
    onRetry={() => products.refresh()}
    skeletonColumns={6}
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
            placeholder="Search title or SKU…"
            aria-label="Search products"
            class="h-8 w-56 pl-8"
          />
        </div>

        <Select.Root type="single" bind:value={draft.values.category}>
          <Select.Trigger class="w-44" aria-label="Filter by category">
            {categoryLabel}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ANY}>All categories</Select.Item>
            {#each categoryOptions as option (option.id)}
              <Select.Item value={option.code}>
                {option.translations.it?.name ?? option.code}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <Select.Root type="single" bind:value={draft.values.status}>
          <Select.Trigger class="w-36" aria-label="Filter by status">{statusLabel}</Select.Trigger>
          <Select.Content>
            {#each statuses as option (option.value)}
              <Select.Item value={option.value}>{option.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <Button type="submit" variant="secondary" size="sm">Apply</Button>
        {#if query.isFiltered}
          <Button type="button" variant="ghost" size="sm" onclick={() => draft.clear()}>
            Clear
          </Button>
        {/if}
      </form>
    {/snippet}

    {#snippet table()}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-[40%]">Product</Table.Head>
            <Table.Head>Category</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>English</Table.Head>
            <Table.Head>Updated</Table.Head>
            <Table.Head class="text-right">Price</Table.Head>
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
                      {product.title || product.baseSku}
                    </a>
                    <p class="truncate font-mono text-xs text-muted-foreground">
                      {product.baseSku}
                    </p>
                  </div>
                </div>
              </Table.Cell>

              <Table.Cell class="text-muted-foreground">{product.categoryName}</Table.Cell>

              <Table.Cell>
                <Badge variant={statusVariant[product.status] ?? 'outline'}>
                  {product.status}
                </Badge>
              </Table.Cell>

              <Table.Cell>
                {#if product.translationStatus.en === 'complete'}
                  <Badge variant="outline" class="border-emerald-500/40 text-emerald-600">
                    complete
                  </Badge>
                {:else if product.translationStatus.en === 'partial'}
                  <Badge variant="outline" class="border-amber-500/40 text-amber-600">
                    partial
                  </Badge>
                {:else}
                  <span class="text-muted-foreground">—</span>
                {/if}
              </Table.Cell>

              <Table.Cell class="text-muted-foreground">
                {relativeTime(product.updatedAt)}
              </Table.Cell>

              <Table.Cell class="text-right tabular-nums">
                {formatMoney(product.basePrice, product.currency)}
                {#if product.pricingMode === 'rental'}
                  <span class="text-muted-foreground">/{product.rentalUnit}</span>
                {/if}
              </Table.Cell>

              <Table.Cell>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                    aria-label="Row actions"
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">
                    <!-- A real anchor, so Edit can be middle-clicked like the title. -->
                    <DropdownMenu.Item>
                      {#snippet child({ props })}
                        <a href={routes.productDetail(product.id)} {...props}>
                          <PencilIcon />
                          Edit
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
                        Delete
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
            {query.isFiltered ? 'No products match these filters' : 'No products yet'}
          </Empty.Title>
          <Empty.Description>
            {query.isFiltered
              ? 'Try widening the search, or clear the filters to see everything.'
              : 'Add the first product to start building the catalog.'}
          </Empty.Description>
        </Empty.Header>
        <Empty.Content>
          {#if query.isFiltered}
            <Button variant="outline" onclick={() => draft.clear()}>Clear filters</Button>
          {:else if session.can(P.PRODUCT_CREATE)}
            <Button href={routes.productNew}>
              <PlusIcon />
              New product
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
      <AlertDialog.Title>Delete this product?</AlertDialog.Title>
      <AlertDialog.Description>
        "{deleting?.title || deleting?.baseSku}" and everything attached to it — SKUs, variants,
        specs, media — are removed. This cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={deleteBusy}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        disabled={deleteBusy}
        class={buttonVariants({ variant: 'destructive' })}
        onclick={(event) => {
          // Keep the dialog up while the request is in flight; it closes on success.
          event.preventDefault();
          void confirmDelete();
        }}
      >
        {deleteBusy ? 'Deleting…' : 'Delete product'}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
