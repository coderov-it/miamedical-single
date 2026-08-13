import { BRAND } from '../../../brand.ts';
import { escapeHtml } from './escape.ts';

export function contractHeader(props: {
  contractNumber: string;
  title: string;
  date: string;
}): string {
  return `<div class="header">
  <div>
    <div class="brand-name">${BRAND.name}</div>
    <div class="brand-tagline">${BRAND.tagline}</div>
  </div>
  <div class="contract-ref">
    <strong>${escapeHtml(props.contractNumber)}</strong>
    ${escapeHtml(props.title)}<br>
    ${escapeHtml(props.date)}
  </div>
</div>`;
}
