<!--
  The one shape every list screen takes: header (count + filters) → table →
  status → pager.

  The rule this component exists to enforce is that **the table is never
  unmounted**. Error, empty and loading render as siblings *below* it, so a
  filter change moves the rows rather than collapsing the page to the word
  "Loading…" and throwing the reader's scroll position away. Only the very
  first load — when there is genuinely nothing to show yet — renders skeletons
  in the table's place.
-->
<script lang="ts">
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import type { Snippet } from 'svelte';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import Pager from '~/lib/components/pager.svelte';
  import { pluralize } from '~/lib/format';

  interface Props {
    /** Singular noun for the count, e.g. `product` → "3 products". */
    noun: string;
    nounPlural?: string;
    meta: { page: number; perPage: number; total: number; pageCount: number } | undefined;
    loading: boolean;
    error: string | null;
    /** The list loaded and came back with nothing. */
    isEmpty: boolean;
    onPage: (page: number) => void;
    onRetry: () => void;

    filters?: Snippet;
    /** The `<Table.Root>`; rendered only once there is something in it. */
    table: Snippet;
    /** Shown when a *successful* load returns no rows. */
    empty: Snippet;
    /** Column count, so the first-load skeleton lines up with the real table. */
    skeletonColumns?: number;
  }

  let {
    noun,
    nounPlural,
    meta,
    loading,
    error,
    isEmpty,
    onPage,
    onRetry,
    filters,
    table,
    empty,
    skeletonColumns = 5,
  }: Props = $props();

  const firstLoad = $derived(loading && meta === undefined);
</script>

<Card.Root class="gap-0 overflow-hidden py-0">
  <div class="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center">
    <p class="text-sm font-medium whitespace-nowrap">
      {#if meta}
        {pluralize(meta.total, noun, nounPlural)}
      {:else}
        &nbsp;
      {/if}
    </p>
    {#if filters}
      <div class="lg:ml-auto">{@render filters()}</div>
    {/if}
  </div>

  <!-- Reserved height either way, so the table does not shift by 2px on load. -->
  <div class="h-0.5">
    {#if loading && !firstLoad}<div class="admin-loading-bar"></div>{/if}
  </div>

  {#if firstLoad}
    <div class="space-y-3 p-4">
      {#each { length: 6 } as _, row (row)}
        <div class="flex gap-4">
          {#each { length: skeletonColumns } as _, column (column)}
            <Skeleton class="h-5 flex-1" />
          {/each}
        </div>
      {/each}
    </div>
  {:else if !isEmpty}
    {@render table()}
  {/if}

  {#if error}
    <div class="flex items-center gap-3 border-t bg-destructive/5 px-4 py-3 text-sm" role="alert">
      <CircleAlertIcon class="size-4 shrink-0 text-destructive" />
      <span class="text-destructive">{error}</span>
      <Button variant="outline" size="sm" class="ml-auto" onclick={onRetry}>Retry</Button>
    </div>
  {:else if isEmpty && !firstLoad}
    {@render empty()}
  {/if}

  <Pager {meta} {onPage} busy={loading} />
</Card.Root>
