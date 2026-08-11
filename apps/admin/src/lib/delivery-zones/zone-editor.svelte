<!--
  The right-hand panel: what one selected area costs.

  READ, EDIT, ADD — one panel, three modes, never a dialog. Reading is the common
  case: an operator opens this screen to change a fee, not to rename a comune. So
  identity is shown as facts, and both writing forms take a deliberate press that
  replaces the panel's contents and puts them back when it is done. Adding used to
  be a modal, which meant a second surface with its own header, its own footer and
  its own copy, covering the tree the operator was working in.

  Edit and Add are the SAME form. They ask for the same two fields and differ only
  in which level they are for and where the values go, so a change to one cannot
  drift out of step with the other.

  TEXT BUDGET. This panel shows values, not sentences. A field gets a label and,
  where the rule is not guessable, an (i) — never a paragraph under the input.
  Prose that explains the model belongs in the Help dialog. Compactness is scoped
  here with `size="sm"` and the local `DENSE_INPUT`, never by changing the shared
  components.
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
    /** Separate from `canWrite`: changing a fee and creating an area are distinct
        permissions, so the Add row is hidden rather than failing on submit. */
    canCreate: boolean;
    canDelete: boolean;
    onStateChange: (node: ZoneNode, state: 'inherit' | 'fee' | 'call') => void;
    onFeeChange: (node: ZoneNode, fee: string) => void;
    /*
      Both writes resolve to whether the server accepted them, because that is what
      decides whether the form closes. A rejected code — malformed, or a duplicate
      of a sibling — has to leave the operator looking at what they typed.
    */
    onAddChild: (
      parent: ZoneNode,
      level: ZoneLevel,
      name: string,
      code: string,
    ) => Promise<boolean>;
    /** Name and code commit together — the form holds both until Save. */
    onIdentityChange: (node: ZoneNode, name: string, code: string) => Promise<boolean>;
    onDelete: (node: ZoneNode) => void;
  }

  let {
    node,
    parents,
    rentalSubtotal,
    busy,
    canWrite,
    canCreate,
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
  let lastSeenFee: string | null = null;

  /**
   * Seed the draft so "Fixed fee" starts at a sensible figure.
   *
   * Re-seeds on a new selection AND when this row's own fee changes underneath the
   * panel — a refresh, or a write from elsewhere. Keying on the id alone was the
   * bug: the row read `OWN 47,00 €` while the field beside it still said `25,00 €`,
   * and the field is the one an operator would trust.
   *
   * `lastSeenFee` is what stops that from looping. The stepper's own commit writes
   * the same figure back into the node, so the effect re-runs; comparing against
   * what we last read makes that pass a no-op instead of a second seed.
   */
  $effect(() => {
    const id = node.id;
    const own = node.valueKind === 'fee' ? node.fee : null;
    if (draftNodeId === id && own === lastSeenFee) return;
    draftNodeId = id;
    lastSeenFee = own;
    const seed =
      own ?? (resolved.value?.kind === 'fee' ? resolved.value.fee : null) ?? '20.00';
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

  /* --- the identity form, for both editing and adding --------------------- */

  /*
    The form holds its own copy and commits on Save, unlike the fee. Identity is
    what a half-typed value breaks: an empty code matches nothing, and a row that
    matches nothing prices nothing while looking perfectly fine.
  */
  let form = $state<'none' | 'edit' | 'add'>('none');
  /** Which child is being added. Meaningless while `form !== 'add'`. */
  let addLevel = $state<ZoneLevel>('region');
  let nameDraft = $state('');
  let codeDraft = $state('');
  /* An add form opens empty, and empty-because-untouched must not look like an
     error. Only leaving the field blank is one. */
  let nameTouched = $state(false);

  /** Edit is about this row; Add is about a row that does not exist yet. */
  const formLevel = $derived(form === 'add' ? addLevel : node.level);
  const formField = $derived(CODE_FIELD[formLevel]);

  function startEdit() {
    nameDraft = node.name;
    codeDraft = node.code;
    nameTouched = false;
    form = 'edit';
  }

  function startAdd(level: ZoneLevel) {
    addLevel = level;
    nameDraft = '';
    codeDraft = '';
    nameTouched = false;
    form = 'add';
  }

  /** Mirrors the server's per-level code shape, so a typo costs no round trip. */
  const codeValid = $derived(formField.pattern.test(codeDraft.trim()));
  const canSubmit = $derived(nameDraft.trim() !== '' && codeValid);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!canSubmit || busy) return;
    const name = nameDraft.trim();
    const code = codeDraft.trim();
    const accepted =
      form === 'add'
        ? await onAddChild(node, addLevel, name, code)
        : await onIdentityChange(node, name, code);
    if (accepted) form = 'none';
  }

  // Leaving the row closes an open form, so a draft can never land on the area the
  // operator clicked away to. Reading `node.id` is what makes that the dependency —
  // the form must survive a fee change on the same row. It is also what puts the
  // panel back after a successful add, since the selection moves to the new child.
  $effect(() => {
    if (node.id) form = 'none';
  });
</script>

<Card.Root class="gap-0 py-0">
  {#if form !== 'none'}
    <!--
      Where the new area lands is shown as a breadcrumb rather than said in a
      sentence: "Inside Toscana. It inherits that area's fee until you give it one."
      was three lines of prose for one fact the tree already displays.
    -->
    <div class="border-b px-4 py-2.5">
      {#if form === 'add'}
        <p class="text-xs text-muted-foreground">
          {chain.map((step) => (step.level === 'cap' ? step.code : step.name)).join(' › ')}
        </p>
      {/if}
      <h2 class="text-sm font-semibold">
        {form === 'add' ? 'Add' : 'Edit'}
        {LEVEL_LABEL[formLevel].toLowerCase()}
      </h2>
    </div>

    <!-- Enter submits, so the form is finished from the keyboard it was typed on. -->
    <form class="space-y-3 px-4 py-3.5" onsubmit={submit}>
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
          placeholder={formLevel === 'cap' ? 'Lido di Ostia' : 'Fiumicino'}
          onblur={() => (nameTouched = true)}
          aria-invalid={nameTouched && nameDraft.trim() === '' ? 'true' : undefined}
        />
      </div>

      <div>
        <div class="mb-1.5 flex items-center gap-1">
          <Label for="zone-code">{formField.label}</Label>
          <InfoHint label="the {formField.label} field">{formField.hint}</InfoHint>
        </div>
        <Input
          id="zone-code"
          bind:value={codeDraft}
          autocomplete="off"
          disabled={(isCountry && form === 'edit') || busy}
          class={cn(DENSE_INPUT, 'font-mono')}
          placeholder={formField.placeholder}
          aria-invalid={codeDraft.trim() !== '' && !codeValid ? 'true' : undefined}
        />
        <!-- The only prose left on a field, and only once it is wrong: a malformed
             code is the one mistake that produces a row which looks correct. -->
        {#if codeDraft.trim() !== '' && !codeValid}
          <p class="mt-1.5 text-xs font-medium text-destructive">{formField.hint}</p>
        {/if}
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" disabled={busy} onclick={() => (form = 'none')}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!canSubmit || busy}>
          {form === 'add' ? 'Add area' : 'Save'}
        </Button>
      </div>
    </form>
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
      <Button variant="outline" size="sm" disabled={!canWrite || busy} onclick={startEdit}>
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
          <span class="font-medium text-amber-600 dark:text-amber-400">phone quote</span>
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

      {#if allowed.length > 0 && canCreate}
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
              <Button variant="outline" size="sm" disabled={busy} onclick={() => startAdd(level)}>
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
              <span class="text-xs font-semibold text-amber-600 dark:text-amber-400">Da confermare</span>
            {/if}
          </div>
          <div class="flex justify-between gap-3 border-t pt-1.5 font-semibold">
            <span>Totale</span>
            {#if previewTotal}
              <span class="tabular-nums">{formatMoney(previewTotal)}</span>
            {:else}
              <span class="text-xs text-amber-600 dark:text-amber-400">{formatMoney(rentalSubtotal)} + consegna</span>
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
