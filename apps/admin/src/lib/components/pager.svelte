<!--
  Prev/next paging over the `{ page, perPage, total, pageCount }` envelope
  every list endpoint returns.

  It states the range it is showing rather than just the page number, because
  "1–20 of 337" answers the question people actually have ("how much is
  there?") without making them do arithmetic.
-->
<script lang="ts">
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  import { Button } from '$lib/components/ui/button/index.js';
  import { formatNumber } from '~/lib/format';

  interface Props {
    meta: { page: number; perPage: number; total: number; pageCount: number } | undefined;
    onPage: (page: number) => void;
    /** Blocks both arrows while a page is in flight, so clicks cannot stack up. */
    busy?: boolean;
  }

  let { meta, onPage, busy = false }: Props = $props();

  const from = $derived(meta && meta.total > 0 ? (meta.page - 1) * meta.perPage + 1 : 0);
  const to = $derived(meta ? Math.min(meta.page * meta.perPage, meta.total) : 0);
</script>

{#if meta}
  <div
    class="flex items-center justify-between gap-4 border-t px-4 py-2.5 text-sm text-muted-foreground"
  >
    <p class="tabular-nums">
      {#if meta.total === 0}
        No results
      {:else}
        {formatNumber(from)}–{formatNumber(to)} of {formatNumber(meta.total)}
      {/if}
    </p>

    {#if meta.pageCount > 1}
      <div class="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={busy || meta.page <= 1}
          onclick={() => onPage(meta.page - 1)}
        >
          <ChevronLeftIcon />
          Previous
        </Button>
        <span class="px-2 tabular-nums">{meta.page} / {meta.pageCount}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={busy || meta.page >= meta.pageCount}
          onclick={() => onPage(meta.page + 1)}
        >
          Next
          <ChevronRightIcon />
        </Button>
      </div>
    {/if}
  </div>
{/if}
