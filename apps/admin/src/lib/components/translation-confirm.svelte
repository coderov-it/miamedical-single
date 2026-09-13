<!--
  Confirm step. Which source, which languages, and — before anything runs —
  what will be left alone.

  The summary is by section rather than by field because a product with five
  FAQs and ten specs produces forty fields per language, and forty checkboxes
  is not a choice anyone makes. The sections say what is in scope; the target
  list says how much; "Kept as you wrote them" says what the run will not
  touch, which is the part an operator has to be able to predict.
-->
<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import {
    authoredSummary,
    fillableCount,
    languageOf,
    type LanguageCode,
    type LanguagePlan,
    type PlanField,
    sourceLanguages,
    summariseSections,
    type TargetLanguageCode,
  } from '~/lib/i18n';

  interface Props {
    fields: PlanField[];
    plans: LanguagePlan[];
    /** Targets the operator unticked. */
    excluded: TargetLanguageCode[];
    sourceCode: string;
    onToggleTarget: (code: TargetLanguageCode) => void;
  }

  let { fields, plans, excluded, sourceCode = $bindable(), onToggleTarget }: Props = $props();

  const source = $derived(languageOf(sourceCode as LanguageCode));
  const sourceOptions = $derived(sourceLanguages(fields));
  const sections = $derived(summariseSections(fields));

  const translatable = $derived(plans.filter((plan) => fillableCount(plan) > 0));
  const chosen = $derived(translatable.filter((plan) => !excluded.includes(plan.code)));

  /** Languages where at least one field is filled from another field, not translated. */
  const derivesSomething = $derived(chosen.some((plan) => plan.derived.length > 0));

  const keptEntries = $derived(
    chosen.flatMap((plan) => plan.kept.map((group) => ({ code: plan.code, group }))),
  );
  const blockedReasons = $derived([
    ...new Set(
      plans.flatMap((plan) =>
        plan.groups.filter((group) => group.blockedReason).map((group) => group.blockedReason!),
      ),
    ),
  ]);

  const emptyMessage = $derived.by(() => {
    if (sourceOptions.length <= 1) {
      return 'This record has a single language so far — there is nothing to generate from it.';
    }
    if (blockedReasons.length > 0) {
      return `Nothing to generate: ${blockedReasons.join(', ')}.`;
    }
    return 'Every other language already has text — written by you, or by an earlier run. Clear one to generate it again.';
  });
</script>

<div class="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
  {#if translatable.length === 0}
    <p class="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground" role="status">
      {emptyMessage}
    </p>
  {:else}
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <span class="text-muted-foreground">Generate</span>
      {#each chosen as plan (plan.code)}
        <span
          class="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-medium text-primary uppercase"
        >
          {plan.code}
        </span>
      {/each}
      <span class="text-muted-foreground">from</span>
      <span class="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-medium uppercase">
        {source.code}
      </span>
    </div>

    <div>
      <Label class="mb-1.5" for="translate-source">Source language</Label>
      <Select.Root type="single" bind:value={sourceCode}>
        <Select.Trigger id="translate-source" class="w-full">{source.label}</Select.Trigger>
        <Select.Content>
          {#each sourceOptions as code (code)}
            <Select.Item value={code}>{languageOf(code).label}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

    <div class="space-y-1">
      <Label>Languages to fill</Label>
      {#each plans as plan (plan.code)}
        <div class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
          {#if fillableCount(plan) > 0}
            <Checkbox
              checked={!excluded.includes(plan.code)}
              onCheckedChange={() => onToggleTarget(plan.code)}
            />
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-2 text-left"
              onclick={() => onToggleTarget(plan.code)}
            >
              <span>{plan.label}</span>
              <span class="text-xs text-muted-foreground uppercase">{plan.code}</span>
              <span class="ml-auto text-xs text-muted-foreground">
                {fillableCount(plan)}
                {fillableCount(plan) === 1 ? 'field' : 'fields'}
              </span>
            </button>
          {:else}
            <span class="size-4 shrink-0 rounded-[4px] border border-dashed"></span>
            <span class="text-muted-foreground">{plan.label}</span>
            <span class="text-xs text-muted-foreground uppercase">{plan.code}</span>
            <span class="ml-auto text-xs text-muted-foreground">nothing new</span>
          {/if}
        </div>
      {/each}
    </div>

    <div>
      <Label class="mb-1.5">In scope</Label>
      <div class="flex flex-wrap gap-1.5">
        {#each sections as section (section.name)}
          <span class="rounded-md bg-muted px-1.5 py-0.5 text-xs">
            {section.name} · {section.count}
          </span>
        {/each}
      </div>
    </div>

    {#if derivesSomething}
      <p class="text-xs text-muted-foreground">
        "Meta title" and "Meta description" have nothing in {source.label} to translate, so they are filled
        from that language's own title and short description.
      </p>
    {/if}

    {#if keptEntries.length > 0}
      <div>
        <Label class="mb-1.5">Kept as you wrote them</Label>
        <ul class="space-y-0.5 text-xs text-muted-foreground">
          {#each keptEntries.slice(0, 8) as entry (`${entry.code}:${entry.group.id}`)}
            <li>
              {entry.group.label} · {languageOf(entry.code).label} — {authoredSummary(entry.group)}
            </li>
          {/each}
        </ul>
        {#if keptEntries.length > 8}
          <p class="mt-0.5 text-xs text-muted-foreground">and {keptEntries.length - 8} more.</p>
        {/if}
      </div>
    {/if}
  {/if}
</div>
