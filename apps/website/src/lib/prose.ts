/**
 * How operator-written rich text is painted, everywhere it is rendered.
 *
 * The HTML carries no classes of its own — `sanitizeRichText` strips `class`
 * and `style` along with everything else that is not structure — so the
 * container's utilities are the whole of its styling. That is deliberate: what
 * the admin's editor can produce and what the storefront can paint are one
 * list, kept in one place.
 *
 * ⚠️ No width here. A product description reads at `max-w-180` inside a tab and
 * a legal page at a wider measure with its own column; each caller states its
 * own, because a width in this string would be a width every caller has to
 * override.
 */
export const PROSE_CLASS =
  '[&>*+*]:mt-[0.85em] [&>:first-child]:mt-0 [&_h2]:mt-[1.5em] ' +
  '[&_h2]:text-[19px] [&_h3]:mt-[1.5em] [&_h3]:text-[17px] [&_h4]:mt-[1.5em] ' +
  '[&_h4]:text-[15px] [&_h5]:mt-[1.5em] [&_h5]:text-[15px] [&_h6]:mt-[1.5em] ' +
  '[&_h6]:text-[15px] [&_h2]:leading-tight [&_h3]:leading-tight [&_h4]:leading-tight ' +
  '[&_h5]:leading-tight [&_h6]:leading-tight [&_h2]:font-bold [&_h3]:font-bold [&_h4]:font-bold ' +
  '[&_h5]:font-bold [&_h6]:font-bold [&_h2]:text-ink [&_h3]:text-ink [&_h4]:text-ink ' +
  '[&_h5]:text-ink [&_h6]:text-ink [&_p]:text-pretty [&_strong]:font-semibold [&_strong]:text-ink ' +
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ps-[1.35em] [&_ol]:ps-[1.35em] ' +
  '[&_li+li]:mt-[0.35em] [&_li>ul]:mt-[0.35em] [&_li>ol]:mt-[0.35em] ' +
  '[&_blockquote]:border-s-2 [&_blockquote]:border-hair [&_blockquote]:ps-[1em] ' +
  '[&_hr]:my-[1.5em] [&_hr]:border-0 [&_hr]:border-t-[1.5px] [&_hr]:border-hair ' +
  '[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2';
