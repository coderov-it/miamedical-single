<script lang="ts">
  import { P } from '@mia/permissions';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { api } from '~/lib/api';
  import MediaDropzone, { type MediaItem } from '~/lib/components/media-dropzone.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import type { AdminProduct, TabProps } from './shared';
  import { sameAsSaved } from './shared';
  import TabPanel from './tab-panel.svelte';

  let { product, onSaved, dirty }: TabProps = $props();

  const SECTION = 'media';

  const one = (item: MediaItem | null): MediaItem[] => (item ? [{ ...item }] : []);

  const snapshot = (source: AdminProduct) => ({
    thumbnail: one(source.media.thumbnail),
    cleanPng: one(source.media.cleanPng),
    gallery: source.media.gallery.map((item) => ({ ...item })),
    videos: source.media.videos.map((item) => ({ ...item })),
    documents: source.media.documents.map((item) => ({ ...item })),
  });

  let form = $state(untrack(() => snapshot(product)));
  let saved = $state(untrack(() => snapshot(product)));

  let seededFor = $state(untrack(() => product.id));
  $effect(() => {
    if (product.id === seededFor) return;
    seededFor = product.id;
    form = snapshot(product);
    saved = snapshot(product);
  });

  const isDirty = $derived(!sameAsSaved(form, saved));
  $effect(() => dirty.set(SECTION, isDirty));

  const canUpdate = $derived(session.can(P.PRODUCT_UPDATE));

  let saving = $state(false);
  let error = $state<string | null>(null);

  async function save() {
    saving = true;
    error = null;

    try {
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].$patch({
          param: { id: product.id },
          json: {
            media: {
              thumbnail: form.thumbnail[0] ?? null,
              cleanPng: form.cleanPng[0] ?? null,
              gallery: form.gallery,
              videos: form.videos,
              documents: form.documents,
            },
          },
        }),
      );
      // Staging paths were moved to their final keys on save — resync from the
      // server's answer rather than keeping the paths we uploaded to.
      form = snapshot(updated);
      saved = snapshot(updated);
      dirty.clear(SECTION);
      onSaved(updated);
      toast.success('Media saved.');
    } catch (err) {
      error = errorMessage(err);
      // Media errors are per-slot; naming the slot is the difference between
      // an actionable message and "something in here is wrong".
      const first = Object.entries(errorFields(err))[0];
      if (first) error = `${error} (${first[0]}: ${first[1]})`;
    } finally {
      saving = false;
    }
  }
</script>

<TabPanel
  title="Media"
  description="Images become WebP on the server at high quality; SVG is stored as-is. Removed files are cleaned up when you save."
  dirty={isDirty}
  {saving}
  {error}
  onSave={save}
  saveLabel="Save media"
  disabledReason={canUpdate ? undefined : 'You need product:update to change this.'}
>
  <div class="max-w-3xl space-y-6">
    <MediaDropzone
      label="Thumbnail"
      bind:items={form.thumbnail}
      profile="product_image"
      single
      hint="The one image used in listings and search"
    />
    <MediaDropzone
      label="Clean cutout"
      bind:items={form.cleanPng}
      profile="product_image"
      single
      hint="Transparent background, used in comparisons"
    />
    <MediaDropzone label="Gallery" bind:items={form.gallery} profile="product_image" />
    <MediaDropzone
      label="Videos"
      bind:items={form.videos}
      profile="video"
      accept="video/mp4,video/webm"
      hint="mp4 or webm, max 30 MB, never converted"
    />
    <MediaDropzone
      label="Documents"
      bind:items={form.documents}
      profile="document"
      accept="application/pdf"
      hint="PDF, max 15 MB — the alt text is the visible file label"
    />
  </div>
</TabPanel>
