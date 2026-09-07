<!--
  `translated-input.svelte`'s rich-text twin: one translated `{ it, en, … }`
  HTML field, edited in whichever language the form's ContentLang is on.

  Same rules as the plain field — the gap indicator is muted and factual, and an
  emptied target language is `undefined` so the storefront falls back to the
  source instead of rendering a blank tab. What differs is the source preview: a
  paragraph of HTML cannot sit under the field as one truncated line, so it is a
  collapsed block the translator opens when they want it.
-->
<script lang="ts">
  import * as Collapsible from '$lib/components/ui/collapsible/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { useContentLang } from '~/lib/content-lang.svelte';
  import { gapsIn, type LocalizedValue, setTextFor, SOURCE_LANGUAGE, textFor } from '~/lib/i18n';

  import RichTextEditor from './rich-text-editor.svelte';
  import TranslationGaps from './translation-gaps.svelte';

  interface Props {
    /**
     * Omit it when the panel around this field already names it — the product
     * editor gives the description a whole tab titled "Description", and a label
     * repeating that is the same word twice with nothing between. The editor
     * still needs an accessible name, so `name` always exists.
     */
    label?: string | undefined;
    /** Accessible name for the editing surface. Defaults to `label`. */
    name?: string;
    value: LocalizedValue;
    error?: string | undefined;
    hint?: string | undefined;
  }

  let { label, name, value = $bindable(), error, hint }: Props = $props();

  const ariaLabel = $derived(name ?? label ?? 'Rich text');

  const contentLang = useContentLang();
  const lang = $derived(contentLang.current);
  const isSource = $derived(lang === SOURCE_LANGUAGE);
  const hasGaps = $derived(gapsIn(value).length > 0);

  const current = $derived(textFor(value, lang));
  const sourceHtml = $derived(textFor(value, SOURCE_LANGUAGE));

  const setHtml = (html: string) => setTextFor(value, lang, html);
</script>

<div>
  <!-- No asterisk anywhere: `description` is nullable in the schema and optional
       in the validator, so a product with no long copy is a legal product. -->
  {#if label || hasGaps}
    <div class="mb-1.5 flex min-h-6 items-center justify-between gap-2">
      {#if label}<Label>{label}</Label>{/if}
      <TranslationGaps {value} class="ml-auto" />
    </div>
  {/if}

  <!-- `key` is the language: it tells the editor when the document it holds has
       been swapped for a different one, which is the only time it should reload
       its content from outside. -->
  <RichTextEditor value={current} onChange={setHtml} key={lang} {ariaLabel} />

  {#if error}
    <p class="mt-1 text-xs text-destructive" role="alert">{error}</p>
  {:else if hint}
    <p class="mt-1 text-xs text-muted-foreground">{hint}</p>
  {/if}

  {#if !isSource && sourceHtml.trim()}
    <Collapsible.Root class="mt-2">
      <Collapsible.Trigger
        class="cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        <span class="font-medium uppercase">{SOURCE_LANGUAGE}</span> · show the source text
      </Collapsible.Trigger>
      <Collapsible.Content>
        <div class="source-preview mt-1.5 rounded-lg border bg-muted/30 p-3 text-sm">
          <!-- The Italian side, rendered so the translator sees the structure they
               are translating. Not arbitrary input: this is the value the API
               returned, and the server sanitises description HTML against an
               allowlist on write (packages/validators/src/rich-text.ts). -->
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html sourceHtml}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  {/if}
</div>

<style>
  /* The preview renders the operator's own saved markup, so it needs the same
     block styles the editor gives it. Read-only, hence no editor chrome. */
  :global(.source-preview > * + *) {
    margin-top: 0.6em;
  }
  :global(.source-preview h2),
  :global(.source-preview h3) {
    font-weight: 700;
  }
  :global(.source-preview ul) {
    list-style: disc;
    padding-left: 1.4em;
  }
  :global(.source-preview ol) {
    list-style: decimal;
    padding-left: 1.4em;
  }
</style>
