<!--
  The one content-language control an editor puts at its top. Replaces the
  IT/EN tab pair, which did not survive a third language.

  Two shapes, one behaviour:
    • up to INLINE_SWITCHER_LIMIT languages — a row of buttons, as before
    • past it — a dropdown, because a row of six is a scanning problem

  Both render from the registry, so a newly registered language appears here
  with no edit, and both show per-language progress rather than singling out one
  language's absence. `enMissing` is gone: a boolean about English cannot
  describe three target languages, and the amber dot it drove told an operator
  that a normal working state was a fault.

  Progress states, and why "partial" is the one that matters:
    complete  — every field has text        · no marker, nothing to do
    partial   — some fields, not all        · amber ring, someone stopped halfway
    missing   — no fields at all            · muted ring, not started, storefront
                                              falls back to Italian and is fine
-->
<script lang="ts">
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { cn } from '$lib/utils.js';
  import type { ContentLang } from '~/lib/content-lang.svelte';
  import {
    INLINE_SWITCHER_LIMIT,
    LANGUAGES,
    type LanguageProgress,
    languageOf,
    translationSummary,
  } from '~/lib/i18n';

  interface Props {
    lang: ContentLang;
    /**
     * Per-language completeness. Omit it and the switcher is a plain picker —
     * correct for a form whose fields are not translated field-by-field.
     */
    progress?: LanguageProgress[];
    class?: string;
  }

  let { lang, progress, class: className }: Props = $props();

  const byCode = $derived(new Map((progress ?? []).map((entry) => [entry.code, entry])));
  const stateOf = $derived((code: string) => byCode.get(code as never)?.state);
  const asDropdown = LANGUAGES.length > INLINE_SWITCHER_LIMIT;

  const summary = $derived(progress ? translationSummary(progress) : undefined);
  const currentLabel = $derived(languageOf(lang.current).label);

  /* Muted, not amber, when a language simply has not been started: it is a
     fallback the storefront handles, not a defect. Amber is reserved for
     half-finished, which no fallback can rescue. */
  const RING: Record<string, string> = {
    partial: 'bg-amber-500',
    missing: 'bg-muted-foreground/35',
  };
</script>

<div class={cn('flex items-center gap-3', className)}>
  {#if asDropdown}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        class="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        aria-label="Content language"
      >
        <span class="font-medium">{currentLabel}</span>
        <span class="text-xs text-muted-foreground uppercase">{lang.current}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content class="min-w-48" align="start">
        {#each LANGUAGES as language (language.code)}
          {@const state = stateOf(language.code)}
          <DropdownMenu.CheckboxItem
            checked={lang.current === language.code}
            onCheckedChange={() => lang.set(language.code)}
          >
            <span class="flex-1">{language.label}</span>
            {#if state && RING[state]}
              <span class={cn('size-1.5 rounded-full', RING[state])}></span>
            {/if}
          </DropdownMenu.CheckboxItem>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {:else}
    <div class="flex items-center" role="group" aria-label="Content language">
      {#each LANGUAGES as language (language.code)}
        {@const active = lang.current === language.code}
        {@const state = stateOf(language.code)}
        <button
          type="button"
          onclick={() => lang.set(language.code)}
          aria-pressed={active}
          class={cn(
            'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors',
            active
              ? 'border-primary font-medium text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {language.label}
          {#if state && RING[state]}
            <span
              class={cn('size-1.5 rounded-full', RING[state])}
              title={state === 'partial'
                ? `${language.label} is partly translated`
                : `${language.label} has no translation yet`}
            ></span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}

  {#if summary && summary.total > 0}
    <!-- States the position, not a complaint: "1 of 2 languages translated"
         reads as progress, where "EN missing" read as an error the operator had
         already decided not to care about. -->
    <p class="ml-auto text-xs text-muted-foreground">
      {summary.done} of {summary.total} translated
      {#if summary.incomplete.length > 0}
        <span class="text-muted-foreground/70">
          · {summary.incomplete.map((entry) => entry.code.toUpperCase()).join(' ')} pending
        </span>
      {/if}
    </p>
  {/if}
</div>
