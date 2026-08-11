<!--
  The right-hand panel: what one selected area costs.

  TWO MODES, not one form. Reading is the common case — an operator opens this
  screen to check or change a fee, not to rename a comune. So the name and the code
  are shown as facts, and editing them takes a deliberate press that replaces the
  whole panel with a form. Nothing about identity can be changed by a stray
  keystroke while aiming for the fee.

  TEXT BUDGET. This panel shows values and almost no sentences. Anything
  explanatory lives behind an (i) or in the Help dialog — see info-hint.svelte for
  why. Compactness is scoped here with `size="sm"` and the local `DENSE_INPUT`,
  never by changing the shared components.
-->
<script lang="ts">
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import PhoneIcon from '@lucide/svelte/icons/phone';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { cn } from '$lib/utils.js';
  import { formatMoney } from '~/lib/format';
  import FeeStepper from './fee-stepper.svelte';
  import InfoHint from './info-hint.svelte';
  import {
    ALLOWED_CHILDREN,
    CODE_FIELD,
    LEVEL_LABEL,
    type ParentIndex,
    type ZoneLevel,
    type ZoneNode,
    countDescendants,
    describeMatchKey,
    matchKey,
    resolveZone,
    zonePath,
    zoneTitle,
  } from './tree.ts';

  interface Props {
    node: ZoneNode;
    parents: ParentIndex;
    /** Subtotal the checkout preview is built on — an illustration, not an order. */
    rentalSubtotal: string;
    /** A mutation is in flight; controls are disabled rather than queued. */
    busy: boolean;
    canWrite: boolean;
    canDelete: boolean;
    onStateChange: (node: ZoneNode, state: 'inherit' | 'fee' | 'call') => void;
    onFeeChange: (node: ZoneNode, fee: string) => void;
    onAddChild: (node: ZoneNode, level: ZoneLevel) => void;
    /** Name and code commit together — the edit form holds both until Save. */
    onIdentityChange: (node: ZoneNode, name: string, code: string) => void;
    onDelete: (node: ZoneNode) => void;
  }

  let {
    node,
    parents,
    rentalSubtotal,
    busy,
    canWrite,
    canDelete,
    onStateChange,
    onFeeChange,
    onAddChild,
    onIdentityChange,
    onDelete,
  }: Props = $props();

  /** Panel-local density. Deliberately not a variant on the shared Input. */
  const DENSE_INPUT = 'h-8 text-sm';

  const title = $derived(zoneTitle(node, parents));
  const chain = $derived(zonePath(node, parents));
  const resolved = $derived(resolveZone(node, parents));
  const descendants = $derived(countDescendants(node));
  const allowed = $derived(ALLOWED_CHILDREN[node.level]);
  const codeField = $derived(CODE_FIELD[node.level]);
  const storedKey = $derived(describeMatchKey(matchKey(node, parents)));
  const current = $derived<'inherit' | 'fee' | 'call'>(node.valueKind ?? 'inherit');

  /**
   * The country row is the fallback that gives every address an answer, so it may
   * not inherit (there is nothing above it) and may not be deleted or recoded. The
   * server refuses all three; this greys them out rather than letting the operator
   * find out from a 422.
   */
  const isCountry = $derived(node.level === 'country');

  /**
   * What "Inherit" would actually produce, as a figure rather than the word
   * "inherit". This is the one description kept on a control: the operator is
   * choosing between amounts, and the alternative is making them guess about money.
   */
  const inheritValue = $derived.by(() => {
    const parent = parents.get(node.id);
    const above = parent ? resolveZone(parent, parents) : null;
    if (!above?.value) return 'phone quote';
    return above.value.kind === 'call'
      ? `needs call, from ${above.source?.name}`
      : `${formatMoney(above.value.fee)} from ${above.source?.name}`;
  });

  /* Money stays a decimal string end to end, so the preview total is added in
     cents and formatted back rather than summed as floats. */
  const previewTotal = $derived.by(() => {
    if (resolved.value?.kind !== 'fee') return null;
    const cents =
      Math.round(Number(rentalSubtotal) * 100) + Math.round(Number(resolved.value.fee) * 100);
    return (cents / 100).toFixed(2);
  });

  /*
    FeeStepper normalises on blur and writes the decimal string back, so the fee is
    committed from an effect rather than a Save button.

    `draftNodeId` and `lastCommitted` are plain locals, not `$state`: writing them
    must not re-run this effect, or seeding a new selection would loop.
  */
  let feeDraft = $state('20.00');
  let draftNodeId = '';
  let lastCommitted = '';

  /** Selection moved: seed the draft so "Fixed fee" starts at a sensible figure. */
  $effect(() => {
    const id = node.id;
    if (draftNodeId === id) return;
    draftNodeId = id;
    const seed =
      (node.valueKind === 'fee' ? node.fee : null) ??
      (resolved.value?.kind === 'fee' ? resolved.value.fee : null) ??
      '20.00';
    feeDraft = seed;
    lastCommitted = seed;
  });

  /*
    Commit the draft.

    `feeDraft` is read unconditionally, on the first line, because that is what
    makes it a dependency. Folded into the effect above it was only ever WRITTEN on
    the seeding run and never read, so Svelte never tracked it and a typed fee
    reached the field but never the tree.
  */
  $effect(() => {
    const draft = feeDraft;
    if (draftNodeId !== node.id || draft === lastCommitted) return;
    lastCommitted = draft;
    onFeeChange(node, draft);
  });

  /* --- edit mode ---------------------------------------------------------- */

  /*
    The form holds its own copy and commits on Save, unlike the fee. Identity is
    the field a half-typed value would break: an empty code matches nothing, and a
    row that matches nothing prices nothing while looking perfectly fine.
  */
  let editing = $state(false);
  let nameDraft = $state('');
  let codeDraft = $state('');

  function startEditing() {
    nameDraft = node.name;
    codeDraft = node.code;
    editing = true;
  }

  /** Mirrors the server's per-level code shape, so a typo is caught before the PATCH. */
  const codeValid = $derived(codeField.pattern.test(codeDraft.trim()));
  const canSave = $derived(nameDraft.trim() !== '' && codeValid);

  function save() {
    if (!canSave) return;
    onIdentityChange(node, nameDraft.trim(), codeDraft.trim());
    editing = false;
  }

  // Leaving the row cancels an open form, so a draft can never land on the area
  // the operator clicked away to. Reading `node.id` is what makes that the
  // dependency — the form must survive a fee change on the same row.
  $effect(() => {
    if (node.id) editing = false;
  });
</script>

<Card.Root class="gap-0 py-0">
  {#if editing}
    <div class="border-b px-4 py-2.5">
      <h2 class="text-sm font-semibold">Edit {LEVEL_LABEL[node.level].toLowerCase()}</h2>
    </div>

    <div class="space-y-3 px-4 py-3.5">
      <div>
        <div class="mb-1.5 flex items-center gap-1">
          <Label for="zone-name">Name</Label>
          <InfoHint label="the name field">
            Display only. Rename it whenever you like — what an address matches is the code below,
            never the name.
          </InfoHint>
        </div>
        <Input
          id="zone-name"
          bind:value={nameDraft}
          autocomplete="off"
          class={DENSE_INPUT}
          aria-invalid={nameDraft.trim() === '' ? 'true' : undefined}
        />
      </div>

      <div>
        <div class="mb-1.5 flex items-center gap-1">
          <Label for="zone-code">{codeField.label}</Label>
          <InfoHint label="the {codeField.label} field">{codeField.hint}</InfoHint>
        </div>
        <Input
          id="zone-code"
          bind:value={codeDraft}
          autocomplete="off"
          disabled={isCountry || busy}
          class={cn(DENSE_INPUT, 'font-mono')}
          placeholder={codeField.placeholder}
          aria-invalid={codeDraft.trim() !== '' && !codeValid ? 'true' : undefined}
        />
        {#if codeDraft.trim() === ''}
          <p class="mt-1.5 text-xs font-medium text-destructive">
            Without a code this area matches nothing.
          </p>
        {:else if !codeValid}
          <p class="mt-1.5 text-xs font-medium text-destructive">{codeField.hint}</p>
        {/if}
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" disabled={busy} onclick={() => (editing = false)}>
          Cancel
        </Button>
        <Button size="sm" disabled={!canSave || busy} onclick={save}>Save</Button>
      </div>
    </div>
  {:else}
    <div class="flex items-start gap-2 border-b px-4 py-2.5">
      <div class="min-w-0 flex-1">
        <p class="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {#each chain as step, index (step.id)}
            {#if index > 0}<span aria-hidden="true">›</span>{/if}
            <span class={index === chain.length - 1 ? 'font-medium text-foreground' : ''}>
              {step.level === 'cap' ? step.code : step.name}
            </span>
          {/each}
        </p>
        <h2 class="mt-0.5 truncate text-base font-semibold">{title}</h2>
        <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{LEVEL_LABEL[node.level]}</span>
          {#if node.code}
            <span aria-hidden="true">·</span>
            <code class="font-mono">{node.code}</code>
          {/if}
          <InfoHint label="how this area is identified">
            Matched as <code class="font-mono text-foreground">{storedKey}</code>, composed from this
            row and its parents. Each level stores only its own code, so nothing is ever parsed back
            out of a name.
          </InfoHint>
        </p>
      </div>
      <Button variant="outline" size="sm" disabled={!canWrite || busy} onclick={startEditing}>
        <PencilIcon />
        Edit
      </Button>
    </div>

    <div class="space-y-3.5 px-4 py-3.5">
      <div>
        <div class="mb-2 flex items-center gap-1">
          <p class="text-sm font-medium">Delivery fee</p>
          <InfoHint label="the three fee states">
            <span class="block">
              <span class="font-medium text-foreground">Inherit</span> — no fee here, the nearest row
              above answers.
            </span>
            <span class="mt-1.5 block">
              <span class="font-medium text-foreground">Fixed fee</span> — the customer sees this
              amount and pays it.
            </span>
            <span class="mt-1.5 block">
              <span class="font-medium text-foreground">Needs call</span> — we serve the area but
              quote by phone. A decision, not an empty row.
            </span>
            {#if isCountry}
              <span class="mt-1.5 block">
                Italia cannot inherit — nothing sits above it. Whatever it carries is the answer for
                every address no deeper row covers, which is what makes coverage complete.
              </span>
            {/if}
          </InfoHint>
        </div>

        <!--
          Each row is a wrapper, not one big button: the fee stepper has to sit
          beside its label on the same line, and an <input> inside a <button> is
          neither valid HTML nor clickable. The button covers the radio and the
          label; the trailing cell is a sibling that fills the rest of the row.

          `items-stretch` + `overflow-hidden` are what let the stepper run to the
          row's own rounded edge with no gap around it. The focus ring is on the ROW
          so it encloses the whole control, buttons included.
        -->
        <div class="space-y-2" role="radiogroup" aria-label="Delivery fee state">
          {#each [{ key: 'inherit', label: 'Inherit', note: inheritValue }, { key: 'fee', label: 'Fixed fee', note: '' }, { key: 'call', label: 'Needs call', note: 'quoted by phone' }] as const as option (option.key)}
            {@const active = current === option.key}
            {@const locked = !canWrite || busy || (isCountry && option.key === 'inherit')}
            <div
              class={cn(
                'flex items-stretch overflow-hidden rounded-md border transition-colors',
                'has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50',
                // Active reads as the blue dot plus a ring, with no fill behind:
                // a tinted row makes the stepper sitting in it look borrowed.
                active ? 'border-primary ring-[3px] ring-primary/15' : 'hover:bg-muted/60',
              )}
            >
              <button
                type="button"
                role="radio"
                aria-checked={active}
                disabled={locked}
                class="flex flex-1 items-center gap-2.5 py-2.5 pl-2.5 text-left disabled:cursor-not-allowed disabled:opacity-55"
                onclick={() => onStateChange(node, option.key)}
              >
                <span
                  class={cn(
                    'size-3.5 shrink-0 rounded-full border transition-colors',
                    active ? 'border-4 border-primary' : 'border-input bg-background',
                  )}
                  aria-hidden="true"
                ></span>
                <span class="text-sm font-medium">{option.label}</span>
              </button>
              {#if option.key === 'fee' && active}
                <FeeStepper label="delivery fee" disabled={!canWrite} bind:value={feeDraft} />
              {:else if option.note}
                <span class="self-center truncate pr-2.5 text-xs text-muted-foreground">
                  {option.note}
                </span>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- The effective answer, as one line of values. -->
      <div class="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2 text-xs">
        <span class="text-muted-foreground">Effective</span>
        {#if resolved.value === null}
          <span class="font-medium text-amber-600">phone quote</span>
          <span class="text-muted-foreground">— nothing set above</span>
        {:else if resolved.value.kind === 'call'}
          <span class="font-medium text-foreground">needs call</span>
          <span class="text-muted-foreground">
            {resolved.inherited ? `from ${resolved.source?.name}` : 'set here'}
          </span>
        {:else}
          <span class="font-medium tabular-nums text-foreground">
            {formatMoney(resolved.value.fee)}
          </span>
          <span class="text-muted-foreground">
            {resolved.inherited ? `from ${resolved.source?.name}` : 'set here'}
          </span>
        {/if}
        {#if descendants > 0}
          <span class="ml-auto shrink-0 text-muted-foreground">
            {descendants} nested
          </span>
        {/if}
      </div>

      {#if allowed.length > 0 && canWrite}
        <Separator />
        <div class="flex items-center gap-2">
          <p class="text-sm font-medium">Add</p>
          {#if node.level === 'comune'}
            <InfoHint label="adding a CAP or frazione">
              A CAP child means the pair “{node.name} + CAP”, never a CAP on its own — the same CAP
              can belong to neighbouring comuni that you price differently.
            </InfoHint>
          {/if}
          <div class="ml-auto flex flex-wrap gap-1.5">
            {#each allowed as level (level)}
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onclick={() => onAddChild(node, level)}
              >
                <PlusIcon />
                {LEVEL_LABEL[level]}
              </Button>
            {/each}
          </div>
        </div>
      {/if}

      <Separator />

      <!-- The payoff: the storefront consequence of this row, in the storefront's
           own Italian. -->
      <div class="overflow-hidden rounded-md border">
        <p
          class="border-b bg-muted/40 px-2.5 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground"
        >
          AT CHECKOUT
        </p>
        <div class="space-y-1 px-2.5 py-2 text-sm">
          <div class="flex justify-between gap-3">
            <span class="text-muted-foreground">Subtotale noleggio</span>
            <span class="tabular-nums">{formatMoney(rentalSubtotal)}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-muted-foreground">Consegna</span>
            {#if resolved.value?.kind === 'fee'}
              <span class="tabular-nums">{formatMoney(resolved.value.fee)}</span>
            {:else}
              <span class="text-xs font-semibold text-amber-600">Da confermare</span>
            {/if}
          </div>
          <div class="flex justify-between gap-3 border-t pt-1.5 font-semibold">
            <span>Totale</span>
            {#if previewTotal}
              <span class="tabular-nums">{formatMoney(previewTotal)}</span>
            {:else}
              <span class="text-xs text-amber-600">{formatMoney(rentalSubtotal)} + consegna</span>
            {/if}
          </div>
          {#if resolved.value?.kind !== 'fee'}
            <p
              class="mt-1.5 flex items-start gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-700 dark:text-amber-400"
            >
              <PhoneIcon class="mt-0.5 size-3 shrink-0" />
              Il costo di consegna viene confermato al telefono.
            </p>
          {/if}
        </div>
      </div>

      {#if canDelete && !isCountry}
        <div class="flex justify-end">
          <Button variant="ghost" size="sm" disabled={busy} onclick={() => onDelete(node)}>
            <Trash2Icon class="text-destructive" />
            Delete
          </Button>
        </div>
      {/if}
    </div>
  {/if}
</Card.Root>
