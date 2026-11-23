<!--
  The moves this order may make next, straight from the server's
  `allowedStatuses` — nothing here knows the machine.

  Blocked actions stay *visible*, disabled, with the missing permission named:
  hiding a button teaches nobody the order in which work happens.

  A missed attempt cannot be recorded without a reason. The click checks, marks
  the note, moves focus there and sends nothing (see `form-gate.ts`).
-->
<script lang="ts">
  import { P, permissionByCode } from '@mia/permissions';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { toast } from 'svelte-sonner';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import DateField from '~/lib/components/date-field.svelte';
  import { focusFirstIssue, type GateField } from '~/lib/form-gate';
  import {
    DESTRUCTIVE,
    localToday,
    moveLabelKey,
    NEEDS_NOTE,
    primaryMove,
  } from '~/lib/orders/order-actions';
  import OrderRefundAllConfirm from '~/lib/orders/order-refund-all-confirm.svelte';
  import { orderStatusMeta, type OrderStatus } from '~/lib/orders/status';
  import type { OrderDetail } from '~/lib/orders/types';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';

  interface Props {
    order: OrderDetail;
    /** Hand back the refreshed order so the list and the drawer stay in step. */
    onUpdated: (order: OrderDetail) => void;
  }

  let { order, onUpdated }: Props = $props();

  const canUpdate = $derived(session.can(P.ORDER_UPDATE));
  const updateKey = permissionByCode(P.ORDER_UPDATE)?.key ?? 'order:update';

  const NOTE_ID = 'order-action-note';
  const DATE_ID = 'order-action-delivered-on';
  const FIELD_ORDER: GateField[] = [
    { key: 'note', id: NOTE_ID },
    { key: 'deliveredOn', id: DATE_ID },
  ];

  const today = localToday();
  let busy = $state<string | null>(null);
  let note = $state('');
  let deliveredOn = $state(localToday());
  let fields = $state<Record<string, string>>({});
  let confirmRefundAll = $state(false);

  const status = $derived(order.status as OrderStatus);
  const primary = $derived(primaryMove(order.allowedStatuses));
  const decidedUnits = $derived(
    order.returnUnits.reduce((sum, line) => sum + line.decisions.length, 0),
  );
  const totalUnits = $derived(order.returnUnits.reduce((sum, line) => sum + line.quantity, 0));
  const asksDate = $derived(order.allowedStatuses.includes('delivered'));

  function variantFor(to: string): 'default' | 'outline' {
    return to === primary ? 'default' : 'outline';
  }

  function fail(issues: Record<string, string>) {
    fields = issues;
    focusFirstIssue(issues, FIELD_ORDER);
  }

  /** Returns whether the click may go on to the server. */
  function check(to: string): boolean {
    const issues: Record<string, string> = {};
    if (NEEDS_NOTE.includes(to) && !note.trim()) issues.note = t('orders.actionsNoteRequired');
    if (to === 'delivered' && (!deliveredOn || deliveredOn > today)) {
      issues.deliveredOn = t('orders.deliveredOnInvalid');
    }
    if (Object.keys(issues).length === 0) return true;
    fail(issues);
    return false;
  }

  /** `refunded` moves money, so it asks first; every other move goes straight through. */
  function requestMove(to: OrderStatus) {
    if (!check(to)) return;
    if (to === 'refunded') {
      confirmRefundAll = true;
      return;
    }
    void moveStatus(to);
  }

  async function moveStatus(to: OrderStatus) {
    busy = `status:${to}`;
    fields = {};
    try {
      const updated = await unwrap<OrderDetail>(
        await api.api.admin.orders[':id'].status.$post({
          param: { id: order.id },
          json: {
            to,
            ...(note.trim() ? { note: note.trim() } : {}),
            ...(to === 'delivered' ? { deliveredOn } : {}),
          },
        }),
      );
      note = '';
      onUpdated(updated);
      toast.success(
        t('orders.statusChanged', {
          number: updated.number,
          status: orderStatusMeta(updated.status).label,
        }),
      );
    } catch (err) {
      // The server's 409 explains what *would* work; show it verbatim.
      const issues = errorFields(err);
      if (Object.keys(issues).length > 0) fail(issues);
      else toast.error(errorMessage(err));
    } finally {
      busy = null;
    }
  }
</script>

<Card.Root class="gap-0 py-0">
  <div class="flex items-center gap-2 border-b px-4 py-2.5">
    <span class="text-sm font-medium">{t('orders.actionsTitle')}</span>
    {#if !canUpdate}
      <Badge variant="outline" class="gap-1 text-muted-foreground">
        <LockIcon class="size-3" />
        {t('orders.actionsNeeds')} <code class="font-mono">{updateKey}</code>
      </Badge>
    {/if}
  </div>

  <div class="space-y-3 p-4">
    {#if status === 'received'}
      <p class="text-sm text-muted-foreground">
        {t('orders.actionsWaitingReturnCheck', { decided: decidedUnits, total: totalUnits })}
      </p>
      <Button variant="outline" size="sm" href={routes.returns}>
        {t('orders.actionsOpenReturnCheck')}
      </Button>
    {:else if order.allowedStatuses.length === 0}
      <p class="text-sm text-muted-foreground">
        {t('orders.actionsNothingLeft', { status: orderStatusMeta(order.status).label })}
      </p>
    {:else}
      <div>
        <Textarea
          id={NOTE_ID}
          bind:value={note}
          rows={2}
          disabled={!canUpdate}
          placeholder={t('orders.actionsNotePlaceholder')}
          aria-label={t('orders.actionsNoteLabel')}
          aria-invalid={fields.note ? 'true' : undefined}
        />
        {#if fields.note}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.note}</p>
        {/if}
      </div>

      {#if asksDate}
        <div class="max-w-48">
          <Label class="mb-1.5" for={DATE_ID}>{t('orders.deliveredOn')}</Label>
          <DateField
            id={DATE_ID}
            bind:value={deliveredOn}
            max={today}
            invalid={Boolean(fields.deliveredOn)}
          />
          {#if fields.deliveredOn}
            <p class="mt-1 text-xs text-destructive" role="alert">{fields.deliveredOn}</p>
          {/if}
        </div>
      {/if}

      <div class="flex flex-wrap items-center gap-2">
        {#each order.allowedStatuses as to (to)}
          <Button
            variant={variantFor(to)}
            size="sm"
            class={cn(
              DESTRUCTIVE.includes(to) &&
                'border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive',
            )}
            disabled={!canUpdate || busy !== null}
            onclick={() => requestMove(to as OrderStatus)}
          >
            {#if busy === `status:${to}`}<Spinner />{/if}
            {t(moveLabelKey(status, to), { status: orderStatusMeta(to).label })}
          </Button>
        {/each}
      </div>
    {/if}
  </div>
</Card.Root>

<OrderRefundAllConfirm
  {order}
  open={confirmRefundAll}
  onClose={() => (confirmRefundAll = false)}
  onConfirm={() => void moveStatus('refunded')}
/>
