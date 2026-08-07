<script lang="ts">
  import { editorLang } from '../editor-lang.svelte';

  /** Textarea sibling of TranslatedInput — same `{ it, en }` binding contract. */
  let {
    label,
    value = $bindable(),
    error,
    required = false,
    rows = 4,
  }: {
    label: string;
    value: { it: string; en?: string | undefined };
    error?: string | undefined;
    required?: boolean;
    rows?: number;
  } = $props();

  let override = $state<'it' | 'en' | null>(null);
  const lang = $derived(override ?? editorLang.current);
  const enMissing = $derived(!value.en?.trim());

  function setText(text: string) {
    if (lang === 'it') value.it = text;
    else value.en = text || undefined;
  }
</script>

<div class="block">
  <div class="mb-1 flex items-center justify-between">
    <span class="text-sm font-medium">
      {label}
      {#if required && lang === 'it'}<span class="text-red-500">*</span>{/if}
    </span>
    <span class="flex items-center gap-1">
      {#if enMissing}
        <span class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
          >EN missing</span
        >
      {/if}
      {#each ['it', 'en'] as const as tab (tab)}
        <button
          type="button"
          class="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
          class:bg-brand-600={lang === tab}
          class:text-white={lang === tab}
          class:text-neutral-400={lang !== tab}
          onclick={() => (override = tab)}
        >
          {tab}
        </button>
      {/each}
    </span>
  </div>
  <textarea
    {rows}
    value={lang === 'it' ? value.it : (value.en ?? '')}
    oninput={(event) => setText(event.currentTarget.value)}
    class="focus:border-brand-500 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
    class:border-red-400={Boolean(error)}
  ></textarea>
  {#if error}
    <span class="mt-1 block text-xs text-red-600" role="alert">{error}</span>
  {/if}
</div>
