import sanitizeHtml from 'sanitize-html';

/**
 * The one gate every piece of operator-written HTML passes through on its way
 * into the database — today the product description, written in the admin's
 * Tiptap editor.
 *
 * The editor already constrains what it can produce: ProseMirror parses against
 * its schema, so a paste from Word or a competitor's page arrives stripped of
 * anything the schema has no node for. That is a usability guarantee, not a
 * security one — the API accepts a PATCH from any client holding a token, and
 * the storefront renders this string with `set:html`. So the allowlist is
 * restated here, on the server, and it is this copy that decides.
 *
 * Keep the two in step: an extension added to `rich-text-editor.svelte` that is
 * missing here becomes formatting that silently vanishes on save. The pairing is
 * documented in docs/code/admin-rich-text.md.
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'a',
];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  /** No `style`, no `class`, no `id` — the storefront owns presentation. */
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  /**
   * A link the operator wrote points off-site often enough that this is the
   * right default, and `noopener` is what stops the opened page reaching back
   * through `window.opener`.
   */
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
    // Tiptap emits semantic tags, but a paste can still carry the presentational
    // pair. Fold them rather than dropping the emphasis they carry.
    b: 'strong',
    i: 'em',
  },
  /** An empty document from the editor is `<p></p>`; nothing is nothing. */
  exclusiveFilter: (frame) =>
    ['p', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(frame.tag) &&
    !frame.text.trim() &&
    !frame.mediaChildren.length,
};

/** Returns `null` for input that carries no text once cleaned. */
export function sanitizeRichText(html: string | null | undefined): string | null {
  if (!html) return null;
  const clean = sanitizeHtml(html, OPTIONS).trim();
  return richTextToPlain(clean) ? clean : null;
}

/**
 * Rich text → the words in it, for `search_vector`. Without this, a tsvector
 * built over the raw markup indexes `strong` and `blockquote` as if a customer
 * might search for them, and glues neighbouring words together across tags
 * (`…domicilio.</p><p>Consegna…` → one token). Block ends become spaces first,
 * exactly so that does not happen.
 */
export function richTextToPlain(html: string | null | undefined): string | null {
  if (!html) return null;
  const spaced = html.replace(/<\/(p|h[2-6]|li|blockquote|div)>|<br\s*\/?>|<hr\s*\/?>/gi, ' ');
  const text = sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    // Entities the stripper leaves behind (`&amp;`, `&nbsp;`) are decoded by
    // sanitize-html already; what is left is whitespace to collapse.
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}
