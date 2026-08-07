<!--
  Move-up / move-down reordering. Deliberately buttons rather than
  drag-and-drop: predictable, keyboard-operable, works on touch, and enough
  for lists of this size. The parent re-derives `position` from the index on
  save.

  Rows are keyed by a caller-supplied stable key, **not** by index. Keying an
  editable list by index means Svelte reuses the DOM node when rows move, so
  the focused input and any component-local state stay behind while the data
  slides past them — reorder while typing and your text lands in the wrong row.
-->
<script lang="ts" generics="T">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import XIcon from '@lucide/svelte/icons/x';
  import type { Snippet } from 'svelte';

  import { Button } from '$lib/components/ui/button/index.js';

  interface Props {
    items: T[];
    row: Snippet<[T, number]>;
    /** Stable identity per row — required, because index keys corrupt edits. */
    key: (item: T, index: number) => string;
    onRemove?: (index: number) => void;
    /** Names the row in the reorder buttons' labels, for screen readers. */
    describe?: (item: T, index: number) => string;
  }

  let { items = $bindable(), row, key, onRemove, describe }: Props = $props();

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
  {#each items as item, index (key(item, index))}
    {@const name = describe?.(item, index) ?? `item ${index + 1}`}
    <li class="flex items-start gap-2 rounded-lg border bg-muted/30 p-2">
      <div class="flex flex-col pt-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          class="text-muted-foreground"
          disabled={index === 0}
          onclick={() => move(index, -1)}
          aria-label="Move {name} up"
        >
          <ChevronUpIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          class="text-muted-foreground"
          disabled={index === items.length - 1}
          onclick={() => move(index, 1)}
          aria-label="Move {name} down"
        >
          <ChevronDownIcon />
        </Button>
      </div>

      <div class="min-w-0 flex-1 rounded-md bg-card p-3">
        {@render row(item, index)}
      </div>

      {#if onRemove}
        <Button
          variant="ghost"
          size="icon-sm"
          class="text-muted-foreground hover:text-destructive"
          onclick={() => onRemove(index)}
          aria-label="Remove {name}"
        >
          <XIcon />
        </Button>
      {/if}
    </li>
  {/each}
</ul>
