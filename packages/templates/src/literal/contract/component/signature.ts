import { escapeHtml } from './escape.ts';
import type { ContractSignature } from './types.ts';

/**
 * Blank lines before signing; the drawn signature and its date once a
 * `ContractSignature` is passed — which only the post-signature renders do.
 */
function signedImage(signature: ContractSignature): string {
  return `<img src="${escapeHtml(signature.imageDataUrl)}" alt="" style="display:block;max-height:80px;max-width:240px;margin-bottom:4px;" />`;
}

export function signatureBlockIt(signature?: ContractSignature | null): string {
  const customer = signature
    ? `${signedImage(signature)}
    <p>Firma del Cliente</p>
    <p>Data: ${signature.signedAt}</p>`
    : `<p>Firma del Cliente</p>
    <p>Data: ____________________</p>`;
  return `<div class="signature-block">
  <div class="signature-area">
    ${customer}
  </div>
  <div class="signature-area">
    <p>Per M.i.a. Medical Italia</p>
    <p>Data: ____________________</p>
  </div>
</div>`;
}

export function signatureBlockEn(signature?: ContractSignature | null): string {
  const customer = signature
    ? `${signedImage(signature)}
    <p>Customer Signature</p>
    <p>Date: ${signature.signedAt}</p>`
    : `<p>Customer Signature</p>
    <p>Date: ____________________</p>`;
  return `<div class="signature-block">
  <div class="signature-area">
    ${customer}
  </div>
  <div class="signature-area">
    <p>For M.i.a. Medical Italia</p>
    <p>Date: ____________________</p>
  </div>
</div>`;
}
