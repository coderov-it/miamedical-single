import { COLORS } from '../../../brand.ts';
import { escapeHtml } from './escape.ts';

/**
 * A body paragraph. Every message is paragraphs and buttons, so the margin lives here
 * rather than being retyped — and email clients need it on the element, since there is
 * no stylesheet to put it in.
 *
 * `text` is text, never markup: it is escaped. `preLine` keeps the line breaks in a
 * value somebody typed into a form, which is what the dispute alert needs.
 */
export function paragraph(props: { text: string; preLine?: boolean }): string {
  const base = `margin:0 0 14px;color:${COLORS.ink}`;
  const style = props.preLine ? `${base};white-space:pre-line` : base;
  return `<p style="${style}">${escapeHtml(props.text)}</p>`;
}
