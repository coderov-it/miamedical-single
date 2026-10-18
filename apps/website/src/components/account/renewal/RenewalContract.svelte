<!--
  Renewal step 2 — the renewal contract, read and signed here.

    step opens          POST …/contract-preview { days } → row titled, "Visualizza" live
    while preparing     loader in the sign box's place, "Firma e continua" disabled —
                        the checkout's rule (owner's call, 2026-10-07): nothing is
                        signed before it can be read
    "Firma e continua"  gate: box signed, consent ticked → onnext(signature)
    back to step 1, new length
                        box and tick cleared, "Hai cambiato la durata…" — one
                        signature belongs to one contract

  Nothing is sent until step 3 places the renewal; the server writes the
  extension and the signed contract together (rental-extensions/renewal.ts).

  The step stays MOUNTED while the customer moves between steps (RenewalStep
  hides its body), so the drawing survives a "Modifica" on step 1 and back.
-->
<script lang="ts">
  import { onMount } from 'svelte';

  import { accountContext, say } from '~/lib/account-context';
  import { formGate } from '~/lib/form-gate-action';
  import type { FieldGate, FormGate } from '~/lib/form-validation';
  import { previewRenewalContract } from '~/lib/rental-extension';
  import { createSignaturePad, type SignaturePad } from '~/scripts/signature-pad';

  import LoadingState from '../../primitives/LoadingState.svelte';
  import FieldError from '../FieldError.svelte';
  import { ANNOUNCE } from '../fields';
  import { STEP_CTA } from './styles';

  interface Props {
    number: string;
    days: number;
    /** True while this step is the one on screen. */
    active: boolean;
    /** The signature, and the length it was given for. */
    onnext: (signatureDataUrl: string, forDays: number) => void;
  }

  const { number, days, active, onnext }: Props = $props();

  const { copy } = accountContext();

  type Preview = { days: number; status: 'loading' | 'ready' | 'failed'; html: string };

  let preview = $state<Preview | null>(null);
  let title = $state('');
  let canvas = $state<HTMLCanvasElement>();
  let viewer = $state<HTMLDialogElement>();
  let viewerBody = $state<HTMLElement>();
  let announceEl = $state<HTMLElement>();
  let empty = $state(true);
  let consent = $state(false);
  let changed = $state(false);
  /** The length the signature was given for, once "Firma e continua" accepted it. */
  let signedFor: number | null = null;
  let pad: SignaturePad | undefined;
  let gate: FormGate | undefined;

  const ready = $derived(preview?.status === 'ready' && preview.days === days);

  onMount(() => {
    if (!canvas) return;
    pad = createSignaturePad(canvas, (isEmpty) => {
      empty = isEmpty;
      gate?.refresh();
    });
    return () => pad?.destroy();
  });

  async function load(forDays: number) {
    preview = { days: forDays, status: 'loading', html: '' };
    let next: Preview = { days: forDays, status: 'failed', html: '' };
    try {
      next = {
        days: forDays,
        status: 'ready',
        html: await previewRenewalContract(number, forDays),
      };
    } catch {
      /* `next` stays failed — the row offers "Riprova". */
    }
    /* A newer length was asked for while this one loaded: that answer wins. */
    if (preview?.days !== forDays) return;
    preview = next;
    if (next.status !== 'ready') return;
    /* The document's own title — it differs per variant and language. */
    title = new DOMParser().parseFromString(next.html, 'text/html').title.trim();
  }

  /* Opened, or reopened for another length: ask for that contract. */
  $effect(() => {
    if (!active) return;
    if (preview?.days === days && preview.status !== 'failed') return;
    void load(days);
  });

  /* A signature given for another length is for another contract. */
  $effect(() => {
    if (signedFor === null || signedFor === days) return;
    signedFor = null;
    pad?.clear();
    consent = false;
    changed = true;
  });

  /* Measured once the box is visible; a hidden canvas has no size to fit to. */
  $effect(() => {
    if (active && ready) pad?.fit();
  });

  function view() {
    if (!preview || preview.status !== 'ready' || !viewer || !viewerBody) return;
    /* A shadow root keeps the contract's stylesheet off the page and the page's off it. */
    const shadow = viewerBody.shadowRoot ?? viewerBody.attachShadow({ mode: 'open' });
    shadow.innerHTML = preview.html;
    viewer.showModal();
  }

  const gates = (): FieldGate[] => [
    {
      key: 'contractSignature',
      isSatisfied: () => !empty,
      controls: () => [canvas],
      focus: () => canvas ?? null,
    },
    { key: 'contractConsent', isSatisfied: () => consent },
  ];

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!gate?.enforce() || !pad) return;
    signedFor = days;
    changed = false;
    onnext(pad.toDataUrl(), days);
  }

  /** The server refused the signature: forget it, so this step asks again. */
  export function forget() {
    signedFor = null;
    pad?.clear();
    consent = false;
  }

  /** Until the contract is ready there is nothing to sign — the checkout's own rule. */
  const MUTED_WHEN_DISABLED =
    'disabled:cursor-not-allowed disabled:bg-tint-2 disabled:text-ink-2 disabled:hover:bg-tint-2';
  const SMALL_BUTTON =
    'border-hair min-h-10 rounded-full border bg-white px-4 text-[14px] font-semibold text-ink hover:border-accent hover:text-accent';
</script>

<form
  class="flex flex-col gap-4"
  onsubmit={submit}
  use:formGate={{ gates, announce: () => announceEl ?? null, ready: (g) => (gate = g) }}
>
  <p class="text-ink-2 m-0 text-[15px] leading-normal">
    {say(copy, 'account.renewal.contractIntro')}
  </p>

  <div class="border-hair flex flex-wrap items-center gap-3.5 rounded-xl border px-4 py-3.5">
    <span
      class="bg-tint grid size-10 flex-none place-items-center rounded-[10px] text-accent"
      aria-hidden="true"
    >
      <svg
        class="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 3v5h5M9 13h6M9 17h6"></path>
      </svg>
    </span>
    <span class="flex min-w-0 flex-[1_1_11rem] flex-col gap-0.5">
      <strong class="text-[15px]">{title || say(copy, 'checkoutContract.document')}</strong>
      {#if preview?.status === 'failed'}
        <span class="text-danger text-[13px]" role="status">
          {say(copy, 'checkoutContract.loadFailed')}
        </span>
      {/if}
    </span>
    {#if ready}
      <button class={SMALL_BUTTON} type="button" onclick={view}>
        {say(copy, 'checkoutContract.view')}
      </button>
    {:else if preview?.status === 'failed'}
      <button class={SMALL_BUTTON} type="button" onclick={() => void load(days)}>
        {say(copy, 'retry')}
      </button>
    {/if}
  </div>

  {#if changed}
    <p
      class="bg-accent-tint m-0 rounded-xl px-4 py-3 text-[14px] font-medium text-accent"
      role="status"
    >
      {say(copy, 'account.renewal.changed')}
    </p>
  {/if}

  {#if !ready}
    <div class="border-hair bg-tint rounded-xl border-2 border-dashed">
      <LoadingState label={say(copy, 'checkoutContract.preparing')} />
    </div>
  {/if}

  <!-- Hidden by class, never unmounted: the pad and the gate's message must exist. -->
  <div class={['flex flex-col gap-1.5', !ready && 'hidden']} data-gate="contractSignature">
    <div class="relative">
      <canvas
        class="border-hair bg-tint aria-invalid:border-danger mid:h-52 block h-44 w-full cursor-crosshair touch-none rounded-xl border-2 border-dashed outline-none focus-visible:border-accent"
        tabindex="0"
        aria-label={say(copy, 'contract.signatureHint')}
        bind:this={canvas}
      ></canvas>
      {#if empty}
        <span
          class="text-ink-2 pointer-events-none absolute inset-0 grid place-items-center text-[17px] font-semibold opacity-60"
          aria-hidden="true"
        >
          {say(copy, 'checkoutContract.signHere')}
        </span>
      {/if}
      <button
        class="text-ink-2 absolute top-2 right-2 rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium shadow-sm hover:bg-white hover:text-accent"
        type="button"
        onclick={() => pad?.clear()}
      >
        {say(copy, 'contract.clear')}
      </button>
    </div>
    <FieldError key="contractSignature" message={say(copy, 'contract.errorSignature')} />
  </div>

  <div class={['flex flex-col gap-1.5', !ready && 'opacity-45']} data-gate="contractConsent">
    <label class="flex cursor-pointer items-start gap-3 text-[14.5px]">
      <input
        class="mt-0.5 size-4.5 min-h-0 min-w-0 flex-none cursor-pointer accent-accent"
        type="checkbox"
        name="contract-consent"
        disabled={!ready}
        bind:checked={consent}
      />
      <span class="text-ink-2">{say(copy, 'contract.consent')}</span>
    </label>
    <FieldError key="contractConsent" message={say(copy, 'contract.errorConsent')} />
  </div>

  <div class="flex justify-end">
    <button class={STEP_CTA + ' ' + MUTED_WHEN_DISABLED} type="submit" disabled={!ready}>
      {say(copy, 'checkoutContract.submit')}
    </button>
  </div>

  <p
    class={ANNOUNCE}
    role="status"
    aria-live="polite"
    bind:this={announceEl}
    data-message-one={say(copy, 'errorCountOne')}
    data-message-many={say(copy, 'errorCountMany')}
  ></p>
</form>

<dialog
  class="border-hair text-ink m-auto w-[min(100%-2rem,52rem)] rounded-[14px] border bg-white p-0 shadow-xl backdrop:bg-black/45"
  aria-label={title || say(copy, 'checkoutContract.document')}
  bind:this={viewer}
  onclick={(event) => {
    if (event.target === viewer) viewer?.close();
  }}
>
  <div class="flex max-h-[85vh] flex-col">
    <header class="border-hair flex items-center gap-3 border-b px-5 py-3.5">
      <h4 class="m-0 flex-1 text-[16px] font-bold">
        {title || say(copy, 'checkoutContract.document')}
      </h4>
      <button class={SMALL_BUTTON} type="button" onclick={() => viewer?.close()}>
        {say(copy, 'checkoutContract.close')}
      </button>
    </header>
    <div class="overflow-y-auto" bind:this={viewerBody}></div>
  </div>
</dialog>
