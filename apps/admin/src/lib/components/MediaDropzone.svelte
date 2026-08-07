<script lang="ts">
  import type { MediaProfileName } from '@mia/validators';

  import { mediaUrl } from '../api';
  import { editorLang } from '../editor-lang.svelte';
  import { uploadFile } from '../media/upload';

  /**
   * Drag-drop upload through the API with progress. Emits `MediaItem`s —
   * path, mimeType and bilingual alt — straight into the product's `media`
   * object. No library modal, because there is no library.
   */
  interface Item {
    path: string;
    mimeType: string;
    alt?: { it?: string | undefined; en?: string | undefined } | undefined;
  }

  let {
    label,
    items = $bindable(),
    profile,
    single = false,
    accept = 'image/*',
  }: {
    label: string;
    items: Item[];
    profile: MediaProfileName;
    single?: boolean;
    accept?: string;
  } = $props();

  let input = $state<HTMLInputElement | null>(null);
  let dragOver = $state(false);
  let progress = $state<number | null>(null);
  let error = $state<string | null>(null);
  /** Staging paths have no public URL — keep a local object URL per path. */
  let previews = $state<Record<string, string>>({});

  async function addFiles(files: FileList | File[]) {
    error = null;
    for (const file of files) {
      if (single && items.length > 0) items = [];
      progress = 0;
      try {
        const result = await uploadFile(file, profile, (fraction) => (progress = fraction));
        previews[result.path] = URL.createObjectURL(file);
        items = [...items, { path: result.path, mimeType: result.mimeType, alt: {} }];
      } catch (err) {
        error = err instanceof Error ? err.message : 'Upload failed.';
        break;
      } finally {
        progress = null;
      }
      if (single) break;
    }
  }

  function remove(index: number) {
    items = items.filter((_, i) => i !== index);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    items = next;
  }

  function srcFor(item: Item): string | null {
    if (previews[item.path]) return previews[item.path] ?? null;
    if (item.path.startsWith('_staging/')) return null;
    return mediaUrl(item.path);
  }

  const lang = $derived(editorLang.current);
</script>

<div class="block">
  <span class="mb-1 block text-sm font-medium">{label}</span>

  <div
    role="button"
    tabindex="0"
    aria-label={`Upload ${label}`}
    class="rounded-xl border-2 border-dashed p-4 text-center text-sm transition"
    class:border-brand-500={dragOver}
    class:border-neutral-300={!dragOver}
    class:dark:border-neutral-700={!dragOver}
    ondragover={(event) => {
      event.preventDefault();
      dragOver = true;
    }}
    ondragleave={() => (dragOver = false)}
    ondrop={(event) => {
      event.preventDefault();
      dragOver = false;
      if (event.dataTransfer?.files) void addFiles(event.dataTransfer.files);
    }}
    onclick={() => input?.click()}
    onkeydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') input?.click();
    }}
  >
    {#if progress !== null}
      <div class="mx-auto h-1.5 w-40 overflow-hidden rounded bg-neutral-200 dark:bg-neutral-800">
        <div class="bg-brand-600 h-full" style="width: {Math.round(progress * 100)}%"></div>
      </div>
    {:else}
      <span class="text-neutral-500">Drop here or click to upload</span>
    {/if}
  </div>
  {#if error}
    <span class="mt-1 block text-xs text-red-600" role="alert">{error}</span>
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
      event.currentTarget.value = '';
    }}
  />

  {#if items.length > 0}
    <ul class="mt-3 flex flex-col gap-2">
      {#each items as item, index (item.path)}
        <li
          class="flex items-center gap-3 rounded-lg border border-neutral-200 p-2 dark:border-neutral-800"
        >
          <div
            class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800"
          >
            {#if item.mimeType.startsWith('image/') && srcFor(item)}
              <img src={srcFor(item)} alt={item.alt?.[lang] ?? ''} class="size-full object-cover" />
            {:else}
              <span class="px-1 text-center text-[9px] break-all text-neutral-500">
                {item.mimeType.split('/')[1]}
              </span>
            {/if}
          </div>

          <div class="min-w-0 flex-1">
            <div class="truncate text-xs text-neutral-500">{item.path.split('/').at(-1)}</div>
            <input
              type="text"
              placeholder={lang === 'it' ? 'Testo alternativo (IT)' : 'Alt text (EN)'}
              value={item.alt?.[lang] ?? ''}
              oninput={(event) => {
                item.alt = { ...item.alt, [lang]: event.currentTarget.value || undefined };
              }}
              class="mt-1 w-full rounded border border-neutral-200 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>

          {#if !single}
            <div class="flex flex-col">
              <button type="button" class="px-1 text-xs text-neutral-400 hover:text-neutral-700" onclick={() => move(index, -1)} aria-label="Move up">↑</button>
              <button type="button" class="px-1 text-xs text-neutral-400 hover:text-neutral-700" onclick={() => move(index, 1)} aria-label="Move down">↓</button>
            </div>
          {/if}
          <button
            type="button"
            class="px-1 text-xs text-red-500 hover:text-red-700"
            onclick={() => remove(index)}
            aria-label="Remove"
          >
            ✕
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
