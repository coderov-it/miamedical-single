<!--
  One translated text field. Binds a plain `{ it, en, … }` object — which is
  both what the jsonb columns hold and what the mapper hands back for products
  and categories, so this covers every translated field regardless of the
  storage style behind it.

  Which language it edits is the form's ContentLang (context) — the switcher at
  the top of each editor. The field itself only reports status, via
  `translation-gaps.svelte`: the languages still to write, muted, because a
  half-translated product is a normal working state and the storefront falls
  back to the source language.

  While editing any target language the source text stays visible under the
  input, as the thing being translated.
-->
<script lang="ts">
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { useContentLang } from '~/lib/content-lang.svelte';
  import { type LocalizedValue, setTextFor, SOURCE_LANGUAGE, textFor } from '~/lib/i18n';

  import TranslationGaps from './translation-gaps.svelte';

  interface Props {
    label: string;
    value: LocalizedValue;
    error?: string | undefined;
    hint?: string | undefined;
    required?: boolean;
    placeholder?: string;
    /** Renders a textarea instead of a single-line input. */
    multiline?: boolean;
    rows?: number;
    id?: string;
  }

  let {
    label,
    value = $bindable(),
    error,
    hint,
    required = true,
    placeholder = '',
    multiline = false,
    rows = 3,
    id,
  }: Props = $props();

  const contentLang = useContentLang();
  const lang = $derived(contentLang.current);
  const isSource = $derived(lang === SOURCE_LANGUAGE);

  // `$props.id()` is stable per component instance and hydration-safe, which a
  // `Math.random()` id is not — the label's `for` has to survive a rerender.
  const generatedId = $props.id();
  const fieldId = $derived(id ?? generatedId);
  const describedBy = $derived(error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined);

  const current = $derived(textFor(value, lang));
  const sourceText = $derived(textFor(value, SOURCE_LANGUAGE));

  // `setTextFor` is what keeps an emptied target language `undefined` rather
  // than `''` — see the note on it: a blank string would look like a real
  // translation and hide the gap.
  const setText = (text: string) => setTextFor(value, lang, text);
</script>

<div>
  <div class="mb-1.5 flex items-center justify-between gap-2">
    <Label for={fieldId}>
      {label}
      <!-- The asterisk belongs to the source language only: it is the one the
           CHECK constraint and the validator actually require. -->
      {#if required && isSource}<span class="text-destructive">*</span>{/if}
    </Label>

    <TranslationGaps {value} />
  </div>

  {#if multiline}
    <Textarea
      id={fieldId}
      {rows}
      {placeholder}
      value={current}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describedBy}
      oninput={(event) => setText(event.currentTarget.value)}
    />
  {:else}
    <Input
      id={fieldId}
      type="text"
      {placeholder}
      value={current}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describedBy}
      oninput={(event) => setText(event.currentTarget.value)}
    />
  {/if}

  {#if error}
    <p id="{fieldId}-error" class="mt-1 text-xs text-destructive" role="alert">{error}</p>
  {:else if hint}
    <p id="{fieldId}-hint" class="mt-1 text-xs text-muted-foreground">{hint}</p>
  {/if}

  {#if !isSource && sourceText.trim()}
    <p class="mt-1 truncate text-xs text-muted-foreground" title={sourceText}>
      <span class="font-medium uppercase">{SOURCE_LANGUAGE}</span> · {sourceText}
    </p>
  {/if}
</div>
