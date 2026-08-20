<script lang="ts">
  import { P } from '@mia/permissions';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import ImageIcon from '@lucide/svelte/icons/image';
  import LayersIcon from '@lucide/svelte/icons/layers';
  import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { api, mediaUrl } from '~/lib/api';
  import CategorySheet from '~/lib/categories/category-sheet.svelte';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { orDash, pluralize } from '~/lib/format';
  import { errorMessage, unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import { uiLang } from '~/lib/ui-lang.svelte';

  type ListResponse = InferResponseType<typeof api.api.admin.categories.$get, 200>;
  type Category = ListResponse['data'][number];

  const categories = new Resource(
    () => null,
    async (_key, signal) =>
      unwrapFull<ListResponse>(
        await api.api.admin.categories.$get(undefined, { init: { signal } }),
      ),
    { enabled: () => session.can(P.CATEGORY_READ) },
  );

  const rows = $derived(categories.data?.data ?? []);

  /**
   * The open editor lives in the URL — `?edit=new` or `?edit=<id>` — so an
   * editor can be linked to a colleague, and so the old `/categories/:id`
   * route can redirect here instead of dying.
   *
   * Resolves to CategorySheet's three-valued prop: undefined closed, null
   * create, a category to edit. While the list is still loading an id stays
   * `undefined`, so the sheet opens once its subject actually exists.
   */
  const editParam = $derived(page.url.searchParams.get('edit'));
  const editing = $derived<Category | null | undefined>(
    editParam === null
      ? undefined
      : editParam === 'new'
        ? null
        : rows.find((row) => row.id === editParam),
  );

  function openEditor(value: string) {
    const params = new URLSearchParams(page.url.search);
    params.set('edit', value);
    void goto(`${page.url.pathname}?${params}`, { noScroll: true, keepFocus: true });
  }

  function closeEditor() {
    const params = new URLSearchParams(page.url.search);
    params.delete('edit');
    const search = params.toString();
    void goto(`${page.url.pathname}${search ? `?${search}` : ''}`, {
      noScroll: true,
      keepFocus: true,
    });
  }

  let deleting = $state<Category | null>(null);
  let deleteBusy = $state(false);

  // List display follows the interface language, not any editing state.
  const nameOf = (category: Category) =>
    (uiLang.current === 'en' ? category.translations.en?.name : undefined) ??
    category.translations.it?.name ??
    category.code;

  async function confirmDelete() {
    const target = deleting;
    if (!target) return;

    deleteBusy = true;
    try {
      await unwrapFull(await api.api.admin.categories[':id'].$delete({ param: { id: target.id } }));
      toast.success(`Deleted "${nameOf(target)}".`);
      deleting = null;
      categories.refresh();
    } catch (err) {
      // The server refuses to delete a category that still has products, and
      // says so — pass that through instead of a generic failure.
      toast.error(errorMessage(err));
    } finally {
      deleteBusy = false;
    }
  }
</script>

<section class="admin-page">
  <PageHeader
    eyebrow="Catalog"
    title="Categories"
    description="Each category defines the spec fields its products are filtered and compared by."
  >
    {#snippet actions()}
      {#if session.can(P.CATEGORY_CREATE)}
        <Button onclick={() => openEditor('new')}>
          <PlusIcon />
          New category
        </Button>
      {/if}
    {/snippet}
  </PageHeader>

  <ListCard
    noun="category"
    nounPlural="categories"
    meta={categories.data
      ? { page: 1, perPage: rows.length || 1, total: rows.length, pageCount: 1 }
      : undefined}
    loading={categories.loading}
    error={categories.error}
    isEmpty={rows.length === 0}
    onPage={() => {}}
    onRetry={() => categories.refresh()}
    skeletonColumns={4}
  >
    {#snippet table()}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-[40%]">Category</Table.Head>
            <Table.Head>Code</Table.Head>
            <Table.Head>Spec fields</Table.Head>
            <Table.Head>English</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head class="w-10"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as category (category.id)}
            {@const filterable = category.specs.filter((spec) => spec.isFilterable).length}
            <Table.Row>
              <Table.Cell>
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted"
                  >
                    {#if category.icon}
                      <img src={mediaUrl(category.icon)} alt="" class="size-full object-cover" />
                    {:else}
                      <ImageIcon class="size-4 text-muted-foreground" />
                    {/if}
                  </div>
                  <div class="min-w-0">
                    <button
                      type="button"
                      class="block truncate text-left font-medium hover:underline"
                      onclick={() => openEditor(category.id)}
                    >
                      {nameOf(category)}
                    </button>
                    <p class="truncate text-xs text-muted-foreground">
                      {orDash(category.translations.it?.slug)}
                    </p>
                  </div>
                </div>
              </Table.Cell>

              <Table.Cell><code class="font-mono text-xs">{category.code}</code></Table.Cell>

              <Table.Cell class="text-muted-foreground">
                {pluralize(category.specs.length, 'field')}
                {#if filterable > 0}
                  <span class="text-xs">· {filterable} filterable</span>
                {/if}
              </Table.Cell>

              <Table.Cell>
                {#if category.translations.en?.name}
                  <Badge
                    variant="outline"
                    class="border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  >
                    complete
                  </Badge>
                {:else}
                  <Badge
                    variant="outline"
                    class="border-amber-500/40 text-amber-600 dark:text-amber-400"
                  >
                    missing
                  </Badge>
                {/if}
              </Table.Cell>

              <Table.Cell>
                <Badge variant={category.isActive ? 'default' : 'outline'}>
                  {category.isActive ? 'active' : 'hidden'}
                </Badge>
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
                    <DropdownMenu.Item onSelect={() => openEditor(category.id)}>
                      <PencilIcon />
                      Edit
                    </DropdownMenu.Item>
                    {#if session.can(P.CATEGORY_DELETE)}
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        variant="destructive"
                        onSelect={() => (deleting = category)}
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
          <Empty.Media variant="icon"><LayersIcon /></Empty.Media>
          <Empty.Title>No categories yet</Empty.Title>
          <Empty.Description>
            A product needs a category, and a category's specs are what make the storefront
            filterable. Start here.
          </Empty.Description>
        </Empty.Header>
        {#if session.can(P.CATEGORY_CREATE)}
          <Empty.Content>
            <Button onclick={() => openEditor('new')}>
              <PlusIcon />
              New category
            </Button>
          </Empty.Content>
        {/if}
      </Empty.Root>
    {/snippet}
  </ListCard>
</section>

<CategorySheet open={editing} onClose={closeEditor} onSaved={() => categories.refresh()} />

<AlertDialog.Root
  open={deleting !== null}
  onOpenChange={(open) => {
    if (!open) deleting = null;
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete this category?</AlertDialog.Title>
      <AlertDialog.Description>
        "{deleting ? nameOf(deleting) : ''}" and its {pluralize(
          deleting?.specs.length ?? 0,
          'spec field',
        )} are removed. Categories that still have products cannot be deleted.
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
        {deleteBusy ? 'Deleting…' : 'Delete category'}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
