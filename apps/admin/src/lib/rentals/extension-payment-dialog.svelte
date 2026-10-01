<!--
  Records that an extension was paid — the manual stand-in until online payment
  exists. Saving also emails the renewal contract, which is why the button says so.
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
  import { PAYMENT_METHOD_LABELS } from './extension-status';

  interface Props {
    target: { id: string; amount: string; currency: string; days: number } | undefined;
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
    if (!method) issues.method = 'Pick how the customer paid.';
    if (!amount || Number(amount) <= 0) issues.amount = 'Enter the amount received.';
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
      toast.success('Payment recorded — the renewal contract is out for signature.');
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
      <Dialog.Title>Record payment</Dialog.Title>
      <Dialog.Description>
        Extension of {target?.days} days. Saving emails the customer the contract to sign.
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
        <Label class="mb-1.5" for="payment-method">Method</Label>
        <Select.Root type="single" bind:value={method}>
          <Select.Trigger
            id="payment-method"
            class="w-full"
            aria-invalid={fields.method ? 'true' : undefined}
          >
            {method ? PAYMENT_METHOD_LABELS[method] : 'Choose…'}
          </Select.Trigger>
          <Select.Content>
            {#each EXTENSION_PAYMENT_METHODS as option (option)}
              <Select.Item value={option}>{PAYMENT_METHOD_LABELS[option]}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        {#if fields.method}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.method}</p>
        {/if}
      </div>

      <MoneyInput
        id="payment-amount"
        label="Amount received"
        bind:value={amount}
        suffix={target?.currency ?? 'EUR'}
        error={fields.amount}
      />

      <div>
        <Label class="mb-1.5" for="payment-reference">
          Reference <span class="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input id="payment-reference" bind:value={reference} maxlength={120} />
      </div>

      <Dialog.Footer>
        <Button type="button" variant="ghost" disabled={saving} onclick={onClose}>Cancel</Button>
        <BusyButton type="submit" busy={saving} busyLabel="Saving…">
          Record & send contract
        </BusyButton>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
