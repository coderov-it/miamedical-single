<!--
  The rental's extensions: the open one with the next step it needs, and every
  earlier one beneath it. Lifecycle: docs/code/rental-extensions.md.

    Awaiting payment   → Record payment (sends the contract, or activates it when the
                         customer already signed in their account) · Cancel
    Awaiting signature → Resend from the Contract card · Reissue if voided · Cancel
    Extended           → history only
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import CalendarPlusIcon from '@lucide/svelte/icons/calendar-plus';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import { formatDate, formatMoney } from '~/lib/format';
  import ExtendDialog from '~/lib/rentals/extend-dialog.svelte';
  import ExtensionCancelDialog from '~/lib/rentals/extension-cancel-dialog.svelte';
  import ExtensionPaymentDialog from '~/lib/rentals/extension-payment-dialog.svelte';
  import { extensionStatusMeta, paymentMethodLabel } from '~/lib/rentals/extension-status';
  import { errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { contractStatusMeta } from '~/lib/contracts/status';
  import { session } from '~/lib/session.svelte';
  import { type MessageKey, t, tn } from '~/lib/ui-text';

  type Overview = InferResponseType<
    (typeof api.api.admin)['rental-extensions']['by-order'][':orderId']['$get'],
    200
  >['data'];
  type Extension = Overview['history'][number];

  interface Props {
    orderId: string;
    orderNumber: string;
    /** Something on the order changed — reload its timeline and contracts. */
    onChanged: () => void;
  }

  let { orderId, orderNumber, onChanged }: Props = $props();

  const overview = new Resource(
    () => orderId,
    async (id, signal) =>
      unwrap<Overview>(
        await api.api.admin['rental-extensions']['by-order'][':orderId'].$get(
          { param: { orderId: id }, query: {} },
          { init: { signal } },
        ),
      ),
    { enabled: () => session.can(P.RENTAL_READ) },
  );

  const canUpdate = $derived(session.can(P.RENTAL_UPDATE));
  const open = $derived(overview.data?.open ?? null);
  const past = $derived(overview.data?.history.filter((row) => row.id !== open?.id) ?? []);

  let extendTarget = $state<{ orderId: string; orderNumber: string } | undefined>(undefined);
  let payTarget = $state<Extension | undefined>(undefined);
  let cancelTarget = $state<Extension | undefined>(undefined);
  let reissuing = $state(false);

  function changed() {
    overview.refresh();
    onChanged();
  }

  async function reissue(extension: Extension) {
    reissuing = true;
    try {
      await unwrap(
        await api.api.admin['rental-extensions'][':id'].contract.$post({
          param: { id: extension.id },
        }),
      );
      toast.success(t('orders.extReissued'));
      changed();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      reissuing = false;
    }
  }

  const BLOCK_NOTES: Record<string, MessageKey> = {
    closed: 'orders.extBlockClosed',
    hourly: 'orders.extBlockHourly',
  };
</script>

{#snippet period(extension: Extension)}
  {formatDate(extension.fromDate)} → {formatDate(extension.toDate)}
  <span class="text-muted-foreground">· {tn('orders.extDays', extension.days)} ·</span>
  {formatMoney(extension.amount, extension.currency)}
{/snippet}

<Card.Root class="gap-0 py-0">
  <div class="flex items-center justify-between border-b px-4 py-2 text-sm font-medium">
    {t('orders.extTitle')}
    {#if canUpdate && overview.data?.blockedBy === null}
      <Button size="sm" variant="outline" onclick={() => (extendTarget = { orderId, orderNumber })}>
        <CalendarPlusIcon class="size-4" />
        {t('orders.extExtend')}
      </Button>
    {/if}
  </div>
  <div class="space-y-3 p-4 text-sm">
    {#if overview.loading && !overview.data}
      <Skeleton class="h-5 w-40 rounded-full" />
    {:else if overview.data}
      {#if open}
        {@const meta = extensionStatusMeta(open.status)}
        <div class="space-y-2 rounded-md border p-3">
          <Badge variant="outline" class={meta.tone}>
            <span class={cn('size-1.5 rounded-full', meta.dot)}></span>
            {meta.label}
          </Badge>
          <p>{@render period(open)}</p>
          <p class="text-xs text-muted-foreground">
            {t('orders.extRequestedBy', {
              name: open.requestedBy ?? t('orders.extUnknown'),
              date: formatDate(open.createdAt),
            })}
            {#if open.paidAt}
              · {t('orders.extPaid', {
                date: formatDate(open.paidAt),
                method: paymentMethodLabel(open.paymentMethod),
              })}
            {/if}
            {#if open.contractNumber}
              · {t('orders.extContractWithStatus', {
                number: open.contractNumber,
                status: contractStatusMeta(open.contractStatus ?? '').label,
              })}
            {/if}
          </p>
          {#if canUpdate}
            <div class="flex flex-wrap gap-2 pt-1">
              {#if open.status === 'renew_pending'}
                <Button size="sm" onclick={() => (payTarget = open)}>
                  {t('orders.extRecordPayment')}
                </Button>
              {/if}
              {#if open.status === 'awaiting_signature' && (!open.contractId || open.contractStatus === 'voided')}
                <BusyButton
                  size="sm"
                  busy={reissuing}
                  busyLabel={t('orders.extSending')}
                  onclick={() => reissue(open)}
                >
                  {t('orders.extReissue')}
                </BusyButton>
              {/if}
              <Button size="sm" variant="destructive" onclick={() => (cancelTarget = open)}>
                {t('common.cancel')}
              </Button>
            </div>
          {/if}
        </div>
      {:else if overview.data.blockedBy && BLOCK_NOTES[overview.data.blockedBy]}
        <p class="text-muted-foreground">{t(BLOCK_NOTES[overview.data.blockedBy]!)}</p>
      {:else if past.length === 0}
        <p class="text-muted-foreground">
          {t('orders.extDueBack', { date: formatDate(overview.data.endDate) })}
        </p>
      {/if}

      {#if past.length > 0}
        <ul class="space-y-1.5">
          {#each past as extension (extension.id)}
            {@const meta = extensionStatusMeta(extension.status)}
            <li class="flex items-start gap-2">
              <span class={cn('mt-1.5 size-1.5 shrink-0 rounded-full', meta.dot)}></span>
              <span>
                {@render period(extension)}
                <span class="block text-xs text-muted-foreground">
                  {meta.label}{#if extension.contractNumber}
                    · {t('orders.extContractNumber', { number: extension.contractNumber })}{/if}
                  {#if extension.cancelReason}
                    · {extension.cancelReason}{/if}
                </span>
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>
</Card.Root>

<ExtendDialog target={extendTarget} onClose={() => (extendTarget = undefined)} onDone={changed} />
<ExtensionPaymentDialog
  target={payTarget}
  onClose={() => (payTarget = undefined)}
  onDone={changed}
/>
<ExtensionCancelDialog
  target={cancelTarget}
  onClose={() => (cancelTarget = undefined)}
  onDone={changed}
/>
