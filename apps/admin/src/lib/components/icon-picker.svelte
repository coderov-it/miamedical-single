<!--
  The upload pipeline bound to `icon_256` / `icon_1024`, with a square preview
  so the operator sees the centre crop before saving. Binds a bare path string
  — exactly what the `icon text` column stores.
-->
<script lang="ts">
  import ImageIcon from '@lucide/svelte/icons/image';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import type { MediaProfileName } from '@mia/validators';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { mediaUrl } from '~/lib/api';
  import { uploadFile } from '~/lib/media/upload';

  interface Props {
    label: string;
    value: string | null;
    profile?: Extract<MediaProfileName, 'icon_256' | 'icon_1024'>;
    error?: string | undefined;
    /** Drops the caption when the surrounding form already explains itself. */
    compact?: boolean;
  }

  let {
    label,
    value = $bindable(),
    profile = 'icon_256',
    error,
    compact = false,
  }: Props = $props();

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
      // Clearing lets the same file be re-picked after a failure.
      if (input) input.value = '';
    }
  }

  const size = $derived(profile === 'icon_256' ? '256 × 256' : 'up to 1024 × 1024');
</script>

<div>
  <Label class="mb-1.5">{label}</Label>

  <div class="flex items-center gap-3">
    <div
      class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted"
    >
      {#if uploading}
        <Spinner class="size-4" />
      {:else if previewUrl}
        <img src={previewUrl} alt="" class="size-full object-cover" />
      {:else if value}
        <img src={mediaUrl(value)} alt="" class="size-full object-cover" />
      {:else}
        <ImageIcon class="size-4 text-muted-foreground" />
      {/if}
    </div>

    <div class="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onclick={() => input?.click()}
      >
        <UploadIcon />
        {value ? 'Replace' : 'Upload'}
      </Button>
      {#if value}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          class="text-destructive"
          onclick={() => {
            value = null;
            previewUrl = null;
          }}
        >
          Remove
        </Button>
      {/if}
    </div>
  </div>

  {#if !compact}
    <p class="mt-1.5 text-xs text-muted-foreground">
      SVG is kept as-is; any other image becomes a square {size} WebP.
    </p>
  {/if}

  {#if localError || error}
    <p class="mt-1 text-xs text-destructive" role="alert">{localError ?? error}</p>
  {/if}

  <input bind:this={input} type="file" accept="image/*" class="hidden" onchange={onPick} />
</div>
