<!--
  The choices behind a select spec.

  Past four entries the list scrolls inside its own box rather than pushing the
  three toggles below it off screen — a colour spec with thirty options would
  otherwise bury the rest of the form.
-->
<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { editorLang } from '~/lib/editor-lang.svelte';
  import type { SpecOptionEdit } from './spec-edit';

  interface Props {
    options: SpecOptionEdit[];
    disabled?: boolean;
  }

  let { options = $bindable(), disabled = false }: Props = $props();

  /** Only ever a suggestion: an existing option's value is a stored key. */
  function slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function add() {
    options.push({ uid: crypto.randomUUID(), value: '', label: { it: '' } });
  }

  function onLabelInput(option: SpecOptionEdit, text: string) {
    const previous = editorLang.current === 'en' ? (option.label.en ?? '') : option.label.it;

    if (editorLang.current === 'en') option.label.en = text || undefined;
    else option.label.it = text;

    // Autofill the machine value only while it is still tracking the label and
    // the row is new. Once a value is saved it is a key other rows point at.
    if (!option.id && (option.value === '' || option.value === slugify(previous))) {
      option.value = slugify(editorLang.current === 'en' ? (option.label.it ?? text) : text);
    }
  }
</script>

<div>
  <div class="mb-1.5 flex items-center justify-between">
    <Label>Options</Label>
    <span class="text-xs text-muted-foreground">
      {options.length} defined
    </span>
  </div>

  {#if options.length > 0}
    <div
      class="space-y-1.5 rounded-lg border p-1.5 {options.length > 4
        ? 'max-h-56 overflow-y-auto'
        : ''}"
    >
      {#each options as option (option.uid)}
        <div class="flex items-center gap-1.5">
          <Input
            value={editorLang.current === 'en' ? (option.label.en ?? '') : option.label.it}
            oninput={(event) => onLabelInput(option, event.currentTarget.value)}
            placeholder={editorLang.current === 'en' ? 'Label (EN)' : 'Etichetta (IT)'}
            aria-label="Option label"
            class="h-8 flex-1"
          />
          <Input
            bind:value={option.value}
            placeholder="value"
            aria-label="Option value"
            class="h-8 w-36 font-mono text-xs"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            class="text-muted-foreground"
            {disabled}
            aria-label="Remove option"
            onclick={() => (options = options.filter((entry) => entry.uid !== option.uid))}
          >
            <XIcon />
          </Button>
        </div>
      {/each}
    </div>
  {/if}

  <Button type="button" variant="ghost" size="sm" class="mt-1.5" {disabled} onclick={add}>
    <PlusIcon />
    Add option
  </Button>
</div>
