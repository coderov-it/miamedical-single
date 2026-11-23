<!--
  The stock decision for returned units. "To check" lists units from received
  rentals that nobody has decided yet; "Needs attention" is the repair queue.
  The tab lives in the URL, so the order page can link straight to the second.

  Each list reads its own Resource through `listStatus`: the first load shows
  skeletons and a spinner pill, a reload keeps the cards and spins beside the
  count, a failure shows a retry card.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import { toast } from 'svelte-sonner';

  import { api } from '~/lib/api';
  import { QueryState } from '~/lib/query-state.svelte';
  import AttentionList from '~/lib/returns/attention-list.svelte';
  import { listStatus } from '~/lib/returns/list-status';
  import PendingList from '~/lib/returns/pending-list.svelte';
  import ReturnsTabs from '~/lib/returns/returns-tabs.svelte';
  import type { AttentionRow, PendingUnit } from '~/lib/returns/types';
  import { unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';

  const query = new QueryState({ tab: 'pending' }, { pageKey: null });
  const tab = $derived(query.current.tab === 'attention' ? 'attention' : 'pending');

  const enabled = () => session.can(P.ORDER_READ);
  const pending = new Resource(
    () => true,
    async (_, signal) =>
      unwrap<PendingUnit[]>(
        await api.api.admin.returns.pending.$get(undefined, { init: { signal } }),
      ),
    { enabled },
  );
  const attention = new Resource(
    () => true,
    async (_, signal) =>
      unwrap<AttentionRow[]>(await api.api.admin.attention.$get(undefined, { init: { signal } })),
    { enabled },
  );

  const canUpdate = $derived(session.can(P.ORDER_UPDATE));
  const counts = $derived({
    pending: pending.data?.length ?? 0,
    attention: attention.data?.length ?? 0,
  });
  const status = $derived({ pending: listStatus(pending), attention: listStatus(attention) });

  $effect(() => {
    if (pending.error) toast.error(pending.error);
  });
  $effect(() => {
    if (attention.error) toast.error(attention.error);
  });

  function reload() {
    pending.refresh();
    attention.refresh();
  }
</script>

<section class="admin-page">
  <h1 class="sr-only">{t('returns.title')}</h1>

  <ReturnsTabs {tab} {counts} {status} onSelect={(value) => query.set({ tab: value })} />

  <div role="tabpanel" id="returns-panel-{tab}" aria-labelledby="returns-tab-{tab}">
    {#if tab === 'pending'}
      <PendingList
        data={pending.data}
        status={status.pending}
        error={pending.error}
        {canUpdate}
        onChanged={reload}
        onRetry={() => pending.refresh()}
      />
    {:else}
      <AttentionList
        data={attention.data}
        status={status.attention}
        error={attention.error}
        {canUpdate}
        onChanged={reload}
        onRetry={() => attention.refresh()}
      />
    {/if}
  </div>
</section>
