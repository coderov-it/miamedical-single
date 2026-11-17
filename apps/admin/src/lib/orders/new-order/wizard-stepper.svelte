<!--
  1 Products · 2 Packages · 3 Customer · 4 Review. Every step is a button: one
  behind is free to revisit, one ahead runs the steps in between and stops at the
  first that is not ready, so nothing here is a dead control.
-->
<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';

  import { cn } from '$lib/utils.js';
  import { t } from '~/lib/ui-text';
  import type { OrderForm } from './order-form.svelte';
  import { STEPS } from './types';

  let { form }: { form: OrderForm } = $props();
</script>

<nav aria-label={t('newOrder.pageTitle')}>
  <ol class="flex items-center gap-1 rounded-xl border bg-card p-1.5">
    {#each STEPS as step, index (step.id)}
      {@const current = form.step === index}
      {@const done = index < form.reached && !current}
      <li class="flex max-w-68 min-w-0 flex-1 items-center">
        <button
          type="button"
          aria-current={current ? 'step' : undefined}
          onclick={() => form.goTo(index)}
          class={cn(
            'flex w-full min-w-0 items-center justify-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors outline-none sm:justify-start sm:px-3',
            'focus-visible:ring-[3px] focus-visible:ring-ring/50',
            current ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          <span
            class={cn(
              'grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold',
              current && 'border-primary bg-primary text-primary-foreground',
              done && 'border-emerald-500 bg-emerald-500 text-white',
            )}
          >
            {#if done}<CheckIcon class="size-3.5" strokeWidth={3} />{:else}{index + 1}{/if}
          </span>
          <span class={cn('truncate', !current && 'hidden sm:inline')}>{t(step.labelKey)}</span>
        </button>
      </li>
    {/each}
  </ol>
</nav>
