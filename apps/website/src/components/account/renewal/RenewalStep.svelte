<!--
  One numbered step of the renewal modal — the Svelte twin of the checkout's
  components/checkout/CheckoutStep.astro: the same card, badge, collapsed
  summary and "Modifica", at a tighter padding — a dialog asks less per step
  than the checkout page.

    todo     grey badge, body hidden
    active   accent badge, body open
    done     accent tick, summary under the title, "Modifica" reopens it

  The body is hidden by class, never unmounted: the contract step's drawing and
  every form gate's messages must survive a look at another step.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  import { accountContext, say } from '~/lib/account-context';

  interface Props {
    index: number;
    title: string;
    state: 'todo' | 'active' | 'done';
    /** The receipt for a collapsed step — what was chosen there. */
    summary?: string;
    /** The last step has nothing to go back and edit. */
    onedit?: () => void;
    children: Snippet;
  }

  const { index, title, state, summary = '', onedit, children }: Props = $props();

  const { copy } = accountContext();

  const BADGE = 'grid size-7 flex-none place-items-center rounded-full font-bold';
</script>

<section
  class="border-hair shadow-pdp-card scroll-mt-4 overflow-hidden rounded-[14px] border bg-white"
  id={`renewal-step-${index}`}
>
  <header class="mid:px-6 flex items-center gap-3 px-5 py-4">
    <span
      class={[
        BADGE,
        state === 'todo' && 'bg-tint text-ink-2 text-[13.5px]',
        state === 'active' && 'bg-accent text-[13.5px] text-white',
        state === 'done' && 'bg-accent text-[15px] text-white',
      ]}
      aria-hidden="true"
    >
      {state === 'done' ? '✓' : index}
    </span>

    <div class="flex min-w-0 flex-1 flex-col gap-px">
      <h3 class="text-[16px] font-bold outline-none" tabindex="-1" data-step-heading>{title}</h3>
      {#if state === 'done' && summary}
        <span class="text-ink-2 text-[13.5px]">{summary}</span>
      {/if}
    </div>

    {#if state === 'done' && onedit}
      <button
        class="bg-accent-tint relative min-h-0 min-w-0 cursor-pointer rounded-full px-4 py-1.75 text-[14px] font-semibold text-accent after:absolute after:top-1/2 after:left-1/2 after:size-full after:min-h-12 after:min-w-12 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] hover:bg-accent hover:text-white"
        type="button"
        onclick={onedit}
      >
        {say(copy, 'edit')}
      </button>
    {/if}
  </header>

  <div class={['mid:px-6 flex flex-col gap-4 px-5 pt-1 pb-5', state !== 'active' && 'hidden']}>
    {@render children()}
  </div>
</section>
