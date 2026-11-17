<!--
  Records a refund against an order's net value. The amount is capped by the
  server (net total), which answers an over-refund with `fields.amount`; the
  optional extension ties the refund to one paid extension on the history.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { api } from '~/lib/api';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { focusFirstIssue } from '~/lib/form-gate';
  import { formatDate, formatMoney } from '~/lib/format';
  import { parseMoney } from '~/lib/money';
  import type { OrderDetail } from '~/lib/orders/types';
  import { ApiError, errorFields, errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';

  interface Props {
    order: OrderDetail;
    open: boolean;
    onClose: () => void;
    onUpdated: (order: OrderDetail) => void;
  }

  let { order, open, onClose, onUpdated }: Props = $props();

  const WHOLE_ORDER = '';

  const hasRental = $derived(
    order.items.some((item) => item.configuration?.pricingMode === 'rental'),
  );

  let amount = $state('');
  let reason = $state('');
  let extensionId = $state(WHOLE_ORDER);
  let fields = $state<Record<string, string>>({});
  let saving = $state(false);

  // Only the paid ones can be refunded individually; they come from the same
  // endpoint the extensions card reads.
  const extensions = new Resource(
    () => order.id,
    async (id, signal) =>
      unwrap<{
        history: { id: string; fromDate: string; toDate: string; paidAt: string | null }[];
      }>(
        await api.api.admin['rental-extensions']['by-order'][':orderId'].$get(
          { param: { orderId: id }, query: {} },
          { init: { signal } },
        ),
      ),
    { enabled: () => open && hasRental && session.can(P.RENTAL_READ) },
  );
  const paidExtensions = $derived(extensions.data?.history.filter((row) => row.paidAt) ?? []);

  function extensionLabel(row: { fromDate: string; toDate: string }): string {
    return `${formatDate(row.fromDate)} – ${formatDate(row.toDate)}`;
  }

  const chosenLabel = $derived.by(() => {
    const row = paidExtensions.find((entry) => entry.id === extensionId);
    if (!row) return t('orders.refundWholeOrder');
    return extensionLabel(row);
  });

  $effect(() => {
    if (!open) return;
    amount = '';
    reason = '';
    extensionId = WHOLE_ORDER;
    fields = {};
  });

  async function submit() {
    const parsed = parseMoney(amount);
    const issues: Record<string, string> = {};
    const net = order.netTotal;
    if (parsed === null || Number(parsed) <= 0) {
      issues.amount = t('orders.refundErrorAmount');
    } else if (Math.round(Number(parsed) * 100) > Math.round(Number(net) * 100)) {
      issues.amount = t('orders.refundErrorMax', { max: formatMoney(net, order.totals.currency) });
    }
    const trimmed = reason.trim();
    if (trimmed.length < 3 || trimmed.length > 500) issues.reason = t('orders.refundErrorReason');
    if (Object.keys(issues).length > 0 || parsed === null) {
      fields = issues;
      focusFirstIssue(issues, [
        { key: 'amount', id: 'refund-amount' },
        { key: 'reason', id: 'refund-reason' },
      ]);
      return;
    }

    saving = true;
    try {
      const updated = await unwrap<OrderDetail>(
        await api.api.admin.orders[':id'].refunds.$post({
          param: { id: order.id },
          json: {
            amount: parsed,
            reason: trimmed,
            ...(extensionId ? { rentalExtensionId: extensionId } : {}),
          },
        }),
      );
      onUpdated(updated);
      toast.success(
        t('orders.refundToast', { amount: formatMoney(parsed, order.totals.currency) }),
      );
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error(err.message);
        await reload();
        return;
      }
      fields = errorFields(err);
      if (Object.keys(fields).length === 0) toast.error(errorMessage(err));
      focusFirstIssue(fields, [
        { key: 'amount', id: 'refund-amount' },
        { key: 'rentalExtensionId', id: 'refund-extension' },
        { key: 'reason', id: 'refund-reason' },
      ]);
    } finally {
      saving = false;
    }
  }

  /** The order changed under us: show its current state rather than the stale one. */
  async function reload() {
    try {
      onUpdated(
        await unwrap<OrderDetail>(
          await api.api.admin.orders[':id'].$get({ param: { id: order.id } }),
        ),
      );
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }
</script>

<Dialog.Root
  {open}
  onOpenChange={(next) => {
    if (!next && !saving) onClose();
  }}
>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{t('orders.refundDialogTitle', { number: order.number })}</Dialog.Title>
    </Dialog.Header>
    <form
      class="space-y-4"
      onsubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <MoneyInput
        id="refund-amount"
        label={t('orders.refundAmount')}
        suffix={order.totals.currency}
        error={fields.amount}
        bind:value={amount}
      >
        {#snippet labelSuffix()}
          <span class="text-xs text-muted-foreground tabular-nums">
            {t('orders.refundMax', { max: formatMoney(order.netTotal, order.totals.currency) })}
          </span>
        {/snippet}
      </MoneyInput>

      {#if paidExtensions.length > 0}
        <div>
          <Label class="mb-1.5" for="refund-extension">{t('orders.refundExtension')}</Label>
          <Select.Root type="single" bind:value={extensionId}>
            <Select.Trigger id="refund-extension" class="w-full">{chosenLabel}</Select.Trigger>
            <Select.Content>
              <Select.Item value={WHOLE_ORDER}>{t('orders.refundWholeOrder')}</Select.Item>
              {#each paidExtensions as row (row.id)}
                <Select.Item value={row.id}>{extensionLabel(row)}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if fields.rentalExtensionId}
            <p class="mt-1 text-xs text-destructive" role="alert">{fields.rentalExtensionId}</p>
          {/if}
        </div>
      {/if}

      <div>
        <Label class="mb-1.5" for="refund-reason">{t('orders.refundReason')}</Label>
        <Textarea
          id="refund-reason"
          bind:value={reason}
          maxlength={500}
          aria-invalid={fields.reason ? 'true' : undefined}
        />
        {#if fields.reason}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.reason}</p>
        {/if}
      </div>

      <Dialog.Footer>
        <Button type="button" variant="ghost" disabled={saving} onclick={onClose}>
          {t('common.back')}
        </Button>
        <BusyButton type="submit" busy={saving} busyLabel={t('orders.refundSaving')}>
          {t('orders.refundRecord')}
        </BusyButton>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
