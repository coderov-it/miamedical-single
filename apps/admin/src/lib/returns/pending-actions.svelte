<!--
  Decision for one returned unit. "Needs attention" cannot be recorded without
  saying what is wrong, so that click marks this card's note and sends nothing;
  "Stock back" needs no note.
-->
<script lang="ts">
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { api } from '~/lib/api';
  import { focusFirstIssue } from '~/lib/form-gate';
  import type { OrderDetail } from '~/lib/orders/types';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import type { PendingUnit } from '~/lib/returns/types';
  import { t } from '~/lib/ui-text';

  interface Props {
    unit: PendingUnit;
    /** A decision was saved: the parent reloads both lists. */
    onChanged: () => void;
  }

  let { unit, onChanged }: Props = $props();

  const noteId = $derived(`return-note-${unit.orderItemId}-${unit.unitNumber}`);
  const label = $derived(`${unit.productTitle} #${unit.unitNumber}`);

  let note = $state('');
  let error = $state('');
  let busy = $state<'restocked' | 'attention' | null>(null);

  function mark(message: string) {
    error = message;
    focusFirstIssue({ note: message }, [{ key: 'note', id: noteId }]);
  }

  async function decide(outcome: 'restocked' | 'attention') {
    const text = note.trim();
    if (outcome === 'attention' && !text) {
      mark(t('orders.inspectionNoteRequired'));
      return;
    }
    busy = outcome;
    error = '';
    try {
      const updated = await unwrap<OrderDetail>(
        await api.api.admin.orders[':id'].inspections.$post({
          param: { id: unit.orderId },
          json: { orderItemId: unit.orderItemId, outcome, ...(text ? { note: text } : {}) },
        }),
      );
      const key =
        updated.status === 'fulfilled' ? 'orders.inspectionClosed' : 'orders.inspectionSaved';
      toast.success(t(key, { number: updated.number }));
      note = '';
      onChanged();
    } catch (err) {
      const message = errorFields(err).note;
      if (message) {
        mark(message);
      } else {
        toast.error(errorMessage(err));
      }
    } finally {
      busy = null;
    }
  }
</script>

<!-- One row while the actions span the card's width, stacked once they get a column. -->
<div
  class="flex flex-col gap-1.5 @2xl:flex-row @2xl:items-start @6xl:flex-col @6xl:items-stretch"
>
  <div class="min-w-0 @2xl:flex-1">
    <Input
      id={noteId}
      class="h-8 text-sm"
      bind:value={note}
      placeholder={t('orders.inspectionNotePlaceholder')}
      aria-label={t('orders.inspectionNoteLabel', { unit: label })}
      aria-invalid={error ? 'true' : undefined}
    />
    {#if error}
      <p class="mt-1 text-xs text-destructive" role="alert">{error}</p>
    {/if}
  </div>
  <div class="flex gap-1.5 @2xl:w-72 @2xl:shrink-0 @2xl:py-0.5 @6xl:w-auto @6xl:py-0">
    <Button
      variant="outline"
      size="sm"
      class="h-7 flex-1"
      disabled={busy !== null}
      onclick={() => decide('restocked')}
    >
      {#if busy === 'restocked'}<Spinner />{/if}
      {t('orders.inspectionStockBack')}
    </Button>
    <Button
      variant="outline"
      size="sm"
      class="h-7 flex-1 border-amber-500/40 text-amber-600 hover:text-amber-600 dark:text-amber-400"
      disabled={busy !== null}
      onclick={() => decide('attention')}
    >
      {#if busy === 'attention'}<Spinner />{/if}
      {t('orders.inspectionAttention')}
    </Button>
  </div>
</div>
