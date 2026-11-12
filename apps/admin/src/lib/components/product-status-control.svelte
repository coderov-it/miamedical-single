<!--
  Changes a product's status in place, in two shapes:

  - `select`: a dropdown for a table row.
  - `button`: Publish / Unpublish for the editor header.

  Choosing a status never saves by itself. A small popover floats over the
  control asking to confirm; the request only goes out on Confirm, which shows
  a spinner while in flight. The control itself never changes size.
-->
<script lang="ts">
  import EyeIcon from '@lucide/svelte/icons/eye';
  import EyeOffIcon from '@lucide/svelte/icons/eye-off';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Popover from '$lib/components/ui/popover/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { api } from '~/lib/api';
  import { errorMessage, unwrap } from '~/lib/request';

  type Status = 'draft' | 'active' | 'archived';

  interface Props {
    productId: string;
    status: string;
    mode: 'select' | 'button';
    /** Return false to veto the change (the caller says why). */
    canStart?: () => boolean;
    /** Called with the server's answer once the change is saved. */
    onChanged: (updated: unknown, status: Status) => void;
  }

  let { productId, status, mode, canStart, onChanged }: Props = $props();

  const LABELS: Record<Status, string> = { draft: 'Draft', active: 'Active', archived: 'Archived' };
  const OPTIONS = Object.keys(LABELS) as Status[];

  let pending = $state<Status | null>(null);
  let busy = $state(false);
  let anchor = $state<HTMLElement>();

  // The button flips between the two states an operator actually wants.
  const buttonTarget = $derived<Status>(status === 'active' ? 'draft' : 'active');

  function ask(next: Status) {
    if (next === status || busy) return;
    if (canStart && !canStart()) return;
    pending = next;
  }

  async function confirm() {
    const next = pending;
    if (!next || busy) return;
    busy = true;
    try {
      const updated = await unwrap<unknown>(
        await api.api.admin.products[':id'].$patch({
          param: { id: productId },
          json: { status: next },
        }),
      );
      toast.success(`Status is now ${LABELS[next]}.`);
      pending = null;
      onChanged(updated, next);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      busy = false;
    }
  }
</script>

<!-- The control never changes shape: the confirmation floats beside it, so a table row cannot shift. -->
<span bind:this={anchor} class="inline-flex">
  {#if mode === 'button'}
    <Button
      variant={buttonTarget === 'active' ? 'default' : 'outline'}
      onclick={() => ask(buttonTarget)}
    >
      {#if buttonTarget === 'active'}<EyeIcon />Publish{:else}<EyeOffIcon />Unpublish{/if}
    </Button>
  {:else}
    <Select.Root type="single" value={status} onValueChange={(value) => ask(value as Status)}>
      <Select.Trigger size="sm" class="w-28" aria-label="Change status">
        {LABELS[status as Status] ?? status}
      </Select.Trigger>
      <Select.Content>
        {#each OPTIONS as option (option)}
          <Select.Item value={option}>{LABELS[option]}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  {/if}
</span>

<Popover.Root
  open={pending !== null}
  onOpenChange={(open) => {
    if (!open && !busy) pending = null;
  }}
>
  <Popover.Content
    customAnchor={anchor}
    align="start"
    class="w-60"
    onInteractOutside={(event) => {
      if (busy) event.preventDefault();
    }}
    onEscapeKeydown={(event) => {
      if (busy) event.preventDefault();
    }}
  >
    <p class="font-medium">
      {pending === 'active' ? 'Publish this product?' : `Set to ${pending ? LABELS[pending] : ''}?`}
    </p>
    <p class="text-xs text-muted-foreground">
      {pending === 'active'
        ? 'It becomes visible on the storefront.'
        : 'It disappears from the storefront.'}
    </p>
    <div class="flex justify-end gap-2">
      <Button size="sm" variant="destructive" onclick={() => (pending = null)}>Cancel</Button>
      <Button size="sm" aria-busy={busy} onclick={() => void confirm()}>
        {#if busy}<Spinner />Saving…{:else}Confirm{/if}
      </Button>
    </div>
  </Popover.Content>
</Popover.Root>
