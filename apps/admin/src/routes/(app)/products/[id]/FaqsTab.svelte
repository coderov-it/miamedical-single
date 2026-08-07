<script lang="ts">
  import { api } from '~/lib/api';
  import SortableList from '~/lib/components/SortableList.svelte';
  import TranslatedInput from '~/lib/components/TranslatedInput.svelte';
  import TranslatedTextarea from '~/lib/components/TranslatedTextarea.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import type { AdminProduct, Localized, TabProps } from './shared';
  import { localizedOf, localizedOrNull } from './shared';

  let { product, onSaved }: TabProps = $props();

  interface FaqEdit {
    question: Localized;
    answer: Localized;
    isActive: boolean;
  }

  let faqs = $state<FaqEdit[]>(
    product.faqs.map((faq) => ({
      question: localizedOf(faq.question),
      answer: localizedOf(faq.answer),
      isActive: faq.isActive,
    })),
  );
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});
  let savedFlash = $state(false);

  async function save() {
    saving = true;
    error = null;
    fields = {};
    try {
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].faqs.$put({
          param: { id: product.id },
          json: faqs.map((faq, position) => ({
            question: localizedOrNull(faq.question) ?? { it: '' },
            answer: localizedOrNull(faq.answer) ?? { it: '' },
            isActive: faq.isActive,
            position,
          })),
        }),
      );
      onSaved(updated);
      savedFlash = true;
      setTimeout(() => (savedFlash = false), 2000);
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }
</script>

<div class="flex max-w-2xl flex-col gap-4">
  <SortableList bind:items={faqs} onRemove={(index) => (faqs = faqs.filter((_, i) => i !== index))}>
    {#snippet row(faq)}
      <div class="flex flex-col gap-3">
        <TranslatedInput label="Question" bind:value={faq.question} />
        <TranslatedTextarea label="Answer" bind:value={faq.answer} rows={3} required />
        <label class="flex items-center gap-1.5 text-xs">
          <input type="checkbox" bind:checked={faq.isActive} /> Visible on the site
        </label>
      </div>
    {/snippet}
  </SortableList>

  <button
    type="button"
    onclick={() => (faqs = [...faqs, { question: { it: '' }, answer: { it: '' }, isActive: true }])}
    class="self-start rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-500 transition hover:border-neutral-400 dark:border-neutral-700"
  >
    + Add FAQ
  </button>

  {#if error}
    <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
      {error}
      {#each Object.entries(fields) as [path, message] (path)}
        <span class="block text-xs">{path}: {message}</span>
      {/each}
    </p>
  {/if}

  <div class="flex items-center justify-end gap-3">
    {#if savedFlash}<span class="text-sm text-green-600">Saved ✓</span>{/if}
    <button
      type="button"
      onclick={() => void save()}
      disabled={saving}
      class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
    >
      {saving ? 'Saving…' : 'Save FAQs'}
    </button>
  </div>
</div>
