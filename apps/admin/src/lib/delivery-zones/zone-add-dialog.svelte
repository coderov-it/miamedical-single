<!--
  Creating an area asks for its identity up front.

  It is a dialog rather than an inline "New comune" row because the code is the
  half that matters: a row created with a placeholder code is a row that silently
  prices nothing, and nothing on the screen would look wrong. Name and code are
  captured together, and Add stays disabled until the code is there.
-->
<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { CODE_FIELD, LEVEL_LABEL, type ZoneLevel, type ZoneNode } from './tree.ts';

  interface Props {
    /** The parent to add under, or null when the dialog is closed. */
    target: { parent: ZoneNode; level: ZoneLevel } | null;
    /** A create is in flight; the form waits rather than queueing a second one. */
    busy?: boolean;
    onCancel: () => void;
    onConfirm: (parent: ZoneNode, level: ZoneLevel, name: string, code: string) => void;
  }

  let { target, busy = false, onCancel, onConfirm }: Props = $props();

  let name = $state('');
  let code = $state('');
  let lastTarget = '';

  // Reset per opening, keyed on parent+level so reopening never inherits the
  // previous attempt's half-typed values.
  $effect(() => {
    const key = target ? `${target.parent.id}:${target.level}` : '';
    if (key !== lastTarget) {
      lastTarget = key;
      name = '';
      code = '';
    }
  });

  const field = $derived(target ? CODE_FIELD[target.level] : null);
  /* The code shape is checked here as well as on the server, because a malformed
     code produces a row that looks correct and matches nothing. */
  const codeValid = $derived(field ? field.pattern.test(code.trim()) : false);
  const valid = $derived(name.trim().length > 0 && codeValid);

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!target || !valid) return;
    onConfirm(target.parent, target.level, name.trim(), code.trim());
  }
</script>

<Dialog.Root open={target !== null} onOpenChange={(open) => !open && onCancel()}>
  <Dialog.Content class="sm:max-w-md">
    {#if target && field}
      <form onsubmit={submit}>
        <Dialog.Header>
          <Dialog.Title>Add {LEVEL_LABEL[target.level].toLowerCase()}</Dialog.Title>
          <Dialog.Description>
            {#if target.level === 'cap'}
              Priced as the pair “{target.parent.name} + CAP”. The comune comes from the parent row,
              so the same CAP under another comune stays a separate area.
            {:else}
              Inside {target.parent.name}. It inherits that area's fee until you give it one.
            {/if}
          </Dialog.Description>
        </Dialog.Header>

        <div class="space-y-4 py-4">
          <div>
            <Label class="mb-1.5" for="zone-add-name">Name</Label>
            <Input
              id="zone-add-name"
              bind:value={name}
              placeholder={target.level === 'cap' ? 'Lido di Ostia' : 'Fiumicino'}
              autocomplete="off"
            />
            <p class="mt-1.5 text-xs text-muted-foreground">
              Shown in this tree only. Renaming it never changes what an address matches.
            </p>
          </div>

          <div>
            <Label class="mb-1.5" for="zone-add-code">{field.label}</Label>
            <Input
              id="zone-add-code"
              bind:value={code}
              placeholder={field.placeholder}
              autocomplete="off"
              class="font-mono"
            />
            {#if code.trim() !== '' && !codeValid}
              <p class="mt-1.5 text-xs font-medium text-destructive">{field.hint}</p>
            {:else}
              <p class="mt-1.5 text-xs text-muted-foreground">{field.hint}</p>
            {/if}
          </div>
        </div>

        <Dialog.Footer>
          <Button type="button" variant="outline" disabled={busy} onclick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={!valid || busy}>Add area</Button>
        </Dialog.Footer>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>
