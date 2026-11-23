<!-- The "to check" tab: one card per returned unit nobody has decided yet. -->
<script lang="ts">
  import ClipboardCheckIcon from '@lucide/svelte/icons/clipboard-check';

  import ListStates from '~/lib/returns/list-states.svelte';
  import type { ListStatus } from '~/lib/returns/list-status';
  import PendingActions from '~/lib/returns/pending-actions.svelte';
  import ReturnUnitCard from '~/lib/returns/return-unit-card.svelte';
  import type { PendingUnit } from '~/lib/returns/types';
  import { t } from '~/lib/ui-text';

  interface Props {
    data: PendingUnit[] | undefined;
    status: ListStatus;
    error: string | null;
    canUpdate: boolean;
    onChanged: () => void;
    onRetry: () => void;
  }

  let { data, status, error, canUpdate, onChanged, onRetry }: Props = $props();

  const units = $derived(data ?? []);
</script>

{#if status === 'loading' || status === 'error' || units.length === 0}
  <ListStates
    {status}
    {error}
    loadingLabel={t('returns.loadingPending')}
    icon={ClipboardCheckIcon}
    emptyText={t('returns.pendingEmpty')}
    {onRetry}
  />
{:else}
  <div class="space-y-3">
    {#each units as unit (`${unit.orderItemId}-${unit.unitNumber}`)}
      <ReturnUnitCard {unit} hasActions={canUpdate}>
        {#snippet actions()}
          <PendingActions {unit} {onChanged} />
        {/snippet}
      </ReturnUnitCard>
    {/each}
  </div>
{/if}
