<script lang="ts">
  import { P } from '@mia/permissions';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { api } from '~/lib/api';
  import SortableList from '~/lib/components/sortable-list.svelte';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import type { AdminProduct, Localized, TabProps } from './shared';
  import { localizedOf, localizedOrNull, sameAsSaved } from './shared';
  import TabPanel from './tab-panel.svelte';

  let { product, onSaved, dirty }: TabProps = $props();

  const SECTION = 'questions';

  interface OptionEdit {
    uid: string;
    value: string;
    label: Localized;
  }

  interface QuestionEdit {
    uid: string;
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
    { value: 'string', label: 'Short text' },
    { value: 'text', label: 'Long text' },
    { value: 'number', label: 'Number' },
    { value: 'single_select', label: 'Single select' },
    { value: 'multi_select', label: 'Multiple select' },
    { value: 'boolean', label: 'Yes / No' },
    { value: 'date', label: 'Date' },
  ] as const;

  const isSelect = (type: string) => type === 'single_select' || type === 'multi_select';

  const snapshot = (source: AdminProduct): QuestionEdit[] =>
    source.questions.map((question) => ({
      uid: question.id ?? crypto.randomUUID(),
      key: question.key,
      prompt: localizedOf(question.prompt),
      helpText: localizedOf(question.helpText),
      questionValueType: question.questionValueType,
      isRequired: question.isRequired,
      minValue: question.minValue?.toString() ?? '',
      maxValue: question.maxValue?.toString() ?? '',
      maxLength: question.maxLength?.toString() ?? '',
      options: question.options.map((option) => ({
        uid: option.id ?? crypto.randomUUID(),
        value: option.value,
        label: localizedOf(option.label),
      })),
    }));

  const comparable = (rows: QuestionEdit[]) =>
    rows.map(({ uid: _uid, options, ...rest }) => ({
      ...rest,
      options: options.map(({ uid: _optionUid, ...option }) => option),
    }));

  let questions = $state(untrack(() => snapshot(product)));
  let saved = $state(untrack(() => comparable(questions)));

  let seededFor = $state(untrack(() => product.id));
  $effect(() => {
    if (product.id === seededFor) return;
    seededFor = product.id;
    questions = snapshot(product);
    saved = comparable(questions);
  });

  const isDirty = $derived(!sameAsSaved(comparable(questions), saved));
  $effect(() => dirty.set(SECTION, isDirty));

  const canUpdate = $derived(session.can(P.PRODUCT_UPDATE));

  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  function addQuestion() {
    questions.push({
      uid: crypto.randomUUID(),
      key: '',
      prompt: { it: '' },
      helpText: { it: '' },
      questionValueType: 'string',
      isRequired: false,
      minValue: '',
      maxValue: '',
      maxLength: '',
      options: [],
    });
  }

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
            // Options only mean something for select types; sending stale ones
            // would resurrect choices removed by switching the type.
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

      questions = snapshot(updated);
      saved = comparable(questions);
      dirty.clear(SECTION);
      onSaved(updated);
      toast.success('Questions saved.');
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }
</script>

<TabPanel
  title="Intake questions"
  description="Answered by the customer at checkout — floor number, lift availability, delivery slot — so the order arrives actionable."
  dirty={isDirty}
  {saving}
  {error}
  onSave={save}
  saveLabel="Save questions"
  disabledReason={canUpdate ? undefined : 'You need product:update to change this.'}
>
  <div class="max-w-3xl space-y-3">
    {#if questions.length === 0}
      <p class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No intake questions yet.
      </p>
    {/if}

    <SortableList
      bind:items={questions}
      key={(question) => question.uid}
      describe={(question) => question.prompt.it || 'this question'}
      onRemove={(index) => questions.splice(index, 1)}
    >
      {#snippet row(question)}
        <div class="space-y-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <Label class="mb-1.5" for="q-key-{question.uid}">Key</Label>
              <Input
                id="q-key-{question.uid}"
                bind:value={question.key}
                placeholder="piano-installazione"
                class="font-mono text-xs"
              />
            </div>
            <div>
              <Label class="mb-1.5">Type</Label>
              <Select.Root type="single" bind:value={question.questionValueType}>
                <Select.Trigger class="w-full">
                  {TYPES.find((type) => type.value === question.questionValueType)?.label ??
                    question.questionValueType}
                </Select.Trigger>
                <Select.Content>
                  {#each TYPES as type (type.value)}
                    <Select.Item value={type.value}>{type.label}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>
          </div>

          <TranslatedInput label="Prompt" bind:value={question.prompt} />
          <TranslatedInput label="Help text" bind:value={question.helpText} required={false} />

          <div class="flex flex-wrap items-end gap-4">
            <div class="flex items-center gap-2 pb-2">
              <Switch
                id="q-required-{question.uid}"
                checked={question.isRequired}
                onCheckedChange={(checked) => (question.isRequired = checked)}
              />
              <Label for="q-required-{question.uid}" class="text-sm">Required</Label>
            </div>

            {#if question.questionValueType === 'number'}
              <div>
                <Label class="mb-1.5" for="q-min-{question.uid}">Min</Label>
                <Input
                  id="q-min-{question.uid}"
                  type="number"
                  bind:value={question.minValue}
                  class="w-20"
                />
              </div>
              <div>
                <Label class="mb-1.5" for="q-max-{question.uid}">Max</Label>
                <Input
                  id="q-max-{question.uid}"
                  type="number"
                  bind:value={question.maxValue}
                  class="w-20"
                />
              </div>
            {/if}

            {#if question.questionValueType === 'string' || question.questionValueType === 'text'}
              <div>
                <Label class="mb-1.5" for="q-len-{question.uid}">Max length</Label>
                <Input
                  id="q-len-{question.uid}"
                  type="number"
                  bind:value={question.maxLength}
                  class="w-24"
                />
              </div>
            {/if}
          </div>

          {#if isSelect(question.questionValueType)}
            <div class="rounded-lg border bg-muted/40 p-3">
              <div class="mb-2 flex items-center justify-between">
                <Label class="text-xs font-semibold">Options</Label>
                <Button
                  variant="ghost"
                  size="xs"
                  onclick={() =>
                    question.options.push({
                      uid: crypto.randomUUID(),
                      value: '',
                      label: { it: '' },
                    })}
                >
                  <PlusIcon />
                  Add option
                </Button>
              </div>

              <div class="space-y-2">
                {#each question.options as option (option.uid)}
                  <div class="flex items-end gap-2">
                    <div>
                      <Label class="mb-1 text-xs" for="q-opt-{option.uid}">Value</Label>
                      <Input
                        id="q-opt-{option.uid}"
                        bind:value={option.value}
                        class="h-8 w-32 font-mono text-xs"
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <TranslatedInput label="Label" bind:value={option.label} />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      class="mb-0.5 text-muted-foreground hover:text-destructive"
                      aria-label="Remove option"
                      onclick={() =>
                        (question.options = question.options.filter(
                          (entry) => entry.uid !== option.uid,
                        ))}
                    >
                      <XIcon />
                    </Button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/snippet}
    </SortableList>

    <Button variant="outline" size="sm" onclick={addQuestion}>
      <PlusIcon />
      Add question
    </Button>

    {#if Object.keys(fields).length > 0}
      <ul class="space-y-0.5 text-xs text-destructive">
        {#each Object.entries(fields) as [path, message] (path)}
          <li><code class="font-mono">{path}</code>: {message}</li>
        {/each}
      </ul>
    {/if}
  </div>
</TabPanel>
