<!--
  The frame every product tab sits in: a card, an error strip, and a footer
  that holds the one Save button for that tab.

  Panels stay **mounted** when you switch away — `hidden`, not `{#if}`. That is
  what turns tab switching from "silently discards your edits" (the old
  behaviour) into a free action, and it is why the guard only fires on leaving
  the page rather than on every tab click.
-->
<script lang="ts">
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import type { Snippet } from 'svelte';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Popover from '$lib/components/ui/popover/index.js';
  import BusyButton from '~/lib/components/busy-button.svelte';

  interface Props {
    title: string;
    description?: string;
    /** Unsaved edits — drives the footer hint and the strip's dot. */
    dirty?: boolean;
    saving?: boolean;
    error?: string | null;
    /** Omit to render a read-only panel with no footer. */
    onSave?: () => void;
    saveLabel?: string;
    /** Resets the tab to what the server last returned. Offered behind a confirmation. */
    onDiscard?: () => void;
    /** Disables saving and says why, e.g. a missing permission. */
    disabledReason?: string | undefined;
    children: Snippet;
  }

  let discardOpen = $state(false);

  let {
    title,
    description,
    dirty = false,
    saving = false,
    error = null,
    onSave,
    saveLabel = 'Save changes',
    onDiscard,
    disabledReason,
    children,
  }: Props = $props();
</script>

<Card.Root class="gap-0 py-0">
  <div class="border-b px-5 py-3.5">
    <h2 class="text-sm font-medium">{title}</h2>
    {#if description}
      <p class="mt-0.5 text-sm text-muted-foreground">{description}</p>
    {/if}
  </div>

  {#if error}
    <div class="flex items-start gap-2 border-b bg-destructive/5 px-5 py-3" role="alert">
      <CircleAlertIcon class="mt-0.5 size-4 shrink-0 text-destructive" />
      <p class="text-sm text-destructive">{error}</p>
    </div>
  {/if}

  <div class="p-5">
    {@render children()}
  </div>

  <!-- Nothing to save, nothing to offer: the footer appears with the first edit. -->
  {#if onSave && (dirty || saving || disabledReason)}
    <div class="flex items-center justify-end gap-3 border-t bg-muted/40 px-5 py-3">
      {#if disabledReason}
        <p class="mr-auto text-sm text-muted-foreground">{disabledReason}</p>
      {:else if dirty}
        <p class="mr-auto text-sm text-muted-foreground">Unsaved changes</p>
      {/if}
      {#if onDiscard && dirty && !disabledReason}
        <Popover.Root bind:open={discardOpen}>
          <Popover.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant="destructive" type="button">Cancel</Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content align="end" side="top" class="w-64">
            <p class="font-medium">Discard your changes?</p>
            <p class="text-xs text-muted-foreground">Edits in this section will be lost.</p>
            <div class="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onclick={() => (discardOpen = false)}>
                Keep editing
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onclick={() => {
                  discardOpen = false;
                  onDiscard();
                }}
              >
                Discard
              </Button>
            </div>
          </Popover.Content>
        </Popover.Root>
      {/if}
      <BusyButton
        busy={saving}
        busyLabel="Saving…"
        disabled={Boolean(disabledReason)}
        onclick={onSave}
      >
        {saveLabel}
      </BusyButton>
    </div>
  {/if}
</Card.Root>
