<!--
  Which languages this ONE field has no text for.

  Replaces the `EN missing` badge, which had three problems beyond not scaling:
  it named a single language, it was amber — the colour this admin uses for
  "something is wrong" — and it said what was absent without saying what to do.

  An untranslated field is not a fault. The storefront falls back to the source
  language, so a French title that does not exist renders the Italian one and
  the page is correct. So this is muted and factual: the codes still to write,
  and nothing at all when there are none.

  It is also the anchor for automatic translation. When `autoTranslate.available`
  becomes true, the action belongs here — attached to the specific gap it would
  fill — and `onTranslate` is the prop that carries it. Until then no control is
  rendered, because a dead button is a worse message than no button.
-->
<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { autoTranslate, gapsIn, type LocalizedLike, languageOf } from '~/lib/i18n';

  interface Props {
    value: LocalizedLike | null | undefined;
    /** Set when this field can be machine-translated; only shown if the feature is on. */
    onTranslate?: (() => void) | undefined;
    class?: string;
  }

  let { value, onTranslate, class: className }: Props = $props();

  const gaps = $derived(gapsIn(value));
  const names = $derived(gaps.map((code) => languageOf(code).label).join(', '));
</script>

{#if gaps.length > 0}
  <span class={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
    <span class="sr-only">Not yet translated into {names}.</span>
    <span aria-hidden="true" class="tracking-wide">
      {#each gaps as code, index (code)}
        {index > 0 ? ' · ' : ''}<span class="uppercase" title={languageOf(code).label}>{code}</span>
      {/each}
    </span>
    {#if onTranslate && autoTranslate.available}
      <button
        type="button"
        onclick={onTranslate}
        class="cursor-pointer text-primary underline-offset-2 hover:underline"
      >
        translate
      </button>
    {/if}
  </span>
{/if}
