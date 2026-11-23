<!--
  The "needs attention" tab: units flagged on return. Each is repaired (stock +1)
  or written off (stays out, reason on record). Oldest first.
-->
<script lang="ts">
  import WrenchIcon from '@lucide/svelte/icons/wrench';

  import AttentionActions from '~/lib/returns/attention-actions.svelte';
  import ListStates from '~/lib/returns/list-states.svelte';
  import type { ListStatus } from '~/lib/returns/list-status';
  import ReturnUnitCard from '~/lib/returns/return-unit-card.svelte';
  import type { AttentionRow } from '~/lib/returns/types';
  import WriteOffDialog from '~/lib/returns/write-off-dialog.svelte';
  import { t } from '~/lib/ui-text';

  interface Props {
    data: AttentionRow[] | undefined;
    status: ListStatus;
    error: string | null;
    canUpdate: boolean;
    /** Something was resolved: the parent reloads both lists. */
    onChanged: () => void;
    onRetry: () => void;
  }

  let { data, status, error, canUpdate, onChanged, onRetry }: Props = $props();

  /** Rows resolved here leave at once; the reload would drop them anyway. */
  let resolved = $state<string[]>([]);
  const rows = $derived((data ?? []).filter((row) => !resolved.includes(row.id)));

  let writeOff = $state<{ id: string; productTitle: string; orderNumber: string } | undefined>();

  function done(id: string) {
    resolved = [...resolved, id];
    onChanged();
  }
</script>

{#if status === 'loading' || status === 'error' || rows.length === 0}
  <ListStates
    {status}
    {error}
    loadingLabel={t('returns.loadingAttention')}
    icon={WrenchIcon}
    emptyText={t('returns.attentionEmpty')}
    {onRetry}
  />
{:else}
  <div class="space-y-3">
    {#each rows as row (row.id)}
      <ReturnUnitCard unit={row} hasActions={canUpdate}>
        {#snippet actions()}
          <AttentionActions
            {row}
            onRepaired={done}
            onWriteOff={(target) =>
              (writeOff = {
                id: target.id,
                productTitle: target.productTitle,
                orderNumber: target.orderNumber,
              })}
          />
        {/snippet}
      </ReturnUnitCard>
    {/each}
  </div>
{/if}

<WriteOffDialog target={writeOff} onClose={() => (writeOff = undefined)} onDone={done} />
