import { COLORS } from '../../../brand.ts';
import { escapeHtml } from './escape.ts';

/**
 * A section heading inside a message — an `<h2>` under the `<h1>` that `header()` emits.
 *
 * These messages used to be a subject followed by an undifferentiated run of
 * paragraphs, which reads as one long note and gives a reader skimming on a phone
 * nothing to aim at. A heading per section means "what I ordered" and "what I have to
 * do next" can be found without reading the whole thing.
 *
 * It is a real `<h2>`, not a bold paragraph, so the document outline is true for a
 * screen reader as well as for the eye. The top margin is larger than the bottom on
 * purpose: a heading belongs to the text beneath it, not the text above.
 */
export function subheading(props: { text: string }): string {
  return `<h2 style="font-size:16px;font-weight:600;line-height:1.35;margin:24px 0 8px;color:${COLORS.ink}">${escapeHtml(props.text)}</h2>`;
}
