<!--
  One row of the delivery-fee tree, plus its children — the component recurses
  into itself.

  The indent guide is drawn on the child `<ul>` rather than per row, so one line
  spans a whole sibling group instead of being stitched from fragments that
  disagree by a pixel.

  Two things every row must make obvious, because the whole screen is about
  inheritance: whether the figure shown was typed HERE or borrowed from an
  ancestor, and whether "no fee" means nobody filled it in or the owner decided
  it needs a phone call. Hence the state badge beside the amount rather than the
  amount alone.

  THE WHOLE ROW SELECTS. It used to be only the name and the code, which left the
  level badge, the state badge and the amount — the widest, most obvious target on
  a pricing screen, and where the eye already is — clicking through to nothing. The
  chevron is a SIBLING layered over the row's left cell, not a child of it: a
  button inside a button is invalid HTML, and the browser resolves it by dropping
  one of the two.
-->
<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  import { cn } from '$lib/utils.js';
  import { EM_DASH, formatMoney } from '~/lib/format';
  // Svelte 5 recurses by importing the component itself; `<svelte:self>` is deprecated.
  import ZoneTreeRow from './zone-tree-row.svelte';
  import {
    LEVEL_BADGE,
    type ParentIndex,
    type ZoneNode,
    resolveZone,
    zoneMatches,
    zoneTitle,
  } from './tree.ts';

  interface Props {
    node: ZoneNode;
    parents: ParentIndex;
    selectedId: string;
    collapsed: Set<string>;
    /** Lowercased filter term; while it is set every branch renders expanded. */
    term: string;
    onSelect: (node: ZoneNode) => void;
    onToggle: (id: string) => void;
  }

  let { node, parents, selectedId, collapsed, term, onSelect, onToggle }: Props = $props();

  const kids = $derived(node.children.filter((child) => zoneMatches(child, term)));
  const open = $derived(term !== '' || !collapsed.has(node.id));
  const selected = $derived(node.id === selectedId);
  const resolved = $derived(resolveZone(node, parents));
  const title = $derived(zoneTitle(node, parents));

  /** The code shown beside the name — for a `cap` node the pair is already in
      the title, so the label is the useful half instead. */
  const subCode = $derived(node.level === 'cap' ? node.name : node.code);
</script>

<li>
  <div class="relative">
    <!-- `pl-9` is the chevron's cell (4px offset + 24px button + the old 8px gap),
         reserved by padding so the overlaid chevron never sits on the badge. -->
    <button
      type="button"
      class={cn(
        'flex w-full items-center gap-2 rounded-md border py-1.5 pr-2.5 pl-9 text-left transition-colors',
        selected ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/60',
      )}
      aria-current={selected ? 'true' : undefined}
      onclick={() => onSelect(node)}
    >
      <span
        class={cn(
          'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider',
          node.level === 'comune'
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {LEVEL_BADGE[node.level]}
      </span>

      <span class="flex min-w-0 flex-1 items-baseline gap-2">
        <span class="truncate font-medium">{title}</span>
        {#if subCode}
          <code class="shrink-0 font-mono text-xs text-muted-foreground">{subCode}</code>
        {/if}
      </span>

      <!-- State first, amount second: the amount is meaningless until you know
           whether it belongs to this row. -->
      {#if node.valueKind === 'call'}
        <span
          class="shrink-0 rounded-full border border-amber-500/40 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
        >
          NEEDS CALL
        </span>
      {:else if node.valueKind === 'fee'}
        <span
          class="shrink-0 rounded-full border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
        >
          OWN
        </span>
      {:else}
        <span
          class="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
        >
          INHERITED
        </span>
      {/if}

      <span
        class={cn(
          'w-24 shrink-0 text-right text-sm tabular-nums',
          resolved.value === null && 'text-muted-foreground',
          resolved.value?.kind === 'call' &&
            'text-xs font-semibold text-amber-600 dark:text-amber-400',
          resolved.value?.kind === 'fee' &&
            (resolved.inherited ? 'text-muted-foreground' : 'font-semibold'),
        )}
      >
        {#if resolved.value === null}
          {EM_DASH}
        {:else if resolved.value.kind === 'call'}
          Needs call
        {:else}
          {formatMoney(resolved.value.fee)}
        {/if}
      </span>
    </button>

    {#if kids.length > 0}
      <button
        type="button"
        class="absolute top-1/2 left-1 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted"
        aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
        aria-expanded={open}
        onclick={() => onToggle(node.id)}
      >
        <ChevronDownIcon class={cn('size-3.5 transition-transform', !open && '-rotate-90')} />
      </button>
    {/if}
  </div>

  {#if kids.length > 0 && open}
    <ul class="mt-0.5 ml-4 space-y-0.5 border-l pl-3">
      {#each kids as child (child.id)}
        <ZoneTreeRow
          node={child}
          {parents}
          {selectedId}
          {collapsed}
          {term}
          {onSelect}
          {onToggle}
        />
      {/each}
    </ul>
  {/if}
</li>
