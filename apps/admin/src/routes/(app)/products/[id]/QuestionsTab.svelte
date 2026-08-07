<script lang="ts">
  import { api } from '~/lib/api';
  import SortableList from '~/lib/components/SortableList.svelte';
  import TranslatedInput from '~/lib/components/TranslatedInput.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import type { AdminProduct, Localized, TabProps } from './shared';
  import { localizedOf, localizedOrNull } from './shared';

  let { product, onSaved }: TabProps = $props();

  interface OptionEdit {
    value: string;
    label: Localized;
  }

  interface QuestionEdit {
    key: string;
    prompt: Localized;
    helpText: Localized;
    questionValueType: string;
    isRequired: boolean;
    minValue: string;
    maxValue: string;
    maxLength: string;
    options: OptionEdit[];
  }

  const TYPES = [
    ['string', 'Short text'],
    ['text', 'Long text'],
    ['number', 'Number'],
    ['single_select', 'Single select'],
    ['multi_select', 'Multiple select'],
    ['boolean', 'Yes / No'],
    ['date', 'Date'],
  ] as const;

  let questions = $state<QuestionEdit[]>(
    product.questions.map((question) => ({
      key: question.key,
      prompt: localizedOf(question.prompt),
      helpText: localizedOf(question.helpText),
      questionValueType: question.questionValueType,
      isRequired: question.isRequired,
      minValue: question.minValue?.toString() ?? '',
      maxValue: question.maxValue?.toString() ?? '',
      maxLength: question.maxLength?.toString() ?? '',
      options: question.options.map((option) => ({
        value: option.value,
        label: localizedOf(option.label),
      })),
    })),
  );
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});
  let savedFlash = $state(false);

  const isSelect = (type: string) => type === 'single_select' || type === 'multi_select';

  async function save() {
    saving = true;
    error = null;
    fields = {};
    try {
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].questions.$put({
          param: { id: product.id },
          json: questions.map((question, position) => ({
            key: question.key,
            prompt: localizedOrNull(question.prompt) ?? { it: '' },
            helpText: localizedOrNull(question.helpText),
            questionValueType: question.questionValueType as 'string',
            isRequired: question.isRequired,
            minValue: question.minValue === '' ? null : Number(question.minValue),
            maxValue: question.maxValue === '' ? null : Number(question.maxValue),
            maxLength: question.maxLength === '' ? null : Number(question.maxLength),
            position,
            options: isSelect(question.questionValueType)
              ? question.options.map((option, optionPosition) => ({
                  value: option.value,
                  label: localizedOrNull(option.label) ?? { it: '' },
                  position: optionPosition,
                }))
              : [],
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
  <p class="text-xs text-neutral-500">
    Intake questions the customer answers when ordering — floor number, lift availability,
    preferred delivery slot — so the order arrives actionable.
  </p>

  <SortableList
    bind:items={questions}
    onRemove={(index) => (questions = questions.filter((_, i) => i !== index))}
  >
    {#snippet row(question)}
      <div class="flex flex-col gap-3">
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-1 block text-xs font-medium">Key</span>
            <input
              type="text"
              bind:value={question.key}
              placeholder="piano-installazione"
              class="w-full rounded-lg border border-neutral-300 px-2 py-1.5 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-medium">Type</span>
            <select
              bind:value={question.questionValueType}
              class="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            >
              {#each TYPES as [value, label] (value)}
                <option {value}>{label}</option>
              {/each}
            </select>
          </label>
        </div>

        <TranslatedInput label="Prompt" bind:value={question.prompt} />
        <TranslatedInput label="Help text" bind:value={question.helpText} required={false} />

        <div class="flex flex-wrap items-center gap-4 text-xs">
          <label class="flex items-center gap-1.5">
            <input type="checkbox" bind:checked={question.isRequired} /> Required
          </label>
          {#if question.questionValueType === 'number'}
            <label class="flex items-center gap-1.5">
              Min <input type="number" bind:value={question.minValue} class="w-16 rounded border border-neutral-300 px-1.5 py-1 dark:border-neutral-700 dark:bg-neutral-900" />
            </label>
            <label class="flex items-center gap-1.5">
              Max <input type="number" bind:value={question.maxValue} class="w-16 rounded border border-neutral-300 px-1.5 py-1 dark:border-neutral-700 dark:bg-neutral-900" />
            </label>
          {/if}
          {#if question.questionValueType === 'string' || question.questionValueType === 'text'}
            <label class="flex items-center gap-1.5">
              Max length
              <input type="number" bind:value={question.maxLength} class="w-16 rounded border border-neutral-300 px-1.5 py-1 dark:border-neutral-700 dark:bg-neutral-900" />
            </label>
          {/if}
        </div>

        {#if isSelect(question.questionValueType)}
          <div class="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/40">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs font-semibold">Options</span>
              <button
                type="button"
                class="text-brand-600 text-xs hover:underline"
                onclick={() => (question.options = [...question.options, { value: '', label: { it: '' } }])}
              >
                + Add option
              </button>
            </div>
            <div class="flex flex-col gap-2">
              {#each question.options as option, optionIndex (optionIndex)}
                <div class="flex items-end gap-2">
                  <label class="block text-xs">
                    <span class="mb-0.5 block">Value</span>
                    <input type="text" bind:value={option.value} class="w-28 rounded border border-neutral-300 px-1.5 py-1 font-mono dark:border-neutral-700 dark:bg-neutral-900" />
                  </label>
                  <div class="flex-1">
                    <TranslatedInput label="Label" bind:value={option.label} />
                  </div>
                  <button
                    type="button"
                    class="pb-1.5 text-xs text-red-500 hover:text-red-700"
                    onclick={() =>
                      (question.options = question.options.filter((_, i) => i !== optionIndex))}
                    aria-label="Remove option">✕</button
                  >
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/snippet}
  </SortableList>

  <button
    type="button"
    onclick={() =>
      (questions = [
        ...questions,
        {
          key: '',
          prompt: { it: '' },
          helpText: { it: '' },
          questionValueType: 'string',
          isRequired: false,
          minValue: '',
          maxValue: '',
          maxLength: '',
          options: [],
        },
      ])}
    class="self-start rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-500 transition hover:border-neutral-400 dark:border-neutral-700"
  >
    + Add question
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
      {saving ? 'Saving…' : 'Save questions'}
    </button>
  </div>
</div>
