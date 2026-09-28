<!--
  One entry of `video-field`: a 16:9 preview in the same bare player the
  storefront would use, the alt text for the owning editor's language, and
  the move/remove controls. Platform videos preview through their embed
  iframe; files and direct links through a native `<video>`, so a link that
  is not actually a playable file shows it here, before it is saved.
-->
<script lang="ts">
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import FileVideoIcon from '@lucide/svelte/icons/file-video-camera';
  import XIcon from '@lucide/svelte/icons/x';
  import { isExternalVideo, VIDEO_IFRAME_ALLOW, videoEmbedUrl } from '@mia/validators';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import type { ContentLanguage } from '~/lib/content-lang.svelte';
  import type { VideoItem } from './video-field.svelte';

  interface Props {
    item: VideoItem;
    /** Playable source for an uploaded file; null while it is still staged. */
    fileSrc: string | null;
    lang: ContentLanguage;
    canMoveEarlier: boolean;
    canMoveLater: boolean;
    showMove: boolean;
    onAlt: (value: string) => void;
    onMove: (delta: number) => void;
    onRemove: () => void;
  }

  let {
    item,
    fileSrc,
    lang,
    canMoveEarlier,
    canMoveLater,
    showMove,
    onAlt,
    onMove,
    onRemove,
  }: Props = $props();

  const SOURCE_LABEL = { link: 'Link', youtube: 'YouTube', facebook: 'Facebook' } as const;

  const external = $derived(isExternalVideo(item) ? item : null);
  const embed = $derived(external ? videoEmbedUrl(external) : null);
  const playable = $derived(external ? external.url : fileSrc);
  const source = $derived(external ? SOURCE_LABEL[external.provider] : 'File');
  const name = $derived(nameOf(item));

  let broken = $state(false);

  function nameOf(video: VideoItem): string {
    if (!isExternalVideo(video)) return video.path.split('/').at(-1) ?? video.path;
    const url = new URL(video.url);
    return `${url.hostname.replace(/^www\./, '')}${url.pathname}${url.search}`;
  }
</script>

<div class="overflow-hidden rounded-lg border bg-card">
  <div class="relative flex aspect-video items-center justify-center bg-muted">
    {#if embed}
      <iframe
        src={embed}
        title={item.alt?.[lang] || `${source} video`}
        loading="lazy"
        allow={VIDEO_IFRAME_ALLOW}
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
        class="absolute inset-0 size-full border-0"
      ></iframe>
    {:else if playable && !broken}
      <!-- svelte-ignore a11y_media_has_caption -->
      <video
        src={playable}
        controls
        playsinline
        preload="metadata"
        class="absolute inset-0 size-full bg-black object-contain"
        onerror={() => (broken = true)}
      ></video>
    {:else if broken}
      <p class="px-4 text-center text-xs text-destructive" role="alert">
        This link does not play as a video file (mp4 or webm).
      </p>
    {:else}
      <!-- Uploaded but not yet public: show that it exists, not a gap. -->
      <FileVideoIcon class="size-5 animate-pulse text-muted-foreground" />
    {/if}
  </div>

  <div class="flex items-start gap-2 p-2">
    <div class="min-w-0 flex-1">
      <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span class="shrink-0 rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
          {source}
        </span>
        <span class="truncate" title={name}>{name}</span>
      </p>
      <Input
        value={item.alt?.[lang] ?? ''}
        placeholder="Alt text ({lang.toUpperCase()})"
        aria-label="Alt text for {name}"
        class="mt-1.5 h-7 text-xs"
        oninput={(event) => onAlt(event.currentTarget.value)}
      />
    </div>

    <div class="flex shrink-0 items-center gap-1.5">
      {#if showMove}
        <ButtonGroup.Root>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canMoveEarlier}
            onclick={() => onMove(-1)}
            aria-label="Move earlier"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canMoveLater}
            onclick={() => onMove(1)}
            aria-label="Move later"
          >
            <ChevronRightIcon />
          </Button>
        </ButtonGroup.Root>
      {/if}
      <Button
        variant="ghost"
        size="icon-sm"
        class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onclick={onRemove}
        aria-label="Remove {name}"
      >
        <XIcon />
      </Button>
    </div>
  </div>
</div>
