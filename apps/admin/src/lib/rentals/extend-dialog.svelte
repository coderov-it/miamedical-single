<!--
  Opens an extension for a rental, on the customer's behalf. Same request the
  customer makes from their order page: it lands as "Awaiting payment", and the
  contract goes out only once the payment is recorded.

  The offered lengths are the packages every rented product shares. "Other
  length" is the operator's escape hatch — any number of days at an agreed
  amount — and the only way to extend when no package matches.
-->
<script lang="ts">
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
  import { api } from '~/lib/api';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import LoadingState from '~/lib/components/loading-state.svelte';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { focusFirstIssue, type GateField } from '~/lib/form-gate';
  import { formatDate, formatMoney } from '~/lib/format';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';

  type Overview = InferResponseType<
    (typeof api.api.admin)['rental-extensions']['by-order'][':orderId']['$get'],
    200
  >['data'];

  interface Props {
    /** The order to extend, or `undefined` when closed. */
    target: { orderId: string; orderNumber: string } | undefined;
    onClose: () => void;
    onDone: () => void;
  }

  let { target, onClose, onDone }: Props = $props();

  const CUSTOM = 'custom';

  let overview = $state<Overview | null>(null);
  let loading = $state(false);
  let choice = $state('');
  let customDays = $state('');
  let amount = $state('');
  let saving = $state(false);
  let fields = $state<Record<string, string>>({});
  let seededFor = $state<string | undefined>(undefined);

  $effect(() => {
    if (target?.orderId === seededFor) return;
    seededFor = target?.orderId;
    overview = null;
    choice = '';
    customDays = '';
    amount = '';
    fields = {};
    if (target) void load(target.orderId);
  });

  async function load(orderId: string) {
    loading = true;
    try {
      overview = await unwrap<Overview>(
        await api.api.admin['rental-extensions']['by-order'][':orderId'].$get({
          param: { orderId },
          query: {},
        }),
      );
      const first = overview.options[0];
      choice = first ? String(first.days) : CUSTOM;
    } catch (err) {
      toast.error(errorMessage(err));
      onClose();
    } finally {
      loading = false;
    }
  }

  const GATE: readonly GateField[] = [
    { key: 'days', id: 'extend-days' },
    { key: 'amount', id: 'extend-amount' },
  ];

  const picked = $derived(overview?.options.find((option) => String(option.days) === choice));

  function localIssues(): Record<string, string> {
    const issues: Record<string, string> = {};
    if (picked) return issues;
    const days = Number(customDays);
    if (!Number.isInteger(days) || days < 1) issues.days = 'Enter a whole number of days.';
    if (!amount || Number(amount) <= 0) issues.amount = 'Enter the agreed amount.';
    return issues;
  }

  async function submit() {
    const current = target;
    if (!current || !overview) return;

    const issues = localIssues();
    fields = issues;
    if (Object.keys(issues).length > 0) {
      focusFirstIssue(issues, GATE);
      return;
    }

    saving = true;
    try {
      let json: { days: number; amount?: string } = { days: Number(customDays), amount };
      if (picked) json = { days: picked.days };
      await unwrap(
        await api.api.admin['rental-extensions']['by-order'][':orderId'].$post({
          param: { orderId: current.orderId },
          json,
        }),
      );
      toast.success(
        `Extension opened for ${current.orderNumber} — record the payment to send the contract.`,
      );
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
      <Dialog.Title>Extend rental</Dialog.Title>
      <Dialog.Description>
        Order {target?.orderNumber}
        {#if overview?.endDate}· due back {formatDate(overview.endDate)}{/if}
      </Dialog.Description>
    </Dialog.Header>

    {#if loading || !overview}
      <LoadingState label="Loading the extension options…" />
    {:else}
      <form
        class="space-y-4"
        onsubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <RadioGroup.Root bind:value={choice} class="gap-2">
          {#each overview.options as option (option.days)}
            <Label
              for="extend-{option.days}"
              class="flex cursor-pointer items-center gap-3 rounded-md border p-3 has-[[data-state=checked]]:border-primary"
            >
              <RadioGroup.Item value={String(option.days)} id="extend-{option.days}" />
              <span class="flex-1">
                <span class="block font-medium">{option.label}</span>
                <span class="block text-xs text-muted-foreground">
                  {formatDate(option.fromDate)} → {formatDate(option.toDate)}
                </span>
              </span>
              <span class="font-medium tabular-nums">
                {formatMoney(option.amount, overview.currency)}
              </span>
            </Label>
          {/each}
          <Label
            for="extend-custom"
            class="flex cursor-pointer items-center gap-3 rounded-md border p-3 has-[[data-state=checked]]:border-primary"
          >
            <RadioGroup.Item value={CUSTOM} id="extend-custom" />
            <span class="font-medium">Other length, agreed amount</span>
          </Label>
        </RadioGroup.Root>

        {#if choice === CUSTOM}
          <div class="grid grid-cols-2 gap-3">
            <div>
              <Label class="mb-1.5" for="extend-days">Days</Label>
              <Input
                id="extend-days"
                inputmode="numeric"
                bind:value={customDays}
                aria-invalid={fields.days ? 'true' : undefined}
              />
              {#if fields.days}
                <p class="mt-1 text-xs text-destructive" role="alert">{fields.days}</p>
              {/if}
            </div>
            <MoneyInput
              id="extend-amount"
              label="Amount"
              bind:value={amount}
              suffix={overview.currency}
              error={fields.amount}
            />
          </div>
        {/if}

        <Dialog.Footer>
          <Button type="button" variant="ghost" disabled={saving} onclick={onClose}>Cancel</Button>
          <BusyButton type="submit" busy={saving} busyLabel="Opening…">Open extension</BusyButton>
        </Dialog.Footer>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>
