<script lang="ts">
  import type { Snippet } from 'svelte';

  /** Label + control + error + hint. The error usually comes from ApiError.fields. */
  let {
    label,
    error,
    hint,
    children,
  }: {
    label: string;
    error?: string | undefined;
    hint?: string | undefined;
    children: Snippet;
  } = $props();
</script>

<label class="block">
  <span class="mb-1 block text-sm font-medium">{label}</span>
  {@render children()}
  {#if error}
    <span class="mt-1 block text-xs text-red-600" role="alert">{error}</span>
  {:else if hint}
    <span class="mt-1 block text-xs text-neutral-500">{hint}</span>
  {/if}
</label>
