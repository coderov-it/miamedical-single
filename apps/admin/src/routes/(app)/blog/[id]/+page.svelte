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
  import LanguageSwitcher from '~/lib/components/language-switcher.svelte';
  import TranslationGaps from '~/lib/components/translation-gaps.svelte';
  import { provideContentLang } from '~/lib/content-lang.svelte';
  import {
    buildTranslations,
    languageOf,
    localizedFrom,
    type LocalizedValue,
    progressAcross,
    setTextFor,
    SOURCE_LANGUAGE,
    textFor,
  } from '~/lib/i18n';

  type BlogPost = InferResponseType<(typeof api.api.admin.blog)[':id']['$get'], 200>['data'];

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
  /**
   * One `LocalizedValue` per field, not one `$state` per field PER LANGUAGE.
   *
   * The editor used to hold `title`/`titleEn`, `slug`/`slugEn` … and render a
   * duplicated `<Tabs.Content>` for each language — so a third language meant
   * six more variables and a third copy of every input. Now the switcher moves
   * `lang` and the same inputs read and write through `textFor`/`setTextFor`.
   */
  const contentLang = provideContentLang();
  const lang = $derived(contentLang.current);
  const isSource = $derived(lang === SOURCE_LANGUAGE);

  let title = $state<LocalizedValue>({ [SOURCE_LANGUAGE]: '' });
  let slug = $state<LocalizedValue>({ [SOURCE_LANGUAGE]: '' });
  let body = $state<LocalizedValue>({ [SOURCE_LANGUAGE]: '' });
  let excerpt = $state<LocalizedValue>({ [SOURCE_LANGUAGE]: '' });
  let metaTitle = $state<LocalizedValue>({ [SOURCE_LANGUAGE]: '' });
  let metaDescription = $state<LocalizedValue>({ [SOURCE_LANGUAGE]: '' });

  /** A post counts as translated once it has a title, slug and body. */
  const progress = $derived(progressAcross([title, slug, body]));

  let featuredImage = $state('');

  $effect(() => {
    const p = post.data;
    if (!p) return;
    title = localizedFrom(p.translations, (t) => t.title);
    slug = localizedFrom(p.translations, (t) => t.slug);
    body = localizedFrom(p.translations, (t) => t.body);
    excerpt = localizedFrom(p.translations, (t) => t.excerpt);
    metaTitle = localizedFrom(p.translations, (t) => t.metaTitle);
    metaDescription = localizedFrom(p.translations, (t) => t.metaDescription);
    featuredImage = p.featuredImage ?? '';
  });

  async function save() {
    const p = post.data;
    if (!p) return;
    busy = 'save';
    try {
      // A target language is sent only once it has title, slug and body — the
      // same rule the editor used to spell out for English alone.
      const translations = buildTranslations(
        (code) => {
          const optional = (value: LocalizedValue, key: string) => {
            const text = textFor(value, code).trim();
            return text ? { [key]: text } : {};
          };
          return {
            title: textFor(title, code).trim(),
            slug: textFor(slug, code).trim(),
            body: textFor(body, code),
            ...optional(excerpt, 'excerpt'),
            ...optional(metaTitle, 'metaTitle'),
            ...optional(metaDescription, 'metaDescription'),
          };
        },
        (row) => Boolean(row.title && row.slug && row.body.trim()),
      )!;

      const updated = await unwrap<BlogPost>(
        await api.api.admin.blog[':id'].$patch({
          param: { id: p.id },
          json: {
            translations,
            ...(featuredImage.trim()
              ? { featuredImage: featuredImage.trim() }
              : { featuredImage: null }),
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
          <!-- The source-language title is the one field the API requires. -->
          <Button
            onclick={save}
            disabled={busy !== null || !textFor(title, SOURCE_LANGUAGE).trim()}
          >
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
        <!-- One switcher, one set of inputs. See the note on the field state. -->
        <LanguageSwitcher lang={contentLang} {progress} class="mb-2" />

        <Card.Root>
          <Card.Content class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium" for="post-title">Title</label>
              <Input
                id="post-title"
                value={textFor(title, lang)}
                oninput={(event) => setTextFor(title, lang, event.currentTarget.value)}
                disabled={!canUpdate}
                placeholder={isSource ? '' : `${languageOf(lang).label} title (optional)`}
              />
              <TranslationGaps value={title} class="mt-1" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium" for="post-slug">Slug</label>
              <Input
                id="post-slug"
                value={textFor(slug, lang)}
                oninput={(event) => setTextFor(slug, lang, event.currentTarget.value)}
                disabled={!canUpdate}
                placeholder={isSource ? '' : `${lang}-slug`}
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium" for="post-body">Body</label>
              <Textarea
                id="post-body"
                value={textFor(body, lang)}
                oninput={(event) => setTextFor(body, lang, event.currentTarget.value)}
                rows={20}
                disabled={!canUpdate}
                placeholder={isSource ? '' : `${languageOf(lang).label} body (optional)`}
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium" for="post-excerpt">Excerpt</label>
              <Textarea
                id="post-excerpt"
                value={textFor(excerpt, lang)}
                oninput={(event) => setTextFor(excerpt, lang, event.currentTarget.value)}
                rows={3}
                disabled={!canUpdate}
                placeholder="Short summary for listing cards…"
              />
            </div>
          </Card.Content>
        </Card.Root>

        <!-- SEO -->
        <Card.Root class="gap-0 py-0">
          <div class="border-b px-4 py-2.5 text-sm font-medium">
            SEO ({lang.toUpperCase()})
          </div>
          <div class="space-y-4 p-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium" for="meta-title">Meta title</label>
              <Input
                id="meta-title"
                value={textFor(metaTitle, lang)}
                oninput={(event) => setTextFor(metaTitle, lang, event.currentTarget.value)}
                disabled={!canUpdate}
                placeholder="Custom page title for search engines"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium" for="meta-desc">
                Meta description
              </label>
              <Textarea
                id="meta-desc"
                value={textFor(metaDescription, lang)}
                oninput={(event) => setTextFor(metaDescription, lang, event.currentTarget.value)}
                rows={2}
                disabled={!canUpdate}
                placeholder="Short description for search results"
              />
            </div>
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
