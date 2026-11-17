<!--
  Sends the customer the private link that finishes the order. All three step options
  are always offered; nothing is disabled. A click that cannot work says why at the
  control that is wrong (CLAUDE.md, form validation). Mounted only while open, so
  every opening starts from fresh state.
-->
<script lang="ts">
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
  import { api } from '~/lib/api';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import { focusFirstIssue } from '~/lib/form-gate';
  import {
    fieldLabelKey,
    missingDetails,
    linkProblem,
    type LinkSteps,
  } from '~/lib/orders/manual-order';
  import type { OrderDetail } from '~/lib/orders/types';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { type MessageKey, t } from '~/lib/ui-text';

  interface Props {
    order: OrderDetail;
    open: boolean;
    onClose: () => void;
    /** The link wrote a timeline event: the caller reloads the order. */
    onSent: () => void;
  }

  let { order, open, onClose, onSent }: Props = $props();

  const STEP_LABELS: Record<LinkSteps, MessageKey> = {
    sign_pay: 'newOrder.stepsSignPay',
    sign: 'newOrder.stepsSign',
    pay: 'newOrder.stepsPay',
  };

  const STEPS: LinkSteps[] = ['sign_pay', 'sign', 'pay'];
  let choice = $state<LinkSteps>(STEPS.find((step) => !linkProblem(order, step)) ?? 'sign_pay');
  let includeDetails = $state(true);
  let fields = $state<Record<string, string>>({});
  let busy = $state<'email' | 'copy' | null>(null);
  let copiedUrl = $state('');

  /** The missing details, as a sentence naming each one. */
  function missingText(keys: string[]): string {
    const names = keys.map((key) => {
      const label = fieldLabelKey(key);
      return label ? t(label) : key;
    });
    return t('newOrder.linkMissing', { fields: names.join(', ') });
  }

  function mark(issues: Record<string, string>) {
    fields = issues;
    focusFirstIssue(issues, [
      { key: 'steps', id: 'link-steps' },
      { key: 'details', id: 'link-details' },
    ]);
  }

  async function send(deliver: 'email' | 'copy') {
    const issues: Record<string, string> = {};
    const problem = linkProblem(order, choice);
    if (problem) issues.steps = t(problem);
    const missing = missingDetails(order);
    if (!includeDetails && missing.length > 0) issues.details = missingText(missing);
    if (Object.keys(issues).length > 0) {
      mark(issues);
      return;
    }
    fields = {};
    busy = deliver;
    try {
      const link = await unwrap<{ url: string; emailSent: boolean | null }>(
        await api.api.admin.orders[':id'].link.$post({
          param: { id: order.id },
          json: { steps: choice, includeDetails, deliver },
        }),
      );
      onSent();
      if (deliver === 'email') {
        if (link.emailSent) toast.success(t('newOrder.linkSent', { email: order.email }));
        else toast.error(t('newOrder.linkNotSent'));
        onClose();
        return;
      }
      copiedUrl = link.url;
      try {
        await navigator.clipboard.writeText(link.url);
        toast.success(t('newOrder.linkCopied'));
      } catch {
        // Clipboard refused (permissions, insecure context): the URL stays visible to copy by hand.
      }
    } catch (err) {
      const server = errorFields(err);
      const { steps: stepsError, ...rest } = server;
      const detailKeys = Object.keys(rest);
      if (stepsError || detailKeys.length > 0) {
        mark({
          ...(stepsError ? { steps: stepsError } : {}),
          ...(detailKeys.length > 0 ? { details: missingText(detailKeys) } : {}),
        });
      } else {
        toast.error(errorMessage(err));
      }
    } finally {
      busy = null;
    }
  }
</script>

<Dialog.Root
  {open}
  onOpenChange={(next) => {
    if (!next && busy === null) onClose();
  }}
>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{t('newOrder.linkTitle', { number: order.number })}</Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4">
      <div id="link-steps" tabindex="-1">
        <p class="mb-1.5 text-sm font-medium">{t('newOrder.linkSteps')}</p>
        <RadioGroup.Root bind:value={choice} class="gap-2">
          {#each STEPS as step (step)}
            <Label
              for="link-step-{step}"
              class="flex cursor-pointer items-center gap-3 rounded-md border p-3 has-[[data-state=checked]]:border-primary"
            >
              <RadioGroup.Item value={step} id="link-step-{step}" />
              <span class="font-medium">{t(STEP_LABELS[step])}</span>
            </Label>
          {/each}
        </RadioGroup.Root>
        {#if fields.steps}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.steps}</p>
        {/if}
      </div>

      <div>
        <div class="flex items-center gap-2">
          <Checkbox id="link-details" bind:checked={includeDetails} />
          <Label for="link-details">{t('newOrder.linkIncludeDetails')}</Label>
        </div>
        {#if fields.details}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.details}</p>
        {/if}
      </div>

      {#if copiedUrl}
        <Input
          readonly
          value={copiedUrl}
          aria-label={t('newOrder.linkUrl')}
          onfocus={(e) => e.currentTarget.select()}
        />
      {/if}
    </div>

    <Dialog.Footer>
      <Button type="button" variant="ghost" onclick={onClose}>{t('common.close')}</Button>
      <BusyButton
        type="button"
        variant="outline"
        busy={busy === 'copy'}
        onclick={() => send('copy')}
      >
        {t('newOrder.linkCopy')}
      </BusyButton>
      <BusyButton type="button" busy={busy === 'email'} onclick={() => send('email')}>
        {t('newOrder.linkEmail')}
      </BusyButton>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
