<!-- Records money that arrived outside the gateway; the order moves to paid. -->
<script lang="ts">
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
  import { api } from '~/lib/api';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import { fieldLabelKey } from '~/lib/orders/manual-order';
  import type { OrderDetail } from '~/lib/orders/types';
  import { ApiError, errorMessage, unwrap } from '~/lib/request';
  import { type MessageKey, t } from '~/lib/ui-text';

  interface Props {
    order: OrderDetail;
    open: boolean;
    onClose: () => void;
    onUpdated: (order: OrderDetail) => void;
  }

  let { order, open, onClose, onUpdated }: Props = $props();

  type Method = 'bank_transfer' | 'cash' | 'card_pos';
  const METHODS: { value: Method; labelKey: MessageKey }[] = [
    { value: 'bank_transfer', labelKey: 'newOrder.methodBankTransfer' },
    { value: 'cash', labelKey: 'newOrder.methodCash' },
    { value: 'card_pos', labelKey: 'newOrder.methodCardPos' },
  ];

  let method = $state<Method>('bank_transfer');
  let reference = $state('');
  let problem = $state('');
  let saving = $state(false);

  /** The server's refusal names what is missing; say it here, at the dialog's own control. */
  function explain(err: unknown): string {
    if (!(err instanceof ApiError)) return errorMessage(err);
    const keys = Object.keys(err.fields);
    if (keys.length === 0) return err.message;
    const names = keys.map((key) => {
      const label = fieldLabelKey(key);
      return label ? t(label) : key;
    });
    return `${err.message} ${names.join(', ')}`;
  }

  async function submit() {
    saving = true;
    problem = '';
    try {
      const updated = await unwrap<OrderDetail>(
        await api.api.admin.orders[':id']['record-payment'].$post({
          param: { id: order.id },
          json: { method, ...(reference.trim() ? { reference: reference.trim() } : {}) },
        }),
      );
      onUpdated(updated);
      toast.success(t('newOrder.paymentRecorded', { number: order.number }));
      onClose();
    } catch (err) {
      problem = explain(err);
      document.getElementById('payment-reference')?.focus();
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
      <Dialog.Title>{t('newOrder.paymentTitle', { number: order.number })}</Dialog.Title>
    </Dialog.Header>
    <form
      class="space-y-4"
      onsubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <RadioGroup.Root bind:value={method} class="gap-2">
        {#each METHODS as entry (entry.value)}
          <Label
            for="payment-method-{entry.value}"
            class="flex cursor-pointer items-center gap-3 rounded-md border p-3 has-[[data-state=checked]]:border-primary"
          >
            <RadioGroup.Item value={entry.value} id="payment-method-{entry.value}" />
            <span class="font-medium">{t(entry.labelKey)}</span>
          </Label>
        {/each}
      </RadioGroup.Root>

      <div>
        <Label class="mb-1.5" for="payment-reference">{t('newOrder.paymentReference')}</Label>
        <Input
          id="payment-reference"
          bind:value={reference}
          maxlength={200}
          aria-invalid={problem ? 'true' : undefined}
        />
        {#if problem}
          <p class="mt-1 text-xs text-destructive" role="alert">{problem}</p>
        {/if}
      </div>

      <Dialog.Footer>
        <Button type="button" variant="ghost" disabled={saving} onclick={onClose}>
          {t('common.back')}
        </Button>
        <BusyButton type="submit" busy={saving}>{t('newOrder.paymentRecord')}</BusyButton>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
