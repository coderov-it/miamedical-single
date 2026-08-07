<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';

  /**
   * Move-up/move-down reordering. Deliberately buttons, not drag-and-drop —
   * predictable, accessible, and enough for lists of this size. The parent
   * re-assigns `position` from the index on save.
   */
  let {
    items = $bindable(),
    row,
    onRemove,
  }: {
    items: T[];
    row: Snippet<[T, number]>;
    onRemove?: (index: number) => void;
  } = $props();

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    items = next;
  }
</script>

<ul class="flex flex-col gap-2">
  {#each items as item, index (index)}
    <li class="flex items-start gap-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
      <div class="flex flex-col pt-1">
        <button
          type="button"
          class="px-1 text-xs text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
          disabled={index === 0}
          onclick={() => move(index, -1)}
          aria-label="Move up">↑</button
        >
        <button
          type="button"
          class="px-1 text-xs text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
          disabled={index === items.length - 1}
          onclick={() => move(index, 1)}
          aria-label="Move down">↓</button
        >
      </div>
      <div class="min-w-0 flex-1">
        {@render row(item, index)}
      </div>
      {#if onRemove}
        <button
          type="button"
          class="pt-1 text-xs text-red-500 hover:text-red-700"
          onclick={() => onRemove(index)}
          aria-label="Remove"
        >
          ✕
        </button>
      {/if}
    </li>
  {/each}
</ul>
