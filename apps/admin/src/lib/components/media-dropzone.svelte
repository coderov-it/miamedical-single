<!--
  Drag-drop upload through the API, rendered as a tile grid. Emits `MediaItem`s
  — path, mimeType, bilingual alt — straight into the owning entity's `media`
  object. There is no library modal, because there is no library.

  Two things worth knowing:

  **Accessibility.** The drop target is a real `<button>`. The old version put
  `role="button" tabindex="0"` on a `<div>` that *contained* the alt-text
  inputs, so tabbing into a caption first landed on a fake button, and Space
  inside the caption opened a file picker.

  **Session keys.** Removing a tile that was uploaded *in this session* purges
  the staged object from R2 immediately — nobody else can reference a staging
  path, so it is safe and it keeps the bucket clean. Removing a tile that was
  already saved only drops the reference; the server reconciles the real object
  when the entity is saved, and its hourly orphan sweep is the backstop. Doing
  it the other way round would delete a live file on an unsaved edit.
-->
<script lang="ts">
  import FileIcon from '@lucide/svelte/icons/file';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import XIcon from '@lucide/svelte/icons/x';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import type { MediaProfileName } from '@mia/validators';
  import { mergeProps } from 'bits-ui';
  import { flip } from 'svelte/animate';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import { cn } from '$lib/utils.js';
  import { api, mediaUrl } from '~/lib/api';
  import { useContentLang } from '~/lib/content-lang.svelte';
  import { formatBytes } from '~/lib/format';
  import { uploadFile } from '~/lib/media/upload';
  import { Reorder } from '~/lib/reorder.svelte';

  export interface MediaItem {
    path: string;
    mimeType: string;
    alt?: { it?: string | undefined; en?: string | undefined } | undefined;
  }

  interface Props {
    label: string;
    items: MediaItem[];
    profile: MediaProfileName;
    single?: boolean;
    accept?: string;
    hint?: string;
    disabled?: boolean;
  }

  let {
    label,
    items = $bindable(),
    profile,
    single = false,
    accept = 'image/*',
    hint,
    disabled = false,
  }: Props = $props();

  let input = $state<HTMLInputElement | null>(null);
  let dragOver = $state(false);
  let error = $state<string | null>(null);

  /** Filename + progress for the upload currently in flight. */
  let pending = $state<{ name: string; size: number; fraction: number } | null>(null);

  /** Staging paths have no public URL yet — hold a local object URL per path. */
  let previews = $state<Record<string, string>>({});

  /** Paths this session uploaded, and may therefore purge on removal. */
  const sessionPaths = new Set<string>();

  // Alt text is content: it follows the owning editor's IT/EN tabs.
  const contentLang = useContentLang();
  const lang = $derived(contentLang.current);

  async function addFiles(files: FileList | File[]) {
    error = null;

    for (const file of files) {
      if (single && items.length > 0) items = [];
      pending = { name: file.name, size: file.size, fraction: 0 };

      try {
        const result = await uploadFile(file, profile, (fraction) => {
          if (pending) pending.fraction = fraction;
        });
        previews[result.path] = URL.createObjectURL(file);
        sessionPaths.add(result.path);
        items.push({ path: result.path, mimeType: result.mimeType, alt: {} });
      } catch (err) {
        error = err instanceof Error ? err.message : 'Upload failed.';
        break;
      } finally {
        pending = null;
      }

      if (single) break;
    }
  }

  async function remove(index: number) {
    const [removed] = items.splice(index, 1);
    if (!removed) return;

    const preview = previews[removed.path];
    if (preview) {
      URL.revokeObjectURL(preview);
      delete previews[removed.path];
    }

    if (!sessionPaths.has(removed.path)) return;
    sessionPaths.delete(removed.path);

    // Best effort. A failed purge leaves an orphan the hourly sweep collects,
    // which is a far better outcome than blocking the edit on a storage call.
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
    reorder.mark(moved!.path);
  }

  function srcFor(item: MediaItem): string | null {
    if (previews[item.path]) return previews[item.path] ?? null;
    // A staging path is not publicly served, so there is nothing to show yet.
    if (item.path.startsWith('_staging/')) return null;
    return mediaUrl(item.path);
  }
</script>

<div>
  <div class="mb-1.5 flex items-baseline justify-between gap-2">
    <Label>{label}</Label>
    {#if hint}<span class="text-xs text-muted-foreground">{hint}</span>{/if}
  </div>

  <!-- The drag surface wraps the button; the button is what is focusable. -->
  <div
    role="presentation"
    ondragover={(event) => {
      event.preventDefault();
      dragOver = true;
    }}
    ondragleave={() => (dragOver = false)}
    ondrop={(event) => {
      event.preventDefault();
      dragOver = false;
      if (!disabled && event.dataTransfer?.files) void addFiles(event.dataTransfer.files);
    }}
  >
    <button
      type="button"
      {disabled}
      onclick={() => input?.click()}
      class={cn(
        'flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-5 text-sm transition-colors',
        'hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        dragOver ? 'border-primary bg-primary/5' : 'border-input',
      )}
    >
      {#if pending}
        <span class="w-full max-w-xs">
          <span class="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span class="truncate">{pending.name}</span>
            <span class="tabular-nums">{Math.round(pending.fraction * 100)}%</span>
          </span>
          <span class="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <span
              class="block h-full rounded-full bg-primary transition-[width]"
              style="width: {Math.round(pending.fraction * 100)}%"
            ></span>
          </span>
        </span>
      {:else}
        <UploadIcon class="size-4 text-muted-foreground" />
        <span class="text-muted-foreground">
          Drop {single ? 'a file' : 'files'} here, or click to choose
        </span>
      {/if}
    </button>
  </div>

  {#if error}
    <p class="mt-1 text-xs text-destructive" role="alert">{error}</p>
  {/if}

  <input
    bind:this={input}
    type="file"
    {accept}
    multiple={!single}
    class="hidden"
    onchange={(event) => {
      const files = event.currentTarget.files;
      if (files) void addFiles(files);
      // Clearing lets the same file be picked again after a removal.
      event.currentTarget.value = '';
    }}
  />

  {#if items.length > 0}
    {#snippet moveButton(index: number, earlier: boolean)}
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <Button
              {...mergeProps(props, { onclick: () => move(index, earlier ? -1 : 1) })}
              variant="outline"
              size="icon-sm"
              disabled={earlier ? index === 0 : index === items.length - 1}
              aria-label="Move {earlier ? 'earlier' : 'later'}"
            >
              {#if earlier}
                <ChevronLeftIcon />
              {:else}
                <ChevronRightIcon />
              {/if}
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content>Move {earlier ? 'earlier' : 'later'}</Tooltip.Content>
      </Tooltip.Root>
    {/snippet}

    <ul class="mt-3 grid gap-2 sm:grid-cols-2">
      {#each items as item, index (item.path)}
        {@const src = srcFor(item)}
        <li
          animate:flip={reorder.flip}
          class={cn(
            'group flex items-start gap-3 rounded-lg border bg-card p-2 transition-shadow duration-500',
            reorder.ring(item.path),
          )}
        >
          <div
            class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted"
          >
            {#if item.mimeType.startsWith('image/') && src}
              <img {src} alt={item.alt?.[lang] ?? ''} class="size-full object-cover" />
            {:else if item.mimeType.startsWith('image/')}
              <!-- Uploaded but not yet public: show that it exists, not a gap. -->
              <FileIcon class="size-4 animate-pulse text-muted-foreground" />
            {:else}
              <span class="px-1 text-center text-[0.5625rem] break-all text-muted-foreground">
                {item.mimeType.split('/')[1]}
              </span>
            {/if}
          </div>

          <div class="min-w-0 flex-1">
            <p class="truncate text-xs text-muted-foreground">{item.path.split('/').at(-1)}</p>
            <Input
              value={item.alt?.[lang] ?? ''}
              placeholder={lang === 'it' ? 'Testo alternativo (IT)' : 'Alt text (EN)'}
              aria-label="Alt text for {item.path.split('/').at(-1)}"
              class="mt-1 h-7 text-xs"
              oninput={(event) => {
                item.alt = { ...item.alt, [lang]: event.currentTarget.value || undefined };
              }}
            />
          </div>

          <!-- Stacked to fit the tile's height, but the arrows point left/right
               because the grid wraps: "earlier" and "later" are reading order,
               not the axis the buttons happen to sit on. -->
          <div class="flex shrink-0 flex-col items-end gap-1.5">
            {#if !single && items.length > 1}
              <ButtonGroup.Root orientation="vertical">
                {@render moveButton(index, true)}
                {@render moveButton(index, false)}
              </ButtonGroup.Root>
            {/if}
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  <Button
                    {...mergeProps(props, { onclick: () => void remove(index) })}
                    variant="ghost"
                    size="icon-sm"
                    class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove {item.path.split('/').at(-1)}"
                  >
                    <XIcon />
                  </Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>Remove</Tooltip.Content>
            </Tooltip.Root>
          </div>
        </li>
      {/each}
    </ul>
  {/if}

  {#if items.length > 0}
    <p class="mt-1.5 text-xs text-muted-foreground">
      {items.length === 1 ? '1 file' : `${items.length} files`}
      {#if pending}· uploading {formatBytes(pending.size)}{/if}
    </p>
  {/if}
</div>
