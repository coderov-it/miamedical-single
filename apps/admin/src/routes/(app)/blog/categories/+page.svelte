<script lang="ts">
  import { P } from '@mia/permissions';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import TagsIcon from '@lucide/svelte/icons/tags';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { api } from '~/lib/api';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { errorMessage } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type CategoryList = InferResponseType<
    (typeof api.api.admin.blog)['categories']['$get'],
    200
  >['data'];

  const categories = new Resource(
    () => 'categories',
    async (_key, signal) => {
      const res = await api.api.admin.blog.categories.$get({}, { init: { signal } });
      const json = (await res.json()) as { data: CategoryList };
      return json.data;
    },
    { enabled: () => session.can(P.BLOG_CATEGORY_READ) },
  );

  const rows = $derived(categories.data ?? []);
  const canManage = $derived(session.can(P.BLOG_CATEGORY_MANAGE));

  let showForm = $state(false);
  let editId = $state<string | null>(null);
  let code = $state('');
  let nameIt = $state('');
  let nameEn = $state('');
  let slug = $state('');
  let position = $state(0);
  let busy = $state(false);

  function resetForm() {
    editId = null;
    code = '';
    nameIt = '';
    nameEn = '';
    slug = '';
    position = 0;
    showForm = false;
  }

  function startEdit(cat: CategoryList[number]) {
    editId = cat.id;
    code = cat.code;
    nameIt = (cat.name as { it: string; en?: string }).it;
    nameEn = (cat.name as { it: string; en?: string }).en ?? '';
    slug = cat.slug;
    position = cat.position;
    showForm = true;
  }

  async function saveCategory() {
    if (!code.trim() || !nameIt.trim() || !slug.trim()) return;
    busy = true;
    try {
      const payload = {
        code: code.trim(),
        name: { it: nameIt.trim(), ...(nameEn.trim() ? { en: nameEn.trim() } : {}) },
        slug: slug.trim(),
        position,
      };

      if (editId) {
        await api.api.admin.blog.categories[':id'].$patch({
          param: { id: editId },
          json: payload,
        });
        toast.success('Category updated.');
      } else {
        await api.api.admin.blog.categories.$post({ json: payload });
        toast.success('Category created.');
      }

      resetForm();
      categories.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      busy = false;
    }
  }

  async function deleteCategory(id: string) {
    busy = true;
    try {
      await api.api.admin.blog.categories[':id'].$delete({ param: { id } });
      toast.success('Category deleted.');
      categories.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      busy = false;
    }
  }
</script>

<section class="admin-page">
  <PageHeader
    eyebrow="Blog"
    title="Blog Categories"
    description="Organize blog posts by topic."
  >
    {#snippet actions()}
      <div class="flex items-center gap-2">
        <Button href={routes.blog} variant="outline">Back to posts</Button>
        {#if canManage}
          <Button onclick={() => { resetForm(); showForm = true; }}>
            <PlusIcon />
            New category
          </Button>
        {/if}
      </div>
    {/snippet}
  </PageHeader>

  {#if showForm}
    <Card.Root class="mx-auto max-w-lg">
      <Card.Header>
        <Card.Title>{editId ? 'Edit category' : 'New category'}</Card.Title>
      </Card.Header>
      <Card.Content>
        <form
          class="space-y-4"
          onsubmit={(event) => {
            event.preventDefault();
            void saveCategory();
          }}
        >
          <div>
            <label class="mb-1.5 block text-sm font-medium" for="cat-code">Code</label>
            <Input id="cat-code" bind:value={code} placeholder="e.g. news" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium" for="cat-name-it">Name (IT)</label>
            <Input id="cat-name-it" bind:value={nameIt} placeholder="Notizie" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium" for="cat-name-en">Name (EN)</label>
            <Input id="cat-name-en" bind:value={nameEn} placeholder="News (optional)" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium" for="cat-slug">Slug</label>
            <Input id="cat-slug" bind:value={slug} placeholder="news" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium" for="cat-pos">Position</label>
            <Input id="cat-pos" type="number" bind:value={position} />
          </div>
          <div class="flex gap-2">
            <Button type="submit" class="flex-1" disabled={busy || !code.trim() || !nameIt.trim() || !slug.trim()}>
              {#if busy}<Spinner />{/if}
              {editId ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onclick={resetForm}>Cancel</Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  {/if}

  <Card.Root class="gap-0 overflow-hidden py-0">
    <div class="border-b px-4 py-3">
      <p class="text-sm font-medium">{rows.length} {rows.length === 1 ? 'category' : 'categories'}</p>
    </div>

    {#if categories.loading && !categories.data}
      <div class="space-y-3 p-4">
        {#each { length: 4 } as _, row (row)}
          <Skeleton class="h-6 w-full" />
        {/each}
      </div>
    {:else if rows.length === 0}
      <Empty.Root class="border-0">
        <Empty.Header>
          <Empty.Media variant="icon"><TagsIcon /></Empty.Media>
          <Empty.Title>No categories yet</Empty.Title>
          <Empty.Description>Create categories to organize your blog posts.</Empty.Description>
        </Empty.Header>
      </Empty.Root>
    {:else}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Code</Table.Head>
            <Table.Head>Name</Table.Head>
            <Table.Head>Slug</Table.Head>
            <Table.Head class="text-right">Position</Table.Head>
            {#if canManage}
              <Table.Head class="w-24"></Table.Head>
            {/if}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as cat (cat.id)}
            <Table.Row>
              <Table.Cell class="font-mono text-sm">{cat.code}</Table.Cell>
              <Table.Cell>{(cat.name as { it: string }).it}</Table.Cell>
              <Table.Cell class="text-muted-foreground">{cat.slug}</Table.Cell>
              <Table.Cell class="text-right tabular-nums">{cat.position}</Table.Cell>
              {#if canManage}
                <Table.Cell class="text-right">
                  <div class="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onclick={() => startEdit(cat)}>Edit</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="text-destructive"
                      disabled={busy}
                      onclick={() => deleteCategory(cat.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Table.Cell>
              {/if}
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/if}
  </Card.Root>
</section>
