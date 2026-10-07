/**
 * The enlarged signing popup (`components/contract/SignatureDialog.astro`).
 *
 *   "Ingrandisci"        opens it on a blank canvas
 *   draw, "Usa questa firma"
 *                        → the drawing is cropped and fitted into `target`,
 *                          the inline pad the form actually reads
 *   "Usa…" with nothing drawn
 *                        → marked at the canvas, focus there — never a silent no-op
 *   "Chiudi" / Esc       → closes; the inline box keeps whatever it had
 */
import { createFormGate } from '~/lib/form-validation';

import { createSignaturePad, type SignaturePad } from './signature-pad';

export function wireSignatureDialog(dialog: HTMLDialogElement, target: SignaturePad): () => void {
  const canvas = dialog.querySelector<HTMLCanvasElement>('[data-signature-dialog-canvas]');
  const placeholder = dialog.querySelector<HTMLElement>('[data-signature-dialog-placeholder]');
  if (!canvas) return () => {};

  const pad = createSignaturePad(canvas, (empty) => {
    if (placeholder) placeholder.hidden = !empty;
    gate.refresh();
  });

  const gate = createFormGate(dialog, [
    {
      key: 'signatureLarge',
      isSatisfied: () => !pad.isEmpty(),
      controls: () => [canvas],
      focus: () => canvas,
    },
  ]);

  dialog
    .querySelector('[data-signature-dialog-clear]')
    ?.addEventListener('click', () => pad.clear());
  dialog
    .querySelector('[data-signature-dialog-close]')
    ?.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-signature-dialog-use]')?.addEventListener('click', () => {
    if (!gate.enforce()) return;
    target.drawFrom(pad);
    dialog.close();
  });

  return () => {
    dialog.showModal();
    /* Measured now that it is on screen; a closed dialog has no size to fit to. */
    pad.fit();
    pad.clear();
    gate.reset();
  };
}
