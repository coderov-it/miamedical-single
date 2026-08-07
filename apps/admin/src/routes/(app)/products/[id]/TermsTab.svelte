<script lang="ts">
  import { api } from '~/lib/api';
  import { errorMessage, unwrap } from '~/lib/request';
  import type { AdminProduct, AdminTerms, TabProps } from './shared';

  let { product, onSaved }: TabProps = $props();

  let documents = $state<AdminTerms[]>([]);
  let selected = $state<string[]>([...product.termsIds]);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let savedFlash = $state(false);

  $effect(() => {
    void api.api.admin.terms
      .$get()
      .then((response) => unwrap<AdminTerms[]>(response))
      .then((data) => (documents = data))
      .catch((err) => (error = errorMessage(err)));
  });

  function toggle(id: string) {
    selected = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
  }

  async function save() {
    saving = true;
    error = null;
    try {
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].terms.$put({
          param: { id: product.id },
          json: selected.map((termsId, position) => ({ termsId, position })),
        }),
      );
      onSaved(updated);
      selected = [...updated.termsIds];
      savedFlash = true;
      setTimeout(() => (savedFlash = false), 2000);
    } catch (err) {
      error = errorMessage(err);
    } finally {
      saving = false;
    }
  }
</script>

<div class="flex max-w-2xl flex-col gap-4">
  <p class="text-xs text-neutral-500">
    Linked documents are shown on the product page and accepted at checkout. Order follows the
    list below.
  </p>

  <div class="flex flex-col gap-2">
    {#each documents as doc (doc.id)}
      <label
        class="flex items-center gap-3 rounded-xl border p-3 text-sm transition"
        class:border-brand-600={selected.includes(doc.id)}
        class:border-neutral-200={!selected.includes(doc.id)}
        class:dark:border-neutral-800={!selected.includes(doc.id)}
      >
        <input
          type="checkbox"
          checked={selected.includes(doc.id)}
          onchange={() => toggle(doc.id)}
        />
        <span class="flex-1">
          <span class="font-medium">{doc.translations.it?.title ?? doc.code}</span>
          <span class="ml-2 text-xs text-neutral-500">v{doc.version} · {doc.status}</span>
        </span>
        {#if doc.status !== 'published'}
          <span class="text-xs text-amber-600">not published</span>
        {/if}
      </label>
    {:else}
      <p class="text-sm text-neutral-500">
        No terms documents yet — create one under <a href="/terms" class="underline">Terms</a>.
      </p>
    {/each}
  </div>

  {#if error}
    <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
  {/if}

  <div class="flex items-center justify-end gap-3">
    {#if savedFlash}<span class="text-sm text-green-600">Saved ✓</span>{/if}
    <button
      type="button"
      onclick={() => void save()}
      disabled={saving}
      class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
    >
      {saving ? 'Saving…' : 'Save links'}
    </button>
  </div>
</div>
