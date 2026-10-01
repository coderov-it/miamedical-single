<!--
  Cancels an open extension. The reason goes on the order timeline, and an
  unsigned contract issued for it is voided with the same reason.
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

  interface Props {
    target: { id: string } | undefined;
    onClose: () => void;
    onDone: () => void;
  }

  let { target, onClose, onDone }: Props = $props();

  let reason = $state('');
  let saving = $state(false);
  let fields = $state<Record<string, string>>({});
  let seededFor = $state<string | undefined>(undefined);

  $effect(() => {
    if (target?.id === seededFor) return;
    seededFor = target?.id;
    reason = '';
    fields = {};
  });

  async function submit() {
    const current = target;
    if (!current) return;

    if (!reason.trim()) {
      fields = { reason: 'Say why, for the order timeline.' };
      focusFirstIssue(fields, [{ key: 'reason', id: 'cancel-reason' }]);
      return;
    }

    saving = true;
    try {
      await unwrap(
        await api.api.admin['rental-extensions'][':id'].cancel.$post({
          param: { id: current.id },
          json: { reason: reason.trim() },
        }),
      );
      toast.success('Extension cancelled.');
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
      <Dialog.Title>Cancel extension</Dialog.Title>
      <Dialog.Description>The rental keeps its current end date.</Dialog.Description>
    </Dialog.Header>
    <form
      class="space-y-4"
      onsubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div>
        <Label class="mb-1.5" for="cancel-reason">Reason</Label>
        <Textarea
          id="cancel-reason"
          bind:value={reason}
          maxlength={500}
          aria-invalid={fields.reason ? 'true' : undefined}
        />
        {#if fields.reason}
          <p class="mt-1 text-xs text-destructive" role="alert">{fields.reason}</p>
        {/if}
      </div>
      <Dialog.Footer>
        <Button type="button" variant="ghost" disabled={saving} onclick={onClose}>Back</Button>
        <BusyButton type="submit" variant="destructive" busy={saving} busyLabel="Cancelling…">
          Cancel extension
        </BusyButton>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
