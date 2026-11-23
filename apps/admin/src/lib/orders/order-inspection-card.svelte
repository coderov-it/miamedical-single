<!--
  Returned units: once the order is `received`, each physical unit is decided
  on its own, because one bed may be fit to rent again and the other not.
  "Needs attention" cannot be recorded without saying what is wrong, so that
  click marks the unit's note and sends nothing.
-->
<script lang="ts">
  import { P, permissionByCode } from '@mia/permissions';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { toast } from 'svelte-sonner';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import { focusFirstIssue } from '~/lib/form-gate';
  import { formatDateTime } from '~/lib/format';
  import { inspectionMeta, unitRows, type UnitRow } from '~/lib/orders/inspection';
  import type { OrderDetail } from '~/lib/orders/types';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';

  interface Props {
    order: OrderDetail;
    onUpdated: (order: OrderDetail) => void;
  }

  let { order, onUpdated }: Props = $props();

  const canUpdate = $derived(session.can(P.ORDER_UPDATE));
  const updateKey = permissionByCode(P.ORDER_UPDATE)?.key ?? 'order:update';

  const rows = $derived(unitRows(order.returnUnits));
  const decided = $derived(rows.filter((row) => row.decision).length);
  const open = $derived(order.status === 'received');
  const hasOpenAttention = $derived(
    rows.some((row) => row.decision?.outcome === 'attention' && !row.decision.resolution),
  );

  let notes = $state<Record<string, string>>({});
  let errors = $state<Record<string, string>>({});
  let busy = $state<string | null>(null);

  const noteId = (row: UnitRow) => `inspection-note-${row.key}`;

  async function decide(row: UnitRow, outcome: 'restocked' | 'attention') {
    const note = (notes[row.key] ?? '').trim();
    if (outcome === 'attention' && !note) {
      errors = { ...errors, [row.key]: t('orders.inspectionNoteRequired') };
      focusFirstIssue({ note: 'x' }, [{ key: 'note', id: noteId(row) }]);
      return;
    }
    busy = `${row.key}:${outcome}`;
    errors = { ...errors, [row.key]: '' };
    try {
      const updated = await unwrap<OrderDetail>(
        await api.api.admin.orders[':id'].inspections.$post({
          param: { id: order.id },
          json: { orderItemId: row.orderItemId, outcome, ...(note ? { note } : {}) },
        }),
      );
      onUpdated(updated);
      const closed = updated.status === 'fulfilled';
      toast.success(
        t(closed ? 'orders.inspectionClosed' : 'orders.inspectionSaved', {
          number: updated.number,
        }),
      );
    } catch (err) {
      const message = errorFields(err).note;
      if (message) {
        errors = { ...errors, [row.key]: message };
        focusFirstIssue({ note: message }, [{ key: 'note', id: noteId(row) }]);
      } else {
        toast.error(errorMessage(err));
      }
    } finally {
      busy = null;
    }
  }
</script>

<Card.Root class="gap-0 py-0">
  <div class="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
    <span class="text-sm font-medium">{t('orders.inspectionTitle')}</span>
    <span class="text-sm text-muted-foreground">
      {t('orders.inspectionProgress', { decided, total: rows.length })}
    </span>
    {#if open && !canUpdate}
      <Badge variant="outline" class="gap-1 text-muted-foreground">
        <LockIcon class="size-3" />
        {t('orders.actionsNeeds')} <code class="font-mono">{updateKey}</code>
      </Badge>
    {/if}
  </div>

  <ul class="divide-y">
    {#each rows as row (row.key)}
      {@const decision = row.decision}
      <li class="space-y-2 px-4 py-3">
        <p class="text-sm font-medium">
          {row.productTitle} <span class="text-muted-foreground">#{row.number}</span>
        </p>

        {#if decision}
          {@const outcome = inspectionMeta(decision.outcome)}
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="outline" class={outcome.tone}>
              <span class={cn('size-1.5 rounded-full', outcome.dot)}></span>
              {outcome.label}
            </Badge>
            {#if decision.resolution}
              {@const resolved = inspectionMeta(decision.resolution)}
              <span class="text-muted-foreground">→</span>
              <Badge variant="outline" class={resolved.tone}>
                <span class={cn('size-1.5 rounded-full', resolved.dot)}></span>
                {resolved.label}
              </Badge>
            {/if}
            <span class="text-xs text-muted-foreground">{formatDateTime(decision.inspectedAt)}</span
            >
          </div>
          {#if decision.note}
            <p class="text-sm text-muted-foreground">{decision.note}</p>
          {/if}
          {#if decision.resolutionNote}
            <p class="text-sm text-muted-foreground">{decision.resolutionNote}</p>
          {/if}
        {:else if open}
          <div class="flex flex-wrap items-start gap-2">
            <div class="min-w-48 flex-1">
              <Input
                id={noteId(row)}
                bind:value={notes[row.key]}
                disabled={!canUpdate}
                placeholder={t('orders.inspectionNotePlaceholder')}
                aria-label={t('orders.inspectionNoteLabel', {
                  unit: `${row.productTitle} #${row.number}`,
                })}
                aria-invalid={errors[row.key] ? 'true' : undefined}
              />
              {#if errors[row.key]}
                <p class="mt-1 text-xs text-destructive" role="alert">{errors[row.key]}</p>
              {/if}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!canUpdate || busy !== null}
              onclick={() => decide(row, 'restocked')}
            >
              {#if busy === `${row.key}:restocked`}<Spinner />{/if}
              {t('orders.inspectionStockBack')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="border-amber-500/40 text-amber-600 hover:text-amber-600 dark:text-amber-400"
              disabled={!canUpdate || busy !== null}
              onclick={() => decide(row, 'attention')}
            >
              {#if busy === `${row.key}:attention`}<Spinner />{/if}
              {t('orders.inspectionAttention')}
            </Button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>

  {#if hasOpenAttention}
    <div class="border-t px-4 py-2.5 text-sm">
      <a href={routes.returnsAttention} class="text-primary hover:underline">
        {t('orders.inspectionAttentionLink')}
      </a>
    </div>
  {/if}
</Card.Root>
