<script lang="ts">
  import { api } from '~/lib/api';
  import MediaDropzone from '~/lib/components/MediaDropzone.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import type { AdminProduct, TabProps } from './shared';

  let { product, onSaved }: TabProps = $props();

  interface Item {
    path: string;
    mimeType: string;
    alt?: { it?: string | undefined; en?: string | undefined } | undefined;
  }

  const clone = (item: Item | null): Item[] => (item ? [{ ...item }] : []);

  let thumbnail = $state<Item[]>(clone(product.media.thumbnail));
  let cleanPng = $state<Item[]>(clone(product.media.cleanPng));
  let gallery = $state<Item[]>(product.media.gallery.map((item) => ({ ...item })));
  let videos = $state<Item[]>(product.media.videos.map((item) => ({ ...item })));
  let documents = $state<Item[]>(product.media.documents.map((item) => ({ ...item })));

  let saving = $state(false);
  let error = $state<string | null>(null);
  let savedFlash = $state(false);

  async function save() {
    saving = true;
    error = null;
    try {
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].$patch({
          param: { id: product.id },
          json: {
            media: {
              thumbnail: thumbnail[0] ?? null,
              cleanPng: cleanPng[0] ?? null,
              gallery,
              videos,
              documents,
            },
          },
        }),
      );
      onSaved(updated);
      // Staging paths were moved to their final keys on save — resync.
      thumbnail = clone(updated.media.thumbnail);
      cleanPng = clone(updated.media.cleanPng);
      gallery = updated.media.gallery.map((item) => ({ ...item }));
      videos = updated.media.videos.map((item) => ({ ...item }));
      documents = updated.media.documents.map((item) => ({ ...item }));
      savedFlash = true;
      setTimeout(() => (savedFlash = false), 2000);
    } catch (err) {
      error = errorMessage(err);
      const fields = errorFields(err);
      const first = Object.entries(fields)[0];
      if (first) error = `${error} (${first[0]}: ${first[1]})`;
    } finally {
      saving = false;
    }
  }
</script>

<div class="flex max-w-2xl flex-col gap-6">
  <p class="text-xs text-neutral-500">
    Images are converted to WebP on the server at high quality; SVG is stored as-is. Removed
    files are deleted from storage when you save. Video: mp4/webm, max 30 MB, never converted.
    Documents: PDF, max 15 MB — the alt text is the visible label of the file.
  </p>

  <MediaDropzone label="Thumbnail" bind:items={thumbnail} profile="product_image" single />
  <MediaDropzone
    label="Clean cutout (transparent background)"
    bind:items={cleanPng}
    profile="product_image"
    single
  />
  <MediaDropzone label="Gallery" bind:items={gallery} profile="product_image" />
  <MediaDropzone label="Videos" bind:items={videos} profile="video" accept="video/mp4,video/webm" />
  <MediaDropzone
    label="Documents (PDF)"
    bind:items={documents}
    profile="document"
    accept="application/pdf"
  />

  {#if error}
    <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
  {/if}

  <div class="flex items-center justify-end gap-3">
    {#if savedFlash}<span class="text-sm text-green-600">Saved ✓</span>{/if}
    <button
      type="button"
      onclick={() => void save()}
      disabled={saving}
      class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
    >
      {saving ? 'Saving…' : 'Save media'}
    </button>
  </div>
</div>
