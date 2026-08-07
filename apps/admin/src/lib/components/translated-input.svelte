<!--
  One bilingual text field. Binds a plain `{ it, en }` object — which is both
  what the jsonb columns hold and what the mapper hands back for products and
  categories, so this covers every translated field regardless of the storage
  style behind it.

  The active language follows the global topbar switch, and the per-field tabs
  override it locally. Italian is mandatory; the "EN missing" chip is a
  standing reminder of translation debt rather than an error, because a
  half-translated product is a normal working state, not a broken one.
-->
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { cn } from '$lib/utils.js';
  import { editorLang } from '~/lib/editor-lang.svelte';

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

  let override = $state<'it' | 'en' | null>(null);
  const lang = $derived(override ?? editorLang.current);
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

    <div class="flex items-center gap-1.5">
      {#if enMissing}
        <Badge variant="outline" class="border-amber-500/40 text-amber-600 dark:text-amber-400">
          EN missing
        </Badge>
      {/if}
      <div
        class="flex items-center rounded-md border p-0.5"
        role="group"
        aria-label="Field language"
      >
        {#each ['it', 'en'] as const as tab (tab)}
          <button
            type="button"
            onclick={() => (override = tab)}
            aria-pressed={lang === tab}
            class={cn(
              'rounded-sm px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase transition-colors',
              lang === tab
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
          </button>
        {/each}
      </div>
    </div>
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
</div>
