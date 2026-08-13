<script lang="ts">
  import { P } from '@mia/permissions';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import SaveIcon from '@lucide/svelte/icons/save';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { page } from '$app/state';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import { blogStatusMeta } from '~/lib/blog/status';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { formatDateTime } from '~/lib/format';
  import { errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type BlogPost = InferResponseType<
    (typeof api.api.admin.blog)[':id']['$get'],
    200
  >['data'];

  const post = new Resource(
    () => page.params.id,
    async (id, signal) =>
      unwrap<BlogPost>(
        await api.api.admin.blog[':id'].$get({ param: { id: id! } }, { init: { signal } }),
      ),
    { enabled: () => session.can(P.BLOG_READ) },
  );

  const canUpdate = $derived(session.can(P.BLOG_UPDATE));
  const canPublish = $derived(session.can(P.BLOG_PUBLISH));

  let busy = $state<string | null>(null);
  let lang = $state<'it' | 'en'>('it');

  let title = $state('');
  let slug = $state('');
  let body = $state('');
  let excerpt = $state('');
  let metaTitle = $state('');
  let metaDescription = $state('');

  let titleEn = $state('');
  let slugEn = $state('');
  let bodyEn = $state('');
  let excerptEn = $state('');
  let metaTitleEn = $state('');
  let metaDescriptionEn = $state('');

  let featuredImage = $state('');

  $effect(() => {
    const p = post.data;
    if (!p) return;
    const it = p.translations?.it;
    if (it) {
      title = it.title;
      slug = it.slug;
      body = it.body;
      excerpt = it.excerpt ?? '';
      metaTitle = it.metaTitle ?? '';
      metaDescription = it.metaDescription ?? '';
    }
    const en = p.translations?.en;
    if (en) {
      titleEn = en.title;
      slugEn = en.slug;
      bodyEn = en.body;
      excerptEn = en.excerpt ?? '';
      metaTitleEn = en.metaTitle ?? '';
      metaDescriptionEn = en.metaDescription ?? '';
    }
    featuredImage = p.featuredImage ?? '';
  });

  async function save() {
    const p = post.data;
    if (!p) return;
    busy = 'save';
    try {
      const it = {
        title: title.trim(),
        slug: slug.trim(),
        body,
        ...(excerpt.trim() ? { excerpt: excerpt.trim() } : {}),
        ...(metaTitle.trim() ? { metaTitle: metaTitle.trim() } : {}),
        ...(metaDescription.trim() ? { metaDescription: metaDescription.trim() } : {}),
      };
      const hasEn = titleEn.trim() && slugEn.trim() && bodyEn.trim();
      const en = hasEn
        ? {
            title: titleEn.trim(),
            slug: slugEn.trim(),
            body: bodyEn,
            ...(excerptEn.trim() ? { excerpt: excerptEn.trim() } : {}),
            ...(metaTitleEn.trim() ? { metaTitle: metaTitleEn.trim() } : {}),
            ...(metaDescriptionEn.trim() ? { metaDescription: metaDescriptionEn.trim() } : {}),
          }
        : undefined;

      const updated = await unwrap<BlogPost>(
        await api.api.admin.blog[':id'].$patch({
          param: { id: p.id },
          json: {
            translations: { it, ...(en ? { en } : {}) },
            ...(featuredImage.trim() ? { featuredImage: featuredImage.trim() } : { featuredImage: null }),
          },
        }),
      );
      post.set(updated);
      toast.success('Post saved.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      busy = null;
    }
  }

  async function changeStatus(status: 'draft' | 'published' | 'archived') {
    const p = post.data;
    if (!p) return;
    busy = `status:${status}`;
    try {
      const updated = await unwrap<BlogPost>(
        await api.api.admin.blog[':id'].status.$post({
          param: { id: p.id },
          json: { status },
        }),
      );
      post.set(updated);
      toast.success(`Post ${blogStatusMeta(status).label.toLowerCase()}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      busy = null;
    }
  }
</script>

<section class="admin-page">
  <PageHeader
    eyebrow="Blog"
    title={post.data ? (post.data.translations?.it?.title ?? 'Post') : 'Post'}
    description={post.data ? `Last updated ${formatDateTime(post.data.updatedAt)}` : ''}
  >
    {#snippet actions()}
      <div class="flex items-center gap-2">
        <Button href={routes.blog} variant="outline">
          <ArrowLeftIcon />
          Back to posts
        </Button>
        {#if post.data && canUpdate}
          <Button onclick={save} disabled={busy !== null || !title.trim()}>
            {#if busy === 'save'}<Spinner />{:else}<SaveIcon class="size-4" />{/if}
            Save
          </Button>
        {/if}
      </div>
    {/snippet}
  </PageHeader>

  {#if post.error}
    <Empty.Root class="border bg-card">
      <Empty.Header>
        <Empty.Title>This post could not be loaded</Empty.Title>
        <Empty.Description>{post.error}</Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button variant="outline" onclick={() => post.refresh()}>Try again</Button>
      </Empty.Content>
    </Empty.Root>
  {:else if !post.data}
    <div class="space-y-4">
      <Skeleton class="h-20 w-full" />
      <Skeleton class="h-64 w-full" />
    </div>
  {:else}
    {@const p = post.data}
    {@const meta = blogStatusMeta(p.status)}

    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="outline" class={meta.tone}>
        <span class={cn('size-1.5 rounded-full', meta.dot)}></span>
        {meta.label}
      </Badge>
      {#if p.publishedAt}
        <span class="text-sm text-muted-foreground">Published {formatDateTime(p.publishedAt)}</span>
      {/if}
    </div>

    <div class="@container grid gap-5 @4xl:grid-cols-3">
      <div class="space-y-5 @4xl:col-span-2">
        <!-- Language tabs -->
        <Tabs.Root bind:value={lang}>
          <Tabs.List>
            <Tabs.Trigger value="it">Italiano</Tabs.Trigger>
            <Tabs.Trigger value="en">English</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="it">
            <Card.Root>
              <Card.Content class="space-y-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium" for="title-it">Title</label>
                  <Input id="title-it" bind:value={title} disabled={!canUpdate} />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium" for="slug-it">Slug</label>
                  <Input id="slug-it" bind:value={slug} disabled={!canUpdate} />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium" for="body-it">Body</label>
                  <Textarea id="body-it" bind:value={body} rows={20} disabled={!canUpdate} />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium" for="excerpt-it">Excerpt</label>
                  <Textarea id="excerpt-it" bind:value={excerpt} rows={3} disabled={!canUpdate} placeholder="Short summary for listing cards…" />
                </div>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>

          <Tabs.Content value="en">
            <Card.Root>
              <Card.Content class="space-y-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium" for="title-en">Title</label>
                  <Input id="title-en" bind:value={titleEn} disabled={!canUpdate} placeholder="English title (optional)" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium" for="slug-en">Slug</label>
                  <Input id="slug-en" bind:value={slugEn} disabled={!canUpdate} placeholder="english-slug" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium" for="body-en">Body</label>
                  <Textarea id="body-en" bind:value={bodyEn} rows={20} disabled={!canUpdate} placeholder="English body (optional)" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium" for="excerpt-en">Excerpt</label>
                  <Textarea id="excerpt-en" bind:value={excerptEn} rows={3} disabled={!canUpdate} placeholder="English excerpt…" />
                </div>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>
        </Tabs.Root>

        <!-- SEO -->
        <Card.Root class="gap-0 py-0">
          <div class="border-b px-4 py-2.5 text-sm font-medium">SEO ({lang === 'it' ? 'IT' : 'EN'})</div>
          <div class="space-y-4 p-4">
            {#if lang === 'it'}
              <div>
                <label class="mb-1.5 block text-sm font-medium" for="meta-title-it">Meta title</label>
                <Input id="meta-title-it" bind:value={metaTitle} disabled={!canUpdate} placeholder="Custom page title for search engines" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium" for="meta-desc-it">Meta description</label>
                <Textarea id="meta-desc-it" bind:value={metaDescription} rows={2} disabled={!canUpdate} placeholder="Short description for search results" />
              </div>
            {:else}
              <div>
                <label class="mb-1.5 block text-sm font-medium" for="meta-title-en">Meta title</label>
                <Input id="meta-title-en" bind:value={metaTitleEn} disabled={!canUpdate} placeholder="English meta title" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium" for="meta-desc-en">Meta description</label>
                <Textarea id="meta-desc-en" bind:value={metaDescriptionEn} rows={2} disabled={!canUpdate} placeholder="English meta description" />
              </div>
            {/if}
          </div>
        </Card.Root>
      </div>

      <div class="space-y-5">
        <!-- Status actions -->
        <Card.Root class="gap-0 py-0">
          <div class="border-b px-4 py-2.5 text-sm font-medium">Status</div>
          <div class="space-y-2 p-4">
            {#if p.status === 'draft' && canPublish}
              <Button
                variant="default"
                size="sm"
                class="w-full"
                disabled={busy !== null}
                onclick={() => changeStatus('published')}
              >
                {#if busy === 'status:published'}<Spinner />{/if}
                Publish
              </Button>
            {/if}
            {#if p.status === 'published' && canPublish}
              <Button
                variant="outline"
                size="sm"
                class="w-full"
                disabled={busy !== null}
                onclick={() => changeStatus('archived')}
              >
                {#if busy === 'status:archived'}<Spinner />{/if}
                Archive
              </Button>
            {/if}
            {#if p.status === 'archived' && canPublish}
              <Button
                variant="outline"
                size="sm"
                class="w-full"
                disabled={busy !== null}
                onclick={() => changeStatus('draft')}
              >
                {#if busy === 'status:draft'}<Spinner />{/if}
                Return to draft
              </Button>
            {/if}
          </div>
        </Card.Root>

        <!-- Featured image -->
        <Card.Root class="gap-0 py-0">
          <div class="border-b px-4 py-2.5 text-sm font-medium">Featured Image</div>
          <div class="p-4">
            <Input
              bind:value={featuredImage}
              disabled={!canUpdate}
              placeholder="R2 storage key or URL"
            />
            <p class="mt-1.5 text-xs text-muted-foreground">
              Enter the media storage key from the media library.
            </p>
          </div>
        </Card.Root>

        <!-- Info -->
        <Card.Root class="gap-0 py-0">
          <div class="border-b px-4 py-2.5 text-sm font-medium">Info</div>
          <div class="space-y-2 p-4 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Created</span>
              <span>{formatDateTime(p.createdAt)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Updated</span>
              <span>{formatDateTime(p.updatedAt)}</span>
            </div>
            {#if p.publishedAt}
              <div class="flex justify-between">
                <span class="text-muted-foreground">Published</span>
                <span>{formatDateTime(p.publishedAt)}</span>
              </div>
            {/if}
          </div>
        </Card.Root>
      </div>
    </div>
  {/if}
</section>
