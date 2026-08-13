<script lang="ts">
  import { P } from '@mia/permissions';
  import NewspaperIcon from '@lucide/svelte/icons/newspaper';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SearchIcon from '@lucide/svelte/icons/search';
  import type { InferResponseType } from 'hono/client';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import { BLOG_STATUS_ORDER, blogStatusMeta } from '~/lib/blog/status';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { formatDate, relativeTime } from '~/lib/format';
  import { QueryDraft, QueryState } from '~/lib/query-state.svelte';
  import { unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type ListResponse = InferResponseType<typeof api.api.admin.blog.$get, 200>;

  const ANY = '__any';

  const query = new QueryState({ q: '', status: ANY, page: 1 });
  const draft = new QueryDraft(query);

  const posts = new Resource(
    () => query.current,
    async (current, signal) =>
      unwrapFull<ListResponse>(
        await api.api.admin.blog.$get(
          {
            query: {
              page: String(current.page),
              ...(current.q ? { q: current.q } : {}),
              ...(current.status !== ANY ? { status: current.status } : {}),
            },
          },
          { init: { signal } },
        ),
      ),
    { enabled: () => session.can(P.BLOG_READ) },
  );

  const rows = $derived(posts.data?.data ?? []);

  function postTitle(post: (typeof rows)[number]): string {
    return post.translations?.it?.title ?? post.translations?.en?.title ?? '(no title)';
  }
</script>

<section class="admin-page">
  <PageHeader
    eyebrow="Content"
    title="Blog Posts"
    description="Manage blog content for the public website."
  >
    {#snippet actions()}
      {#if session.can(P.BLOG_CREATE)}
        <Button href={routes.blogNew}>
          <PlusIcon />
          New post
        </Button>
      {/if}
    {/snippet}
  </PageHeader>

  <div class="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
    {#each [ANY, ...BLOG_STATUS_ORDER] as value (value)}
      {@const active = query.current.status === value}
      <button
        type="button"
        onclick={() => query.set({ status: value })}
        aria-pressed={active}
        class={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
          active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
        )}
      >
        {#if value !== ANY}
          <span class={cn('size-1.5 rounded-full', blogStatusMeta(value).dot)}></span>
        {/if}
        {value === ANY ? 'All' : blogStatusMeta(value).label}
      </button>
    {/each}
  </div>

  <ListCard
    noun="post"
    meta={posts.data?.meta}
    loading={posts.loading}
    error={posts.error}
    isEmpty={rows.length === 0}
    onPage={(next) => query.set({ page: next })}
    onRetry={() => posts.refresh()}
    skeletonColumns={4}
  >
    {#snippet filters()}
      <form
        class="flex items-center gap-2"
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
            placeholder="Search by title…"
            aria-label="Search blog posts"
            class="h-8 w-64 pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">Apply</Button>
        {#if query.isFiltered}
          <Button type="button" variant="ghost" onclick={() => draft.clear()}>Clear</Button>
        {/if}
      </form>
    {/snippet}

    {#snippet table()}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Title</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Published</Table.Head>
            <Table.Head>Updated</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as post (post.id)}
            {@const meta = blogStatusMeta(post.status)}
            <Table.Row
              class="cursor-pointer"
              onclick={() => window.location.assign(routes.blogDetail(post.id))}
            >
              <Table.Cell>
                <p class="font-medium">{postTitle(post)}</p>
                {#if post.translations?.it?.slug}
                  <p class="text-xs text-muted-foreground">{post.translations.it.slug}</p>
                {/if}
              </Table.Cell>
              <Table.Cell>
                <Badge variant="outline" class={meta.tone}>
                  <span class={cn('size-1.5 rounded-full', meta.dot)}></span>
                  {meta.label}
                </Badge>
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">
                {#if post.publishedAt}
                  <span title={formatDate(post.publishedAt)}>
                    {relativeTime(post.publishedAt)}
                  </span>
                {:else}
                  —
                {/if}
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">
                <span title={formatDate(post.updatedAt)}>
                  {relativeTime(post.updatedAt)}
                </span>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/snippet}

    {#snippet empty()}
      <Empty.Root class="border-0">
        <Empty.Header>
          <Empty.Media variant="icon"><NewspaperIcon /></Empty.Media>
          <Empty.Title>
            {query.isFiltered ? 'No posts match these filters' : 'No blog posts yet'}
          </Empty.Title>
          <Empty.Description>
            {query.isFiltered
              ? 'Try a different status, or clear the filters.'
              : 'Create your first blog post to get started.'}
          </Empty.Description>
        </Empty.Header>
        {#if query.isFiltered}
          <Empty.Content>
            <Button variant="outline" onclick={() => query.reset()}>Clear filters</Button>
          </Empty.Content>
        {:else if session.can(P.BLOG_CREATE)}
          <Empty.Content>
            <Button href={routes.blogNew}>
              <PlusIcon />
              New post
            </Button>
          </Empty.Content>
        {/if}
      </Empty.Root>
    {/snippet}
  </ListCard>
</section>
