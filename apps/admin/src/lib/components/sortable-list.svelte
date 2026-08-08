<!--
  Move-up / move-down reordering. Deliberately buttons rather than
  drag-and-drop: predictable, keyboard-operable, works on touch, and enough
  for lists of this size. The parent re-derives `position` from the index on
  save. Why the row header carries an ordinal, why the arrows are an attached
  pair, and why the swap is animated: docs/code/admin-client-layer.md
  § Shared list chrome.

  Rows are keyed by a caller-supplied stable key, **not** by index. Keying an
  editable list by index means Svelte reuses the DOM node when rows move, so
  the focused input and any component-local state stay behind while the data
  slides past them — reorder while typing and your text lands in the wrong row.
-->
<script lang="ts" generics="T">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import type { Snippet } from 'svelte';
  import { flip } from 'svelte/animate';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
  import { cn } from '$lib/utils.js';
  import { Reorder } from '~/lib/reorder.svelte';

  interface Props {
    items: T[];
    row: Snippet<[T, number]>;
    /** Stable identity per row — required, because index keys corrupt edits. */
    key: (item: T, index: number) => string;
    onRemove?: (index: number) => void;
    /** Names the row in the reorder buttons' labels, for screen readers. */
    describe?: (item: T, index: number) => string;
    /** Singular noun for the row header — "Question 1", "Package 2". */
    label?: string;
  }

  let { items = $bindable(), row, key, onRemove, describe, label = 'Item' }: Props = $props();

  const rowName = (item: T, index: number) =>
    describe?.(item, index) ?? `${label.toLowerCase()} ${index + 1}`;

  const reorder = new Reorder();

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    items = next;
    reorder.mark(key(moved!, target));
  }
</script>

<!-- No tooltip: it covers the row it is describing, and the ordinal beside the
     pair already says what these do. `aria-label` carries the name for screen
     readers, which is the part that has to be there. -->
{#snippet moveButton(index: number, up: boolean, name: string)}
  <Button
    variant="outline"
    size="icon-sm"
    disabled={up ? index === 0 : index === items.length - 1}
    onclick={() => move(index, up ? -1 : 1)}
    aria-label="Move {name} {up ? 'up' : 'down'}"
  >
    {#if up}
      <ChevronUpIcon />
    {:else}
      <ChevronDownIcon />
    {/if}
  </Button>
{/snippet}

<ul class="flex flex-col gap-2">
  {#each items as item, index (key(item, index))}
    <li
      animate:flip={reorder.flip}
      class={cn(
        'rounded-lg border bg-muted/30 p-2 transition-shadow duration-500',
        reorder.ring(key(item, index)),
      )}
    >
      <div class="flex items-center gap-2 pb-2 pl-1">
        <span class="text-xs font-medium text-muted-foreground">
          {label}
          {index + 1}
        </span>

        <!-- One row cannot be reordered; two disabled arrows would only be noise. -->
        {#if items.length > 1}
          <ButtonGroup.Root>
            {@render moveButton(index, true, rowName(item, index))}
            {@render moveButton(index, false, rowName(item, index))}
          </ButtonGroup.Root>
        {/if}

        {#if onRemove}
          <Button
            variant="ghost"
            size="sm"
            class="ml-auto text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onclick={() => onRemove(index)}
            aria-label="Remove {rowName(item, index)}"
          >
            <Trash2Icon />
            Remove
          </Button>
        {/if}
      </div>

      <div class="min-w-0 rounded-md bg-card p-3">
        {@render row(item, index)}
      </div>
    </li>
  {/each}
</ul>
