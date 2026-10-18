<!--
  The renewal modal: full screen, opened from anywhere in the account island
  through `renewal.open(number)` (lib/renewal-launcher.svelte.ts). Laid out like
  the checkout page — numbered step cards stacked on the left, the summary card
  on the right:

    1 Durata      pick a length; the summary prices it    RenewalDuration
    2 Contratto   read and sign the renewal contract      RenewalContract
    3 Conferma    check, place (later: pay)               RenewalConfirm
    done          "Proroga richiesta", the card reloads

  A finished step collapses to its summary with "Modifica", as in checkout.
  Bodies stay mounted (RenewalStep hides them), so reopening step 1 keeps the
  drawing — until another length is picked, which clears it.

  Closing always asks first — the checkout's own "Vuoi annullare la
  richiesta?" — except once the renewal is placed. A <dialog> opened with
  showModal(): focus stays inside, Esc reaches the `cancel` handler, and the
  page behind is inert.
-->
<script lang="ts">
  import { onMount, tick } from 'svelte';

  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';
  import { formatDate, formatMoney } from '~/lib/customer-session';
  import { type ExtensionOverview, getExtension } from '~/lib/rental-extension';
  import { fill } from '~/scripts/account/copy';

  import LoadingState from '../../primitives/LoadingState.svelte';
  import { CARD, HINT, NOTICE_ERROR, PRIMARY, RETRY } from '../fields';
  import RenewalConfirm from './RenewalConfirm.svelte';
  import RenewalContract from './RenewalContract.svelte';
  import RenewalDuration from './RenewalDuration.svelte';
  import RenewalOverview from './RenewalOverview.svelte';
  import RenewalStep from './RenewalStep.svelte';

  interface Props {
    number: string;
  }

  const { number }: Props = $props();

  const { copy, session, renewal } = accountContext();

  let dialog = $state<HTMLDialogElement>();
  let leaveDialog = $state<HTMLDialogElement>();
  let main = $state<HTMLElement>();
  let contractStep = $state<RenewalContract>();
  let overview = $state<ExtensionOverview | null>(null);
  let failure = $state<string | null>(null);
  /** 1–3 while renewing, 4 once placed. */
  let step = $state(1);
  let days = $state<number | null>(null);
  /** The drawn signature, and the length it was given for. */
  let signature = $state<{ days: number; dataUrl: string } | null>(null);
  let rejection = $state<string | null>(null);

  const option = $derived(overview?.options.find((candidate) => candidate.days === days) ?? null);
  /** A signature for the length on screen — another length's is for another contract. */
  const signed = $derived(signature && signature.days === days ? signature.dataUrl : null);

  /** Why this order cannot be renewed right now, or null when it can. */
  const blocked = $derived.by(() => {
    if (!overview) return null;
    const open = overview.open;
    if (open?.status === 'renew_pending') {
      return fill(say(copy, 'account.extension.pendingPayment'), {
        days: open.days,
        date: formatDate(open.toDate),
        amount: formatMoney(open.amount, open.currency),
      });
    }
    if (open) {
      return fill(say(copy, 'account.extension.pendingSignature'), {
        date: formatDate(open.toDate),
      });
    }
    if (overview.blockedBy === 'closed') return say(copy, 'account.extension.closed');
    if (overview.blockedBy === 'hourly') return say(copy, 'account.extension.hourly');
    if (overview.options.length === 0) return say(copy, 'account.extension.noOptions');
    return null;
  });

  function stateOf(index: number): 'todo' | 'active' | 'done' {
    if (index < step) return 'done';
    if (index === step) return 'active';
    return 'todo';
  }

  const durationSummary = $derived.by(() => {
    if (!option) return '';
    const until = fill(say(copy, 'account.renewal.until'), { date: formatDate(option.toDate) });
    return `${option.label} · ${until}`;
  });

  async function load() {
    failure = null;
    try {
      overview = await getExtension(number, copy.locale);
    } catch (error) {
      if (session.escalate(error)) return;
      failure = errorMessage(error, say(copy, 'account.genericError'));
    }
  }

  onMount(() => {
    dialog?.showModal();
    /* The modal covers the page; the page must not scroll under a finger. */
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = 'hidden';
    void load();
    return () => {
      root.style.overflow = overflow;
    };
  });

  /**
   * Opens a step and moves focus to its heading, as the checkout does: the
   * button just pressed is gone, and focus must not fall to <body>.
   */
  async function go(next: number) {
    step = next;
    await tick();
    const section = document.getElementById(`renewal-step-${next}`);
    if (!section) {
      main?.scrollTo({ top: 0 });
      return;
    }
    section.scrollIntoView({ block: 'start', behavior: 'smooth' });
    section.querySelector<HTMLElement>('[data-step-heading]')?.focus({ preventScroll: true });
  }

  /** Nothing is kept from an unfinished renewal, so leaving is confirmed first. */
  function requestClose() {
    if (step === 4 || !overview || blocked) {
      renewal.close();
      return;
    }
    leaveDialog?.showModal();
  }

  function placed() {
    renewal.markPlaced();
    step = 4;
    main?.scrollTo({ top: 0 });
  }

  function rejected(target: 'days' | 'contract', message: string) {
    signature = null;
    rejection = message;
    if (target === 'contract') contractStep?.forget();
    void go(target === 'days' ? 1 : 2);
  }
</script>

<dialog
  class="bg-page text-ink m-0 h-dvh max-h-none w-full max-w-none p-0 backdrop:bg-black/45"
  aria-labelledby="renewal-title"
  bind:this={dialog}
  oncancel={(event) => {
    event.preventDefault();
    requestClose();
  }}
>
  <div class="flex h-full flex-col">
    <header class="border-hair border-b bg-white">
      <div class="px-gutter max-w-page mx-auto flex w-full items-center gap-4 py-3.5">
        <div class="min-w-0 flex-1">
          <!-- svelte-ignore a11y_autofocus -->
          <h2
            class="text-[22px] font-bold tracking-[-0.015em] outline-none"
            id="renewal-title"
            tabindex="-1"
            autofocus
          >
            {say(copy, 'account.extension.extend')}
          </h2>
          <p class="text-ink-2 text-[13.5px]">
            {fill(say(copy, 'account.order.title'), { number })}
          </p>
        </div>
        <button
          class="hover:bg-tint text-ink-2 hover:text-ink grid size-11 flex-none place-items-center rounded-full"
          type="button"
          aria-label={say(copy, 'checkoutContract.close')}
          onclick={requestClose}
        >
          <svg
            class="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18"></path>
          </svg>
        </button>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto" bind:this={main}>
      <div class="px-gutter max-w-page mid:py-8 mx-auto w-full py-5">
        {#if !overview}
          {#if failure}
            <div class={CARD + ' mx-auto max-w-[560px]'}>
              <p class={NOTICE_ERROR} role="alert">{failure}</p>
              <button class={RETRY + ' mt-4'} type="button" onclick={() => void load()}>
                {say(copy, 'retry')}
              </button>
            </div>
          {:else}
            <LoadingState label={say(copy, 'account.extension.loading')} framed />
          {/if}
        {:else if step === 4 && option}
          <div class={CARD + ' mx-auto max-w-[560px] text-center'} role="status">
            <span
              class="bg-accent-tint mx-auto grid size-14 place-items-center rounded-full text-[26px] text-accent"
              aria-hidden="true">✓</span
            >
            <h3 class="text-h4 mt-4 font-bold">{say(copy, 'account.renewal.doneTitle')}</h3>
            <p class={HINT + ' mt-2'}>
              {fill(say(copy, 'account.renewal.doneDetail'), { date: formatDate(option.toDate) })}
            </p>
            <button class={PRIMARY + ' mt-6'} type="button" onclick={() => renewal.close()}>
              {say(copy, 'checkoutContract.close')}
            </button>
          </div>
        {:else if blocked}
          <div class={CARD + ' mx-auto max-w-[560px]'}>
            <p class="text-[15px]">{blocked}</p>
            <button class={PRIMARY + ' mt-5'} type="button" onclick={() => renewal.close()}>
              {say(copy, 'checkoutContract.close')}
            </button>
          </div>
        {:else}
          <div class="flex flex-wrap items-start gap-8">
            <div class="flex min-w-0 flex-[1_1_540px] flex-col gap-3">
              {#if rejection}
                <p class={NOTICE_ERROR} role="alert">{rejection}</p>
              {/if}

              <RenewalStep
                index={1}
                title={say(copy, 'account.renewal.stepDuration')}
                state={stateOf(1)}
                summary={durationSummary}
                onedit={() => void go(1)}
              >
                <RenewalDuration {overview} bind:days onnext={() => void go(2)} />
              </RenewalStep>

              <RenewalStep
                index={2}
                title={say(copy, 'account.renewal.stepContract')}
                state={stateOf(2)}
                summary={`✓ ${say(copy, 'checkoutContract.signed')}`}
                onedit={() => void go(2)}
              >
                {#if days !== null}
                  <RenewalContract
                    bind:this={contractStep}
                    {number}
                    {days}
                    active={step === 2}
                    onnext={(dataUrl, forDays) => {
                      signature = { days: forDays, dataUrl };
                      rejection = null;
                      void go(3);
                    }}
                  />
                {/if}
              </RenewalStep>

              <RenewalStep
                index={3}
                title={say(copy, 'account.renewal.stepConfirm')}
                state={stateOf(3)}
              >
                <RenewalConfirm
                  {number}
                  {option}
                  signatureDataUrl={signed}
                  onplaced={placed}
                  onrejected={rejected}
                />
              </RenewalStep>
            </div>

            <RenewalOverview
              currency={overview.currency}
              endDate={overview.endDate}
              {option}
              signed={signed !== null}
            />
          </div>
        {/if}
      </div>
    </main>
  </div>

  <dialog
    class="border-hair text-ink m-auto w-[min(100%-2rem,28rem)] rounded-[14px] border bg-white p-0 shadow-xl backdrop:bg-black/45"
    aria-labelledby="renewal-leave-title"
    bind:this={leaveDialog}
  >
    <div class="flex flex-col gap-3 p-6">
      <h3 class="m-0 text-[17px] font-bold" id="renewal-leave-title">
        {say(copy, 'checkoutContract.cancelTitle')}
      </h3>
      <p class="text-ink-2 m-0 text-[14.5px] leading-normal">
        {say(copy, 'checkoutContract.cancelDetail')}
      </p>
      <div class="mt-2 flex flex-wrap justify-end gap-2.5">
        <button
          class="bg-tint hover:bg-tint-2 text-ink rounded-full px-5 py-2.5 text-[15px] font-semibold"
          type="button"
          onclick={() => leaveDialog?.close()}
        >
          {say(copy, 'checkoutContract.cancelKeep')}
        </button>
        <button
          class="bg-danger hover:bg-danger/90 rounded-full px-5 py-2.5 text-[15px] font-semibold text-white"
          type="button"
          onclick={() => renewal.close()}
        >
          {say(copy, 'checkoutContract.cancelConfirm')}
        </button>
      </div>
    </div>
  </dialog>
</dialog>
