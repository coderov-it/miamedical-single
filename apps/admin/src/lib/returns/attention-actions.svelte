<!-- Repair decision for one flagged unit: the inspection note, how long it has waited, and the two outcomes. -->
<script lang="ts">
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { api } from '~/lib/api';
  import { relativeTime } from '~/lib/format';
  import { errorMessage, unwrap } from '~/lib/request';
  import type { AttentionRow } from '~/lib/returns/types';
  import { t, tn } from '~/lib/ui-text';

  interface Props {
    row: AttentionRow;
    onRepaired: (id: string) => void;
    onWriteOff: (row: AttentionRow) => void;
  }

  let { row, onRepaired, onWriteOff }: Props = $props();

  let busy = $state(false);

  const flagged = $derived.by(() => {
    const when = relativeTime(row.inspectedAt);
    if (!row.inspectedByName) return t('returns.flagged', { when });
    return t('returns.flaggedBy', { when, name: row.inspectedByName });
  });
  const days = $derived(
    Math.floor((Date.now() - new Date(row.inspectedAt).getTime()) / 86_400_000),
  );

  const detail = $derived(days > 0 ? `${flagged} · ${tn('returns.waiting', days)}` : flagged);
  const callout = $derived(row.note ? `${row.note} · ${detail}` : detail);

  async function repair() {
    busy = true;
    try {
      await unwrap(
        await api.api.admin.attention[':id'].resolve.$post({
          param: { id: row.id },
          json: { resolution: 'repaired' },
        }),
      );
      toast.success(t('returns.toastRepaired', { product: row.productTitle }));
      onRepaired(row.id);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      busy = false;
    }
  }
</script>

<!-- One row while the actions span the card's width, stacked once they get a column. -->
<div
  class="flex flex-col gap-1.5 @2xl:flex-row @2xl:items-center @6xl:flex-col @6xl:items-stretch"
>
  <p
    class="min-w-0 truncate rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs @2xl:flex-1"
    title={callout}
  >
    {#if row.note}<span class="font-medium">{row.note}</span>{/if}
    <span class="text-muted-foreground">{row.note ? ' · ' : ''}{detail}</span>
  </p>
  <div class="flex gap-1.5 @2xl:w-64 @2xl:shrink-0 @6xl:w-auto">
    <Button variant="outline" size="sm" class="h-7 flex-1" disabled={busy} onclick={repair}>
      {#if busy}<Spinner />{/if}
      {t('returns.repaired')}
    </Button>
    <Button
      variant="outline"
      size="sm"
      class="h-7 flex-1 border-destructive/40 text-destructive hover:text-destructive"
      disabled={busy}
      onclick={() => onWriteOff(row)}
    >
      {t('returns.writeOff')}
    </Button>
  </div>
</div>
