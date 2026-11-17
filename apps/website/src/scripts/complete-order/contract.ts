/**
 * The contract step: read what the order will sign, sign it, and hand the signature to the
 * server, which stores it born signed.
 *
 *   details complete    POST /api/order-links/contract-preview → "Visualizza" live, sign box shown
 *   details missing     a line says to complete them first; nothing is loaded
 *   "Firma e continua"  gate: signature drawn, consent ticked
 *                       → POST /api/order-links/sign { signature, consent, expectedTotal }
 *   409 with fields     the details are incomplete: marked in the details step
 *   409 without fields  the order moved (a discount) since the preview: re-read, say so, sign again
 *
 * A signature belongs to the text it was drawn for: when the order or the details change
 * the preview is asked again and the box and the tick are cleared. The button is never
 * disabled; a click with something missing marks it where it is missing.
 */
import { createFormGate } from '~/lib/form-validation';

import type { AccountCopyData } from '../account/copy';
import { wireSignatureDialog } from '../signature-dialog';
import { createSignaturePad } from '../signature-pad';
import { type LinkClient, LinkError } from './client.ts';
import type { GoneReason, LinkSummary } from './types.ts';

export interface ContractStep {
  paint: (summary: LinkSummary) => void;
}

export interface ContractOptions {
  client: LinkClient;
  copy: AccountCopyData;
  /** Details typed but not saved: the step says so at the details form. Returns true when it did. */
  beforeSign: () => boolean;
  /** The signature was stored, or the order already was signed: re-read the order. */
  onSigned: () => void;
  /** The server named missing details. */
  onFields: (fields: Record<string, string>) => void;
  onGone: (reason: GoneReason | null) => void;
}

type Preview = { key: string; status: 'loading' | 'ready' | 'failed'; html: string; total: string };

export function createContractStep(root: HTMLElement, options: ContractOptions): ContractStep {
  const pick = <T extends HTMLElement>(name: string) =>
    root.querySelector<T>(`[data-${name}]`) as T;
  const say = (key: string) => options.copy.text[key] ?? '';

  const panels = {
    wait: root.querySelector<HTMLElement>('[data-co-contract-panel="wait"]')!,
    form: root.querySelector<HTMLElement>('[data-co-contract-panel="form"]')!,
    signed: root.querySelector<HTMLElement>('[data-co-contract-panel="signed"]')!,
  };
  const title = pick('co-contract-title');
  const failedLine = pick('co-contract-failed');
  const viewButton = pick<HTMLButtonElement>('co-contract-view');
  const viewSigned = pick<HTMLButtonElement>('co-contract-view-signed');
  const retryButton = pick<HTMLButtonElement>('co-contract-retry');
  const loader = pick('co-contract-loading');
  const signBox = pick('co-sign-box');
  const changed = pick('co-contract-changed');
  const errorLine = pick('co-contract-error');
  const canvas = pick<HTMLCanvasElement>('signature-canvas');
  const placeholder = pick('signature-placeholder');
  const consent = pick<HTMLInputElement>('contract-consent');
  const signButton = pick<HTMLButtonElement>('co-sign');
  const viewer = pick<HTMLDialogElement>('co-viewer');
  const viewerTitle = pick('co-viewer-title');
  const viewerBody = pick('co-viewer-body');

  let preview: Preview | null = null;
  let request = 0;
  let busy = false;

  const pad = createSignaturePad(canvas, (empty) => {
    placeholder.hidden = !empty;
    gate.refresh();
  });
  const gate = createFormGate(
    root,
    [
      {
        key: 'contractSignature',
        isSatisfied: () => !pad.isEmpty(),
        controls: () => [canvas],
        focus: () => canvas,
      },
      { key: 'contractConsent', isSatisfied: () => consent.checked, controls: () => [consent] },
    ],
    { announce: root.querySelector<HTMLElement>('[data-co-announce="contract"]') },
  );

  function show(name: keyof typeof panels): void {
    for (const [key, node] of Object.entries(panels)) node.hidden = key !== name;
  }

  function paintPreview(): void {
    const state = preview?.status ?? 'loading';
    const ready = state === 'ready';
    viewButton.hidden = !ready;
    retryButton.hidden = state !== 'failed';
    failedLine.hidden = state !== 'failed';
    loader.hidden = state !== 'loading';
    signBox.hidden = !ready;
    if (!ready || !preview) return;
    pad.fit();
    /* The document's own title: it differs per variant and per language. */
    const name = new DOMParser().parseFromString(preview.html, 'text/html').title.trim();
    if (name) {
      title.textContent = name;
      viewerTitle.textContent = name;
    }
  }

  async function load(key: string): Promise<void> {
    const id = ++request;
    preview = { key, status: 'loading', html: '', total: '' };
    paintPreview();
    let next: Preview = { key, status: 'failed', html: '', total: '' };
    try {
      const { html, total } = await options.client.previewContract();
      next = { key, status: 'ready', html, total };
    } catch (error) {
      if (error instanceof LinkError && error.status === 410) options.onGone(error.reason);
      if (
        error instanceof LinkError &&
        error.status === 409 &&
        Object.keys(error.fields).length > 0
      ) {
        options.onFields(error.fields);
      }
    }
    if (id !== request) return;
    preview = next;
    paintPreview();
  }

  function forget(): void {
    pad.clear();
    consent.checked = false;
  }

  function openViewer(): void {
    if (!preview || preview.status !== 'ready') return;
    const shadow = viewerBody.shadowRoot ?? viewerBody.attachShadow({ mode: 'open' });
    shadow.innerHTML = preview.html;
    viewer.showModal();
  }

  async function sign(): Promise<void> {
    errorLine.hidden = true;
    if (options.beforeSign()) return;
    if (!gate.enforce()) return;
    if (!preview || preview.status !== 'ready' || busy) return;
    busy = true;
    signButton.setAttribute('aria-busy', 'true');
    const original = signButton.textContent;
    signButton.textContent = say('contract.submitting');
    try {
      await options.client.sign(pad.toDataUrl(), preview.total);
      options.onSigned();
    } catch (error) {
      reject(error);
    } finally {
      busy = false;
      signButton.removeAttribute('aria-busy');
      signButton.textContent = original;
    }
  }

  function reject(error: unknown): void {
    if (error instanceof LinkError && error.status === 410) {
      options.onGone(error.reason);
      return;
    }
    if (error instanceof LinkError && error.status === 409) {
      if (Object.keys(error.fields).length > 0) {
        options.onFields(error.fields);
        return;
      }
      /* Moved since the preview, or already signed: re-read the order and decide from it. */
      changed.hidden = false;
      preview = null;
      forget();
      options.onSigned();
      return;
    }
    errorLine.textContent = say('completeOrder.contract.signError');
    errorLine.hidden = false;
  }

  signButton.addEventListener('click', () => void sign());
  viewButton.addEventListener('click', openViewer);
  viewSigned.addEventListener('click', openViewer);
  retryButton.addEventListener('click', () => preview && void load(preview.key));
  pick('co-viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (event) => {
    if (event.target === viewer) viewer.close();
  });
  pick('signature-clear').addEventListener('click', () => pad.clear());
  const openLarge = wireSignatureDialog(pick<HTMLDialogElement>('signature-dialog'), pad);
  pick('signature-enlarge').addEventListener('click', openLarge);
  consent.addEventListener('change', () => gate.refresh());

  return {
    paint(summary) {
      if (summary.contractSigned) {
        /* The text signed is the one stored; the viewer shows the last preview read, if any. */
        viewSigned.hidden = preview?.status !== 'ready';
        show('signed');
        return;
      }
      if (summary.missingFields.length > 0) {
        show('wait');
        return;
      }
      show('form');
      /* A signature belongs to the text it was drawn for. */
      const key = JSON.stringify([summary.customer, summary.total]);
      if (preview?.key === key && preview.status !== 'failed') return;
      if (preview) forget();
      void load(key);
    },
  };
}
