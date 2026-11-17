<!-- Sets or clears the order-level discount of a pending manual order. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { api } from '~/lib/api';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { focusFirstIssue } from '~/lib/form-gate';
  import type { OrderDetail } from '~/lib/orders/types';
  import { ApiError, errorFields, errorMessage, unwrap } from '~/lib/request';
  import { t } from '~/lib/ui-text';

  interface Props {
    order: OrderDetail;
    open: boolean;
    onClose: () => void;
    onUpdated: (order: OrderDetail) => void;
  }

  let { order, open, onClose, onUpdated }: Props = $props();

  // Mounted fresh on each opening, so the starting values are read once on purpose.
  let amount = $state(untrack(() => order.totals.discountTotal));
  let reason = $state(untrack(() => order.discountReason ?? ''));
  let fields = $state<Record<string, string>>({});
  let saving = $state(false);

  const FOCUS = [
    { key: 'amount', id: 'discount-amount' },
    { key: 'reason', id: 'discount-reason' },
  ];

  async function submit() {
    const issues: Record<string, string> = {};
    if (amount !== '0.00' && reason.trim() === '') issues.reason = t('newOrder.errorReason');
    if (Object.keys(issues).length > 0) {
      fields = issues;
      focusFirstIssue(issues, FOCUS);
      return;
    }
    saving = true;
    try {
      const updated = await unwrap<OrderDetail>(
        await api.api.admin.orders[':id'].discount.$post({
          param: { id: order.id },
          json: { amount, reason: reason.trim() },
        }),
      );
      onUpdated(updated);
      toast.success(t('newOrder.discountSaved'));
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error(err.message);
        return;
      }
      fields = errorFields(err);
      if (Object.keys(fields).length === 0) toast.error(errorMessage(err));
      focusFirstIssue(fields, FOCUS);
    } finally {
      saving = false;
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
      <Dialog.Title>{t('newOrder.discountDialogTitle', { number: order.number })}</Dialog.Title>
    </Dialog.Header>
    <form
      class="space-y-4"
      onsubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <MoneyInput
        id="discount-amount"
        label={t('newOrder.discountAmount')}
        suffix={order.totals.currency}
        error={fields.amount}
        bind:value={amount}
      />
      <div>
        <Label class="mb-1.5" for="discount-reason">{t('newOrder.discountReason')}</Label>
        <Input
          id="discount-reason"
          bind:value={reason}
          maxlength={300}
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
        <BusyButton type="submit" busy={saving}>{t('newOrder.discountSave')}</BusyButton>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
