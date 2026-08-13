<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import { toast } from 'svelte-sonner';

  import { goto } from '$app/navigation';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { api } from '~/lib/api';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { errorMessage } from '~/lib/request';
  import { routes } from '~/lib/routes';

  let title = $state('');
  let body = $state('');
  let busy = $state(false);

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100);
  }

  async function create() {
    if (!title.trim() || !body.trim()) return;
    busy = true;
    try {
      const res = await api.api.admin.blog.$post({
        json: {
          translations: {
            it: {
              title: title.trim(),
              slug: slugify(title.trim()),
              body: body.trim(),
            },
          },
        },
      });
      const json = (await res.json()) as { data: { id: string } };
      toast.success('Post created.');
      void goto(routes.blogDetail(json.data.id));
    } catch (err) {
      toast.error(errorMessage(err));
      busy = false;
    }
  }
</script>

<section class="admin-page">
  <PageHeader eyebrow="Blog" title="New Post" description="Start a new blog post.">
    {#snippet actions()}
      <Button href={routes.blog} variant="outline">
        <ArrowLeftIcon />
        Back to posts
      </Button>
    {/snippet}
  </PageHeader>

  <Card.Root class="mx-auto max-w-2xl">
    <Card.Header>
      <Card.Title>Create post</Card.Title>
      <Card.Description>Fill in at least the Italian title and body. You can add English, SEO, and images from the editor.</Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        class="space-y-4"
        onsubmit={(event) => {
          event.preventDefault();
          void create();
        }}
      >
        <div>
          <label class="mb-1.5 block text-sm font-medium" for="title">Title (IT)</label>
          <Input id="title" bind:value={title} placeholder="Titolo dell'articolo" required />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium" for="body">Body (IT)</label>
          <Textarea id="body" bind:value={body} rows={12} placeholder="Contenuto…" required />
        </div>
        <Button type="submit" class="w-full" disabled={busy || !title.trim() || !body.trim()}>
          {#if busy}<Spinner />{/if}
          Create post
        </Button>
      </form>
    </Card.Content>
  </Card.Root>
</section>
