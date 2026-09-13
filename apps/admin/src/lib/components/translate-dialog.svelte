<!--
  "Generate the other languages from one."

  Three steps in one modal, because they are one decision: confirm (which
  languages, from which source, and what is left alone), run (a line per
  language), review (what came back, per language, with a toggle). The three
  steps are their own components; this file owns the state and the requests.

  The unit is a field, not a language: a product carries its translation row,
  its chips, every photo's alt text, every spec's text value, every add-on's
  name and description, every FAQ. Fields are grouped into sections for the
  operator and into protection groups for the rule — see `translation-plan.ts`
  for why the group, and not the language or the field, is what an operator's
  own wording protects.

  The source is a control, not Italian: an operator who fixed up the French copy
  by hand should be able to push it to German.

  It writes nothing itself — `onApply` belongs to the caller, which maps the
  keys back onto the endpoints a product is saved through.
-->
<script lang="ts">
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import TranslationConfirm from '~/lib/components/translation-confirm.svelte';
  import TranslationLog from '~/lib/components/translation-log.svelte';
  import TranslationReview from '~/lib/components/translation-review.svelte';
  import {
    autoTranslate,
    defaultSource,
    fieldPayload,
    fillableCount,
    isLanguageCode,
    languageOf,
    planTranslations,
    SOURCE_LANGUAGE,
    type LanguagePlan,
    type PlanField,
    type TargetLanguageCode,
    type TranslationLogLine,
  } from '~/lib/i18n';
  import { errorMessage } from '~/lib/request';

  interface Props {
    open: boolean;
    /** Every translatable field on the record, with its per-language text. */
    fields: PlanField[];
    /** Persist the accepted rows. Rejecting keeps the dialog open with its error. */
    onApply: (rows: Partial<Record<TargetLanguageCode, Record<string, string>>>) => Promise<void>;
  }

  let { open = $bindable(), fields, onApply }: Props = $props();

  type Phase = 'confirm' | 'running' | 'review';

  let phase = $state<Phase>('confirm');
  let sourceCode = $state<string>(SOURCE_LANGUAGE);
  /** Targets the operator unticked; everything with something to fill is chosen. */
  let excluded = $state<TargetLanguageCode[]>([]);
  let lines = $state<TranslationLogLine[]>([]);
  let rows = $state<Partial<Record<TargetLanguageCode, Record<string, string>>>>({});
  let refused = $state<Partial<Record<TargetLanguageCode, Record<string, string>>>>({});
  /** Keys written from another field rather than translated, for the review. */
  let derivedKeys = $state<Partial<Record<TargetLanguageCode, string[]>>>({});
  let included = $state<TargetLanguageCode[]>([]);
  let saving = $state(false);
  let failure = $state<string | null>(null);
  let nextLineId = 0;
  let completed = $state(0);
  let total = $state(0);

  const source = $derived(isLanguageCode(sourceCode) ? sourceCode : SOURCE_LANGUAGE);
  const plans = $derived(planTranslations(fields, source));
  const sourceLabel = $derived(languageOf(source).label);
  const fieldByKey = $derived(new Map(fields.map((field) => [field.key, field])));
  const chosenCount = $derived(
    plans.filter((plan) => fillableCount(plan) > 0 && !excluded.includes(plan.code)).length,
  );

  let wasOpen = false;
  $effect(() => {
    if (open && !wasOpen) reset();
    wasOpen = open;
  });

  function reset() {
    phase = 'confirm';
    sourceCode = defaultSource(fields);
    excluded = [];
    lines = [];
    rows = {};
    refused = {};
    derivedKeys = {};
    included = [];
    saving = false;
    failure = null;
    completed = 0;
    total = 0;
  }

  function toggleTarget(code: TargetLanguageCode) {
    excluded = excluded.includes(code)
      ? excluded.filter((entry) => entry !== code)
      : [...excluded, code];
  }

  function toggleIncluded(code: TargetLanguageCode) {
    included = included.includes(code)
      ? included.filter((entry) => entry !== code)
      : [...included, code];
  }

  function replaceLine(id: number, tone: TranslationLogLine['tone'], text: string) {
    lines = lines.map((line) => (line.id === id ? { ...line, tone, text } : line));
  }

  /**
   * Values copied from another field in the same language instead of translated
   * — a meta title from the title, when the source has no meta title to
   * translate. `clamp` may cut our own derivation to fit the server's cap;
   * a *translation* is refused instead, because that text is the provider's.
   */
  function derive(plan: LanguagePlan, accepted: Record<string, string>): Record<string, string> {
    const derived: Record<string, string> = {};
    for (const field of plan.derived) {
      const fromKey = field.deriveFrom;
      if (!fromKey) continue;
      const existing = fieldByKey.get(fromKey)?.values[plan.code] ?? '';
      const text = (accepted[fromKey] ?? existing).trim();
      if (text) derived[field.key] = clamp(text, field.maxLength);
    }
    return derived;
  }

  function clamp(text: string, maxLength?: number): string {
    if (maxLength === undefined || text.length <= maxLength) return text;
    const cut = text.slice(0, maxLength);
    const atSpace = cut.lastIndexOf(' ');
    // Only break on a space if it does not throw away most of the sentence.
    return (atSpace > maxLength * 0.6 ? cut.slice(0, atSpace) : cut).trimEnd();
  }

  function summary(
    plan: LanguagePlan,
    accepted: Record<string, string>,
    derived: Record<string, string>,
    tooLong: Record<string, string>,
  ): string {
    const derivedCount = Object.keys(derived).length;
    const parts = [
      `${Object.keys(accepted).length - derivedCount} of ${plan.gaps.length} fields translated`,
    ];
    if (derivedCount > 0) parts.push(`${derivedCount} derived`);
    if (Object.keys(tooLong).length > 0) parts.push(`${Object.keys(tooLong).length} too long`);
    return `${plan.label} — ${parts.join(', ')}.`;
  }

  async function run() {
    phase = 'running';
    failure = null;
    lines = [];
    rows = {};
    refused = {};
    completed = 0;
    total = chosenCount;

    // Skips first, so the log explains what will NOT appear before it reports
    // what will.
    for (const plan of plans) {
      for (const group of plan.kept) {
        lines.push({
          id: nextLineId++,
          tone: 'skipped',
          text: `${plan.label} · ${group.label} kept — ${group.authored.map((field) => field.label.toLowerCase()).join(', ')} written by hand.`,
        });
      }
    }

    for (const plan of plans.filter((entry) => fillableCount(entry) > 0)) {
      if (excluded.includes(plan.code)) continue;

      const lineId = nextLineId++;
      lines.push({ id: lineId, tone: 'pending', text: `Translating details to ${plan.label}…` });
      try {
        const result =
          plan.gaps.length > 0
            ? await autoTranslate.translate({
                source,
                target: plan.code,
                fields: fieldPayload(plan.gaps, source),
              })
            : {};

        // A value the server would reject is reported, not truncated: cutting a
        // translated chip to 20 characters invents copy nobody wrote.
        const accepted: Record<string, string> = {};
        const tooLong: Record<string, string> = {};
        for (const [key, text] of Object.entries(result)) {
          const maxLength = fieldByKey.get(key)?.maxLength;
          if (maxLength !== undefined && text.length > maxLength) {
            tooLong[key] = `${text.length}/${maxLength} characters`;
            continue;
          }
          accepted[key] = text;
        }

        // Fill the fields the source had nothing for from another field in this
        // language — a meta title from the title. Not sent to the provider,
        // because there was nothing to send it.
        const derived = derive(plan, accepted);
        Object.assign(accepted, derived);

        rows[plan.code] = accepted;
        refused[plan.code] = tooLong;
        derivedKeys[plan.code] = Object.keys(derived);
        replaceLine(lineId, 'done', summary(plan, accepted, derived, tooLong));
      } catch (err) {
        replaceLine(lineId, 'error', `${plan.label} failed — ${errorMessage(err)}`);
      }
      completed += 1;
    }

    included = (Object.keys(rows) as TargetLanguageCode[]).filter(
      (code) => Object.keys(rows[code] ?? {}).length > 0,
    );
    phase = 'review';
  }

  async function save() {
    saving = true;
    failure = null;
    try {
      const picked: Partial<Record<TargetLanguageCode, Record<string, string>>> = {};
      for (const code of included) {
        const row = rows[code];
        if (row) picked[code] = row;
      }
      await onApply(picked);
      open = false;
    } catch (err) {
      failure = errorMessage(err);
    } finally {
      saving = false;
    }
  }

  const progress = $derived(total === 0 ? 0 : (completed / total) * 100);
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-3xl lg:max-w-5xl">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <SparklesIcon class="size-4 text-primary" />
        Generate translations
      </Dialog.Title>
      <Dialog.Description>
        {#if phase === 'confirm'}
          Fill the languages you have not written in yet, from one you have.
        {:else if phase === 'running'}
          Translating {total} {total === 1 ? 'language' : 'languages'} from {sourceLabel}.
        {:else}
          Review what came back, then save it. Nothing is written until you do.
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    {#if phase === 'confirm'}
      <TranslationConfirm
        {fields}
        {plans}
        {excluded}
        bind:sourceCode
        onToggleTarget={toggleTarget}
      />

      <Dialog.Footer>
        <Dialog.Close>Cancel</Dialog.Close>
        {#if chosenCount > 0}
          <Button onclick={run}>
            <SparklesIcon />
            Generate {chosenCount}
            {chosenCount === 1 ? 'language' : 'languages'}
          </Button>
        {:else if plans.some((plan) => plan.gaps.length > 0)}
          <!-- Absent rather than disabled, with the reason where the action would
               be: a greyed-out button teaches that the feature is broken. -->
          <p class="text-xs text-muted-foreground">Tick at least one language to generate.</p>
        {/if}
      </Dialog.Footer>
    {:else if phase === 'running'}
      <TranslationLog {lines} {progress} />
      {#if autoTranslate.provider}
        <p class="text-xs text-muted-foreground">
          Answered by <span class="font-mono">{autoTranslate.provider}</span>. Nothing is saved
          until you review it.
        </p>
      {/if}
    {:else}
      <div class="max-h-[60vh] overflow-y-auto pr-1">
        <TranslationReview
          {fields}
          {rows}
          {refused}
          {derivedKeys}
          {included}
          onToggle={toggleIncluded}
        />
      </div>

      {#if failure}
        <p
          class="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {failure}
        </p>
      {/if}

      <Dialog.Footer>
        <Button variant="ghost" onclick={() => (phase = 'confirm')}>Back</Button>
        {#if included.length > 0}
          <Button onclick={save} disabled={saving}>
            {#if saving}<Spinner />{/if}
            {saving
              ? 'Saving…'
              : `Save ${included.length} ${included.length === 1 ? 'language' : 'languages'}`}
          </Button>
        {:else}
          <p class="text-xs text-muted-foreground">Nothing to save — go back and try again.</p>
        {/if}
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
