<!--
  Records that an extension was paid — the manual stand-in until online payment
  exists. What saving does next depends on the contract:

    raised by an operator       no contract yet → saving emails it for signature
    renewed from the account    already signed  → saving activates the extension;
                                the amount is the one signed for, so it is not editable
-->
<script lang="ts">
  import { EXTENSION_PAYMENT_METHODS, type ExtensionPaymentMethod } from '@mia/validators';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { api } from '~/lib/api';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { focusFirstIssue, type GateField } from '~/lib/form-gate';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { t, tn } from '~/lib/ui-text';
  import { paymentMethodLabel } from './extension-status';

  interface Props {
    target:
      | {
          id: string;
          amount: string;
          currency: string;
          days: number;
          contractNumber: string | null;
          contractStatus: string | null;
        }
      | undefined;
    onClose: () => void;
    onDone: () => void;
  }

  let { target, onClose, onDone }: Props = $props();

  let method = $state<ExtensionPaymentMethod | ''>('');
  let reference = $state('');
  let amount = $state('');
  let saving = $state(false);
  let fields = $state<Record<string, string>>({});
  let seededFor = $state<string | undefined>(undefined);

  const signed = $derived(target?.contractStatus === 'signed');

  $effect(() => {
    if (target?.id === seededFor) return;
    seededFor = target?.id;
    method = '';
    reference = '';
    amount = target?.amount ?? '';
    fields = {};
  });

  const GATE: readonly GateField[] = [
    { key: 'method', id: 'payment-method' },
    { key: 'amount', id: 'payment-amount' },
  ];

  async function submit() {
    const current = target;
    if (!current) return;

    const issues: Record<string, string> = {};
    if (!method) issues.method = t('rentals.payErrorMethod');
    if (!amount || Number(amount) <= 0) issues.amount = t('rentals.payErrorAmount');
    fields = issues;
    if (Object.keys(issues).length > 0 || !method) {
      focusFirstIssue(issues, GATE);
      return;
    }

    saving = true;
    try {
      await unwrap(
        await api.api.admin['rental-extensions'][':id'].payment.$post({
          param: { id: current.id },
          json: {
            method,
            amount,
            ...(reference.trim() ? { reference: reference.trim() } : {}),
          },
        }),
      );
      if (signed) toast.success(t('rentals.toastPaidActive'));
      else toast.success(t('rentals.toastPaidSent'));
      onDone();
      onClose();
    } catch (err) {
      fields = errorFields(err);
      toast.error(errorMessage(err));
    } finally {
      saving = false;
    }
  }
</script>

<Dialog.Root
  open={target !== undefined}
  onOpenChange={(next) => {
    if (!next && !saving) onClose();
  }}
>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{t('rentals.payTitle')}</Dialog.Title>
      <Dialog.Description>
        {#if signed}
          {tn('rentals.payDescriptionSigned', target?.days ?? 0, {
            number: target?.contractNumber ?? '',
          })}
        {:else}
          {tn('rentals.payDescriptionPending', target?.days ?? 0)}
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    <form
      class="space-y-4"
      onsubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div>
        <Label class="mb-1.5" for="payment-method">{t('rentals.payMethod')}</Label>
        <Select.Root type="single" bind:value={method}>
          <Select.Trigger
            id="payment-method"
            class="w-full"
            aria-invalid={fields.method ? 'true' : undefined}
          >
            {method ? paymentMethodLabel(method) : t('rentals.payChoose')}
          </Select.Trigger>
          <Select.Content>
            {#each EXTENSION_PAYMENT_METHODS as option (option)}
              <Select.Item value={option}>{paymentMethodLabel(option)}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        {#if fields.method}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.method}</p>
        {/if}
      </div>

      {#if signed}
        <p class="text-sm">
          {t('rentals.payAmountLine')}
          <span class="font-medium tabular-nums">{target?.amount} {target?.currency}</span>
        </p>
      {:else}
        <MoneyInput
          id="payment-amount"
          label={t('rentals.payAmountReceived')}
          bind:value={amount}
          suffix={target?.currency ?? 'EUR'}
          error={fields.amount}
        />
      {/if}

      <div>
        <Label class="mb-1.5" for="payment-reference">
          {t('rentals.payReference')}
          <span class="font-normal text-muted-foreground">{t('rentals.payOptional')}</span>
        </Label>
        <Input id="payment-reference" bind:value={reference} maxlength={120} />
      </div>

      <Dialog.Footer>
        <Button type="button" variant="destructive" disabled={saving} onclick={onClose}>
          {t('common.cancel')}
        </Button>
        <BusyButton type="submit" busy={saving} busyLabel={t('common.saving')}>
          {signed ? t('rentals.payRecordActivate') : t('rentals.payRecordSend')}
        </BusyButton>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
