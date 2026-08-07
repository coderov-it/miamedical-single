<script lang="ts">
  import type { MediaProfileName } from '@mia/validators';

  import { mediaUrl } from '../api';
  import { uploadFile } from '../media/upload';

  /**
   * The upload pipeline bound to `icon_256` / `icon_1024`, with a square
   * preview so the operator sees the centre crop before saving. Binds a bare
   * path string — exactly what the `icon text` column stores.
   */
  let {
    label,
    value = $bindable(),
    profile = 'icon_256',
    error,
  }: {
    label: string;
    value: string | null;
    profile?: Extract<MediaProfileName, 'icon_256' | 'icon_1024'>;
    error?: string | undefined;
  } = $props();

  let input = $state<HTMLInputElement | null>(null);
  let uploading = $state(false);
  let localError = $state<string | null>(null);
  /** Local preview for a fresh upload — a staging path has no public URL yet. */
  let previewUrl = $state<string | null>(null);

  async function onPick(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    uploading = true;
    localError = null;
    try {
      const result = await uploadFile(file, profile);
      value = result.path;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(file);
    } catch (err) {
      localError = err instanceof Error ? err.message : 'Upload failed.';
    } finally {
      uploading = false;
      if (input) input.value = '';
    }
  }

  const size = $derived(profile === 'icon_256' ? '256 × 256' : 'up to 1024 × 1024');
</script>

<div class="block">
  <span class="mb-1 block text-sm font-medium">{label}</span>
  <div class="flex items-center gap-3">
    <div
      class="flex size-16 items-center justify-center overflow-hidden rounded-lg border border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
    >
      {#if uploading}
        <span class="text-[10px] text-neutral-400">…</span>
      {:else if previewUrl}
        <img src={previewUrl} alt="" class="size-full object-cover" />
      {:else if value}
        <img src={mediaUrl(value)} alt="" class="size-full object-cover" />
      {:else}
        <span class="text-[10px] text-neutral-400">none</span>
      {/if}
    </div>
    <div class="flex flex-col gap-1">
      <button
        type="button"
        onclick={() => input?.click()}
        disabled={uploading}
        class="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        {value ? 'Replace' : 'Upload'}…
      </button>
      {#if value}
        <button
          type="button"
          onclick={() => {
            value = null;
            previewUrl = null;
          }}
          class="text-left text-xs text-red-600 hover:underline"
        >
          Remove
        </button>
      {/if}
    </div>
  </div>
  <span class="mt-1 block text-xs text-neutral-500">
    SVG is best and is kept as-is; any other image becomes a square {size} WebP.
  </span>
  {#if localError || error}
    <span class="mt-1 block text-xs text-red-600" role="alert">{localError ?? error}</span>
  {/if}
  <input bind:this={input} type="file" accept="image/*" class="hidden" onchange={onPick} />
</div>
