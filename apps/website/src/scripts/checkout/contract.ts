/**
 * The contract step: show the contract this checkout would sign, take the
 * signature and the consent, and hand both to placement.
 *
 *   step 3 opens        POST /api/orders/contract-preview with the draft body
 *                       → the row reads the contract's own title, "Visualizza" live
 *   while loading       loader in the sign box's place; checkbox, "Annulla" and
 *                       "Firma e continua" disabled (owner's call, 2026-10-07)
 *   "Firma e continua"  gate: box signed, consent ticked
 *                       → signature kept HERE, keyed to the body it was given for
 *   "Invia" (step 4)    body + { contractSignature } — see `place-order.ts`
 *
 * A signature belongs to the answers it was given for. Reopening the step after
 * steps 1–2 changed re-asks for the preview and, if the body is not the one that
 * was signed, clears the box and the tick and says why — signing one contract
 * and placing the order on another would be the one thing this step must not do.
 *
 * Nothing is sent to the server until placement: the signature lives in this
 * page until the order and the signed contract are written together.
 */
import { createFormGate } from '~/lib/form-validation';

import { wireSignatureDialog } from '../signature-dialog';
import { createSignaturePad } from '../signature-pad';
import type { CheckoutContext } from './context.ts';
import { draftBody } from './order-body.ts';
import { readFields } from './submit-order.ts';

export interface ContractStep {
  /** The step opened: load the preview for what is typed now. */
  open: () => void;
  /** True when the step is complete; otherwise marks what is missing. */
  enforce: () => boolean;
  refresh: () => void;
  /** True while the signature held is for the answers on the page right now. */
  isCurrent: () => boolean;
  /** `{ contractSignature }` for the order body. */
  body: () => Record<string, unknown>;
  /** The server refused the signature: forget it, so the step asks again. */
  forget: () => void;
}

export interface ContractStepOptions {
  /** The preview was refused over fields steps 1–2 own — same handling as placement's 422. */
  onRejected: (fields: Record<string, string>) => boolean;
}

type PreviewState = { key: string; status: 'loading' | 'ready' | 'failed'; html: string };

export function createContractStep(
  context: CheckoutContext,
  options: ContractStepOptions,
): ContractStep | null {
  const step = context.root.querySelector<HTMLElement>('[data-contract-step]');
  if (!step) return null;

  const pick = <T extends HTMLElement>(name: string) =>
    step.querySelector<T>(`[data-${name}]`) as T;
  const title = pick('contract-title');
  const status = pick('contract-status');
  const viewButton = pick<HTMLButtonElement>('contract-view');
  const retryButton = pick<HTMLButtonElement>('contract-retry');
  const changed = pick('contract-changed');
  const canvas = pick<HTMLCanvasElement>('signature-canvas');
  const placeholder = pick('signature-placeholder');
  const consent = pick<HTMLInputElement>('contract-consent');
  const viewer = pick<HTMLDialogElement>('contract-viewer');
  const viewerTitle = pick('contract-viewer-title');
  const viewerBody = pick('contract-viewer-body');
  const cancelButton = pick<HTMLButtonElement>('contract-cancel');
  const cancelDialog = pick<HTMLDialogElement>('contract-cancel-dialog');
  const loader = pick('contract-loading');
  const signBox = step.querySelector<HTMLElement>('[data-gate="contractSignature"]') as HTMLElement;
  const consentBlock = step.querySelector<HTMLElement>(
    '[data-gate="contractConsent"]',
  ) as HTMLElement;
  const submit = step.querySelector<HTMLButtonElement>(
    '[data-step-continue="3"]',
  ) as HTMLButtonElement;

  let preview: PreviewState | null = null;
  let signed: { key: string; signatureDataUrl: string } | null = null;
  let request = 0;
  const keyOf = () => JSON.stringify(draftBody(context));

  const pad = createSignaturePad(canvas, (empty) => {
    placeholder.hidden = !empty;
    gate.refresh();
  });

  const gate = createFormGate(
    step,
    [
      {
        key: 'contractSignature',
        isSatisfied: () => !pad.isEmpty(),
        controls: () => [canvas],
        focus: () => canvas,
      },
      { key: 'contractConsent', isSatisfied: () => consent.checked, controls: () => [consent] },
    ],
    { announce: context.root.querySelector<HTMLElement>('[data-checkout-gate-announce]') },
  );

  /**
   * Nothing can be signed before the contract can be read, so until the preview
   * is ready the sign box gives way to a loader and the controls that act on the
   * contract are disabled — the loader, or the failure line and its "Riprova",
   * is what tells the customer why.
   */
  function paintPreview(): void {
    const state = preview?.status ?? 'loading';
    const ready = state === 'ready';
    viewButton.hidden = !ready;
    retryButton.hidden = state !== 'failed';
    status.hidden = state !== 'failed';
    loader.hidden = state !== 'loading';
    signBox.hidden = !ready;
    consentBlock.inert = !ready;
    submit.disabled = !ready;
    cancelButton.disabled = state === 'loading';
    if (!ready || !preview) return;

    /* Visible from this moment, so measurable: size the drawing surface now. */
    pad.fit();

    /* The document's own title — it differs per variant (wheelchair, scooter)
       and per language, and the template is what knows it. */
    const name = new DOMParser().parseFromString(preview.html, 'text/html').title.trim();
    if (name) {
      title.textContent = name;
      viewerTitle.textContent = name;
    }
  }

  async function load(key: string): Promise<void> {
    const id = ++request;
    preview = { key, status: 'loading', html: '' };
    paintPreview();
    let next: PreviewState = { key, status: 'failed', html: '' };
    try {
      const response = await fetch(`${context.apiBase}/api/orders/contract-preview`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: key,
      });
      if (response.ok) {
        const { data } = (await response.json()) as { data: { html: string } };
        next = { key, status: 'ready', html: data.html };
      } else if (response.status === 422 && id === request) {
        /* A field steps 1–2 own: send the customer there, marked, as placement would. */
        options.onRejected(await readFields(response));
      }
    } catch {
      /* `next` stays failed — the row offers "Riprova". */
    }
    if (id !== request) return;
    preview = next;
    paintPreview();
    gate.refresh();
  }

  /** Clears what was given for other answers, and says so. */
  function forget(): void {
    signed = null;
    pad.clear();
    consent.checked = false;
    context.state.done[3] = false;
  }

  function open(): void {
    /* Measured now: a hidden canvas has no size to fit to. */
    pad.fit();
    const key = keyOf();
    if (signed && signed.key !== key) {
      forget();
      changed.hidden = false;
    }
    if (preview?.key !== key || preview.status === 'failed') void load(key);
  }

  viewButton.addEventListener('click', () => {
    if (!preview || preview.status !== 'ready') return;
    /* A shadow root keeps the contract's stylesheet off the page and the page's off it. */
    const shadow = viewerBody.shadowRoot ?? viewerBody.attachShadow({ mode: 'open' });
    shadow.innerHTML = preview.html;
    viewer.showModal();
  });
  pick('contract-viewer-close').addEventListener('click', () => viewer.close());
  retryButton.addEventListener('click', () => void load(keyOf()));

  pick('signature-clear').addEventListener('click', () => pad.clear());

  const openLarge = wireSignatureDialog(pick<HTMLDialogElement>('signature-dialog'), pad);
  const enlarge = pick<HTMLButtonElement>('signature-enlarge');
  enlarge.hidden = false;
  enlarge.addEventListener('click', openLarge);
  consent.addEventListener('change', () => gate.refresh());

  /* Cancelling needs the dialog, so the button only exists for a page that has it. */
  cancelButton.hidden = false;
  cancelButton.addEventListener('click', () => cancelDialog.showModal());
  pick('contract-cancel-keep').addEventListener('click', () => cancelDialog.close());

  /* Either dialog closes on a click on its backdrop, as well as on Esc. */
  for (const dialog of [viewer, cancelDialog]) {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  return {
    open,
    enforce: () => {
      if (!gate.enforce()) return false;
      signed = { key: keyOf(), signatureDataUrl: pad.toDataUrl() };
      changed.hidden = true;
      return true;
    },
    refresh: () => gate.refresh(),
    isCurrent: () => signed !== null && signed.key === keyOf(),
    body: () => {
      if (!signed) return {};
      return { contractSignature: { signatureDataUrl: signed.signatureDataUrl, consent: true } };
    },
    forget,
  };
}
