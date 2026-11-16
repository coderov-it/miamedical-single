<!--
  The product "Videos" slot: one ordered list holding uploaded files and
  external videos side by side. The source switch only picks how the NEXT
  video is added — upload, a direct link to a video file, or a YouTube /
  Facebook URL (the platform's own "Embed" snippet is accepted too).

  A pasted URL is checked the moment "Add" is pressed: an unusable one marks
  the input, says why, and takes focus. A YouTube or Facebook URL pasted
  under "Link" is filed under its platform, so it still gets the embed player.

  Upload and session-purge behave exactly as in `media-dropzone`.
-->
<script lang="ts">
  import { parseVideoUrl, type VideoProvider } from '@mia/validators';
  import { flip } from 'svelte/animate';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { cn } from '$lib/utils.js';
  import { api, mediaUrl } from '~/lib/api';
  import FileDropButton from '~/lib/components/file-drop-button.svelte';
  import type { MediaItem } from '~/lib/components/media-dropzone.svelte';
  import VideoTile from '~/lib/components/video-tile.svelte';
  import { useContentLang } from '~/lib/content-lang.svelte';
  import type { LocalizedOptional } from '~/lib/i18n';
  import { uploadFile } from '~/lib/media/upload';
  import { Reorder } from '~/lib/reorder.svelte';
  import { type MessageKey, t, tn } from '~/lib/ui-text';

  export interface ExternalVideoItem {
    provider: VideoProvider;
    url: string;
    alt?: LocalizedOptional | undefined;
  }

  export type VideoItem = MediaItem | ExternalVideoItem;

  interface Props {
    items: VideoItem[];
    hint?: string;
  }

  let { items = $bindable(), hint }: Props = $props();

  /** `ProductMediaSchema`'s cap on `videos`. */
  const MAX_VIDEOS = 10;

  type Source = 'file' | VideoProvider;

  const SOURCES: Array<{ id: Source; label: MessageKey }> = [
    { id: 'file', label: 'components.videoSourceFile' },
    { id: 'link', label: 'components.videoSourceLink' },
    { id: 'youtube', label: 'components.videoSourceYoutube' },
    { id: 'facebook', label: 'components.videoSourceFacebook' },
  ];

  const PLACEHOLDER: Record<VideoProvider, string> = {
    link: 'https://example.com/video.mp4',
    youtube: 'https://www.youtube.com/watch?v=…',
    facebook: 'https://www.facebook.com/…/videos/…',
  };

  const NOT_THAT_PROVIDER: Record<VideoProvider, MessageKey> = {
    link: 'components.videoErrorLink',
    youtube: 'components.videoErrorYoutube',
    facebook: 'components.videoErrorFacebook',
  };

  let source = $state<Source>('file');
  let urlInput = $state<HTMLInputElement | null>(null);
  let url = $state('');
  let urlError = $state<string | null>(null);
  let uploadError = $state<string | null>(null);
  let pending = $state<{ name: string; fraction: number } | null>(null);

  /** Staging paths have no public URL yet — hold a local object URL per path. */
  let previews = $state<Record<string, string>>({});
  /** Paths this session uploaded, and may therefore purge on removal. */
  const sessionPaths = new Set<string>();

  const contentLang = useContentLang();
  const lang = $derived(contentLang.current);

  const keyOf = (item: VideoItem) => ('url' in item ? item.url : item.path);

  function pick(next: Source) {
    source = next;
    urlError = null;
    uploadError = null;
  }

  async function addFiles(files: FileList | File[]) {
    uploadError = null;
    for (const file of files) {
      if (items.length >= MAX_VIDEOS) {
        uploadError = t('components.videoLimit', { max: MAX_VIDEOS });
        break;
      }
      pending = { name: file.name, fraction: 0 };
      try {
        const result = await uploadFile(file, 'video', (fraction) => {
          if (pending) pending.fraction = fraction;
        });
        previews[result.path] = URL.createObjectURL(file);
        sessionPaths.add(result.path);
        items.push({ path: result.path, mimeType: result.mimeType, alt: {} });
      } catch (err) {
        uploadError = err instanceof Error ? err.message : t('common.uploadFailed');
        break;
      } finally {
        pending = null;
      }
    }
  }

  function invalidUrl(message: string) {
    urlError = message;
    urlInput?.focus();
  }

  function addUrl(provider: VideoProvider) {
    if (!url.trim()) return invalidUrl(t('components.videoErrorEmpty'));

    const parsed = parseVideoUrl(url);
    // Under "Link" a platform URL is welcome — it is simply filed as what it is.
    if (!parsed || (provider !== 'link' && parsed.provider !== provider)) {
      return invalidUrl(t(NOT_THAT_PROVIDER[provider]));
    }
    if (items.some((item) => keyOf(item) === parsed.url)) {
      return invalidUrl(t('components.videoErrorDuplicate'));
    }
    if (items.length >= MAX_VIDEOS) {
      return invalidUrl(t('components.videoLimit', { max: MAX_VIDEOS }));
    }

    items.push({ provider: parsed.provider, url: parsed.url, alt: {} });
    url = '';
    urlError = null;
  }

  async function remove(index: number) {
    const [removed] = items.splice(index, 1);
    if (!removed || 'url' in removed) return;

    const preview = previews[removed.path];
    if (preview) {
      URL.revokeObjectURL(preview);
      delete previews[removed.path];
    }

    if (!sessionPaths.has(removed.path)) return;
    sessionPaths.delete(removed.path);
    // Best effort — the hourly staging sweep collects anything this misses.
    try {
      await api.api.media.object.$delete({ json: { path: removed.path } });
    } catch {
      /* the sweep will get it */
    }
  }

  const reorder = new Reorder();

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    items = next;
    reorder.mark(keyOf(moved!));
  }

  function fileSrc(item: VideoItem): string | null {
    if ('url' in item) return null;
    if (previews[item.path]) return previews[item.path] ?? null;
    // A staging path is not publicly served, so there is nothing to play yet.
    if (item.path.startsWith('_staging/')) return null;
    return mediaUrl(item.path);
  }
</script>

<div>
  <div class="mb-1.5 flex items-baseline justify-between gap-2">
    <Label>{t('components.videoLabel')}</Label>
    {#if hint}<span class="text-xs text-muted-foreground">{hint}</span>{/if}
  </div>

  <ButtonGroup.Root class="mb-2" aria-label={t('components.videoHowToAdd')}>
    {#each SOURCES as option (option.id)}
      <Button
        variant={source === option.id ? 'secondary' : 'outline'}
        size="sm"
        aria-pressed={source === option.id}
        onclick={() => pick(option.id)}
      >
        {t(option.label)}
      </Button>
    {/each}
  </ButtonGroup.Root>

  {#if source === 'file'}
    <FileDropButton
      onFiles={(files) => void addFiles(files)}
      {pending}
      accept="video/mp4,video/webm"
    />
    {#if uploadError}
      <p class="mt-1 text-xs text-destructive" role="alert">{uploadError}</p>
    {/if}
  {:else}
    {@const provider = source}
    <form
      class="flex gap-2"
      novalidate
      onsubmit={(event) => {
        event.preventDefault();
        addUrl(provider);
      }}
    >
      <Input
        bind:ref={urlInput}
        bind:value={url}
        type="url"
        inputmode="url"
        placeholder={PLACEHOLDER[provider]}
        aria-label={t('components.videoUrlLabel', {
          source: t(
            SOURCES.find((option) => option.id === provider)?.label ?? 'components.videoSourceLink',
          ),
        })}
        aria-invalid={urlError ? 'true' : undefined}
        aria-describedby={urlError ? 'video-url-error' : undefined}
        oninput={() => (urlError = null)}
      />
      <Button type="submit" variant="outline">{t('components.videoAdd')}</Button>
    </form>
    {#if urlError}
      <p id="video-url-error" class="mt-1 text-xs text-destructive" role="alert">{urlError}</p>
    {/if}
  {/if}

  {#if items.length > 0}
    <ul class="mt-3 grid gap-3 sm:grid-cols-2">
      {#each items as item, index (keyOf(item))}
        <li
          animate:flip={reorder.flip}
          class={cn('rounded-lg transition-shadow duration-500', reorder.ring(keyOf(item)))}
        >
          <VideoTile
            {item}
            fileSrc={fileSrc(item)}
            {lang}
            showMove={items.length > 1}
            canMoveEarlier={index > 0}
            canMoveLater={index < items.length - 1}
            onAlt={(value) => (item.alt = { ...item.alt, [lang]: value || undefined })}
            onMove={(delta) => move(index, delta)}
            onRemove={() => void remove(index)}
          />
        </li>
      {/each}
    </ul>
    <p class="mt-1.5 text-xs text-muted-foreground">
      {tn('components.videoCount', items.length, { max: MAX_VIDEOS })}
    </p>
  {/if}
</div>
