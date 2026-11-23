<!--
  Writing a unit off keeps it out of stock for good, so the reason is required
  and lands in the stock history. The click checks, marks the field and moves
  focus there; the server's 422 is shown at the same field.
-->
<script lang="ts">
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { api } from '~/lib/api';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import { focusFirstIssue } from '~/lib/form-gate';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { t } from '~/lib/ui-text';

  interface Props {
    target: { id: string; productTitle: string; orderNumber: string } | undefined;
    onClose: () => void;
    onDone: (id: string) => void;
  }

  let { target, onClose, onDone }: Props = $props();

  const REASON_ID = 'write-off-reason';
  const GATE = [{ key: 'note', id: REASON_ID }];

  let reason = $state('');
  let fields = $state<Record<string, string>>({});
  let saving = $state(false);

  $effect(() => {
    if (!target) return;
    reason = '';
    fields = {};
  });

  async function submit() {
    if (!target) return;
    const note = reason.trim();
    if (!note) {
      fields = { note: t('returns.reasonRequired') };
      focusFirstIssue(fields, GATE);
      return;
    }
    saving = true;
    try {
      await unwrap(
        await api.api.admin.attention[':id'].resolve.$post({
          param: { id: target.id },
          json: { resolution: 'written_off', note },
        }),
      );
      toast.success(t('returns.toastWrittenOff', { product: target.productTitle }));
      onDone(target.id);
      onClose();
    } catch (err) {
      fields = errorFields(err);
      if (Object.keys(fields).length === 0) toast.error(errorMessage(err));
      focusFirstIssue(fields, GATE);
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
      <Dialog.Title>
        {t('returns.writeOffTitle', { product: target?.productTitle ?? '' })}
      </Dialog.Title>
    </Dialog.Header>
    <form
      class="space-y-4"
      onsubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div>
        <Label class="mb-1.5" for={REASON_ID}>{t('returns.reasonLabel')}</Label>
        <Textarea
          id={REASON_ID}
          bind:value={reason}
          aria-invalid={fields.note ? 'true' : undefined}
        />
        {#if fields.note}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.note}</p>
        {/if}
      </div>
      <Dialog.Footer>
        <Button type="button" variant="ghost" disabled={saving} onclick={onClose}>
          {t('common.back')}
        </Button>
        <BusyButton type="submit" busy={saving} busyLabel={t('returns.writeOffSaving')}>
          {t('returns.writeOff')}
        </BusyButton>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
