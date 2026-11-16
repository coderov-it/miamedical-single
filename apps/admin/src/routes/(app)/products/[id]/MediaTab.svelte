<script lang="ts">
  import { P } from '@mia/permissions';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { api } from '~/lib/api';
  import MediaDropzone, { type MediaItem } from '~/lib/components/media-dropzone.svelte';
  import VideoField from '~/lib/components/video-field.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';
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

  /** Back to what the server last returned — drops this tab's unsaved edits. */
  function discard() {
    form = snapshot(product);
    saved = snapshot(product);
  }

  $effect(() => {
    if (product.id === seededFor) return;
    seededFor = product.id;
    discard();
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
      toast.success(t('products.mediaSaved'));
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
  title={t('products.tabMedia')}
  description={t('products.mediaDescription')}
  dirty={isDirty}
  {saving}
  {error}
  onSave={save}
  onDiscard={discard}
  disabledReason={canUpdate ? undefined : t('products.needUpdatePermission')}
>
  <div class="max-w-3xl space-y-6">
    <MediaDropzone
      label={t('products.mediaThumbnail')}
      bind:items={form.thumbnail}
      profile="product_image"
      single
      hint={t('products.mediaThumbnailHint')}
    />
    <MediaDropzone
      label={t('products.mediaCutout')}
      bind:items={form.cleanPng}
      profile="product_image"
      single
      hint={t('products.mediaCutoutHint')}
    />
    <MediaDropzone
      label={t('products.mediaGallery')}
      bind:items={form.gallery}
      profile="product_image"
    />
    <VideoField bind:items={form.videos} hint={t('products.mediaVideoHint')} />
    <MediaDropzone
      label={t('products.mediaDocuments')}
      bind:items={form.documents}
      profile="document"
      accept="application/pdf"
      hint={t('products.mediaDocumentsHint')}
    />
  </div>
</TabPanel>
