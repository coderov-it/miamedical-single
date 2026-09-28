<!--
  The drop target of an upload field: a real `<button>` inside a drag surface,
  a hidden file input, and the progress bar for the upload in flight. It only
  hands files over — uploading, and what happens to the result, belong to the
  owner (`media-dropzone`, `video-field`).
-->
<script lang="ts">
  import UploadIcon from '@lucide/svelte/icons/upload';

  import { cn } from '$lib/utils.js';

  interface Props {
    onFiles: (files: FileList | File[]) => void;
    /** Filename + progress for the upload currently in flight. */
    pending: { name: string; fraction: number } | null;
    single?: boolean;
    accept?: string;
    disabled?: boolean;
  }

  let { onFiles, pending, single = false, accept, disabled = false }: Props = $props();

  let input = $state<HTMLInputElement | null>(null);
  let dragOver = $state(false);
</script>

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
    if (!disabled && event.dataTransfer?.files) onFiles(event.dataTransfer.files);
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

<input
  bind:this={input}
  type="file"
  {accept}
  multiple={!single}
  class="hidden"
  onchange={(event) => {
    const files = event.currentTarget.files;
    if (files) onFiles(files);
    // Clearing lets the same file be picked again after a removal.
    event.currentTarget.value = '';
  }}
/>
