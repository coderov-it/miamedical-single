<!--
  One bilingual text field. Binds a plain `{ it, en }` object — which is both
  what the jsonb columns hold and what the mapper hands back for products and
  categories, so this covers every translated field regardless of the storage
  style behind it.

  Which language it edits is the form's ContentLang (context) — the tab
  switcher at the top of each editor. The field itself only reports status:
  the "EN missing" chip is a standing reminder of translation debt rather
  than an error, because a half-translated product is a normal working state.
  While editing English, the Italian text stays visible under the input as
  the source to translate from.
-->
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { useContentLang } from '~/lib/content-lang.svelte';

  interface Props {
    label: string;
    value: { it: string; en?: string | undefined };
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
  const enMissing = $derived(!value.en?.trim());

  // `$props.id()` is stable per component instance and hydration-safe, which a
  // `Math.random()` id is not — the label's `for` has to survive a rerender.
  const generatedId = $props.id();
  const fieldId = $derived(id ?? generatedId);
  const describedBy = $derived(error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined);

  const current = $derived(lang === 'it' ? value.it : (value.en ?? ''));

  function setText(text: string) {
    // Empty English is `undefined`, not `''` — the API treats a missing
    // translation and a blank one differently, and so does the fallback.
    if (lang === 'it') value.it = text;
    else value.en = text || undefined;
  }
</script>

<div>
  <div class="mb-1.5 flex items-center justify-between gap-2">
    <Label for={fieldId}>
      {label}
      {#if required && lang === 'it'}<span class="text-destructive">*</span>{/if}
    </Label>

    {#if enMissing}
      <Badge variant="outline" class="border-amber-500/40 text-amber-600 dark:text-amber-400">
        EN missing
      </Badge>
    {/if}
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

  {#if lang === 'en' && value.it.trim()}
    <p class="mt-1 truncate text-xs text-muted-foreground" title={value.it}>
      <span class="font-medium uppercase">it</span> · {value.it}
    </p>
  {/if}
</div>
