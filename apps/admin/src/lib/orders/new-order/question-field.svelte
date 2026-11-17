<!-- One intake question of a product, drawn as the control its answer type needs. -->
<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import type { LineDraft } from './line-draft';

  interface Props {
    id: string;
    line: LineDraft;
    question: LineDraft['product']['questions'][number];
    error: string | undefined;
    onAnswer: () => void;
  }

  let { id, line, question, error, onAnswer }: Props = $props();

  const values = $derived(line.answers[question.key] ?? []);

  function set(next: string[]) {
    line.answers[question.key] = next;
    onAnswer();
  }

  function toggle(value: string, on: boolean) {
    set(
      on
        ? [...values.filter((entry) => entry !== value), value]
        : values.filter((v) => v !== value),
    );
  }

  function inputType(valueType: string): 'number' | 'date' | 'text' {
    if (valueType === 'number') return 'number';
    if (valueType === 'date') return 'date';
    return 'text';
  }
</script>

<div>
  <Label class="mb-1.5" for={id}>{question.prompt}{question.isRequired ? ' *' : ''}</Label>
  {#if question.valueType === 'single_select'}
    <Select.Root
      type="single"
      value={values[0] ?? ''}
      onValueChange={(value) => set(value ? [value] : [])}
    >
      <Select.Trigger {id} class="w-full" aria-invalid={error ? 'true' : undefined}>
        {question.options.find((option) => option.value === values[0])?.label ?? '—'}
      </Select.Trigger>
      <Select.Content>
        {#each question.options as option (option.value)}
          <Select.Item value={option.value}>{option.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  {:else if question.valueType === 'multi_select'}
    <div class="space-y-1.5" {id} tabindex="-1">
      {#each question.options as option (option.value)}
        <div class="flex items-center gap-2 text-sm">
          <Checkbox
            id={`${id}-${option.value}`}
            checked={values.includes(option.value)}
            onCheckedChange={(on) => toggle(option.value, on === true)}
          />
          <Label for={`${id}-${option.value}`}>{option.label}</Label>
        </div>
      {/each}
    </div>
  {:else if question.valueType === 'boolean'}
    <Checkbox
      {id}
      checked={values[0] === 'yes'}
      onCheckedChange={(on) => set([on === true ? 'yes' : 'no'])}
    />
  {:else}
    <Input
      {id}
      type={inputType(question.valueType)}
      value={values[0] ?? ''}
      oninput={(event) => set([event.currentTarget.value])}
      aria-invalid={error ? 'true' : undefined}
    />
  {/if}
  {#if question.helpText}
    <p class="mt-1 text-xs text-muted-foreground">{question.helpText}</p>
  {/if}
  {#if error}
    <p class="mt-1 text-xs text-destructive" role="alert">{error}</p>
  {/if}
</div>
