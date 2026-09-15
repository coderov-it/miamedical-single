/**
 * What a stored legal document needs before it can be read: section labels that
 * are really headings, and headings that can be linked to.
 *
 * Its own module, free of every import, for two reasons: it is pure text work
 * that the page's data layer has no part in, and `node --test` runs it directly
 * — `lib/legal.ts` pulls in the Hono client through `~/lib/api`, an alias Vite
 * resolves and the bare test runner does not.
 */

/** `<h2>Titolare del trattamento</h2>` → `titolare-del-trattamento`. */
function slugify(text: string): string {
  return (
    text
      .normalize('NFD')
      // Combining marks, so `Trattamento è` and `Trattamento e` do not become
      // two different anchors that read the same.
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .replace(/-+$/g, '')
  );
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

/** The words inside a heading: no markup, no entities, no doubled spaces. */
function headingText(inner: string): string {
  return inner
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The longest a bold paragraph may be and still be read as a section label.
 *
 * "Modalità e luogo del trattamento dei Dati raccolti" is 50 characters and is a
 * heading. "Dichiaro di aver compreso l'informativa resa ai sensi dell'articolo
 * 9 del regolamento…" is 150 and is a sentence somebody emphasised. There is no
 * cleverer signal available, and erring short is the safe direction: a missed
 * label stays a bold paragraph, which is what it looks like today.
 */
const LABEL_MAX = 80;

/**
 * Turn `<p><strong>Cookie Policy</strong></p>` into `<h2>Cookie Policy</h2>`.
 *
 * ── Why a real page needs this ─────────────────────────────────────────────
 * A privacy notice is almost never typed into our editor. It arrives pasted out
 * of iubenda, a law firm's Word file or the old site, and those sources mark
 * their sections with **bold paragraphs** rather than headings. The one this
 * site serves has 40 of them and exactly one real `<h2>` — so without this pass
 * the page is 134 paragraphs of undifferentiated text, there is nothing to build
 * a contents list from, and a screen reader's heading navigation finds one
 * heading in a 5,000-word document.
 *
 * Restating them by hand in the editor is not the answer: it is 40 edits that
 * must be redone every time Legal sends a new version.
 *
 * ── What is treated as a label, and what is left alone ─────────────────────
 * A paragraph qualifies when it is ENTIRELY one `<strong>` — no text outside it,
 * no second bold run — and that text is short, unbroken and not a full sentence.
 * Paragraphs inside a list item or a quote never qualify, whatever they look
 * like: their parent already says what they are, and a heading is not a legal
 * child of `<li>`.
 *
 * It is a rendering decision, not a rewrite. The stored document keeps the
 * operator's own markup, so nothing here can damage what they wrote, and a
 * document that does use real headings is unaffected.
 */
/**
 * One paragraph, or one list/quote boundary — and the paragraph arm may never
 * cross another `<p>` tag.
 *
 * That last part is load-bearing, and it is the bug this pattern was written to
 * fix. A plain `<p><strong>(.*?)</strong></p>` looks equivalent until the
 * document contains a paragraph that OPENS bold and carries on in plain text:
 *
 *   <p><strong>Indirizzo email:</strong> info@example.it</p>
 *   …fifty paragraphs and eight lists…
 *   <p><strong>Cookie Policy</strong></p>
 *
 * The lazy group then runs from the first `<p><strong>` all the way to the last
 * `</strong></p>`, eats every `<li>` and `</li>` on the way, and the counter
 * below never sees them — so it sticks at "inside a list item" and every real
 * section label after that point is silently left alone. On the document this
 * site serves that was 26 of the 40.
 */
const SCAN = /<p>((?:(?!<\/?p\b)[\s\S])*?)<\/p>|<(\/?)(?:li|blockquote)\b[^>]*>/g;

/** A paragraph that is one `<strong>` and nothing else — no second bold run. */
const WHOLLY_BOLD = /^<strong>((?:(?!<\/?strong\b)[\s\S])*)<\/strong>$/;

function promoteLabels(html: string): string {
  /* One scan, because the nesting and the candidates have to be read in the same
     left-to-right order. `li`/`blockquote` open and close a region where a
     paragraph is never a heading; everything else is passed through. */
  let depth = 0;

  return html.replace(SCAN, (match, body: string | undefined, closing: string | undefined) => {
    if (body === undefined) {
      depth = closing === '/' ? Math.max(0, depth - 1) : depth + 1;
      return match;
    }

    if (depth > 0) return match;

    const inner = WHOLLY_BOLD.exec(body)?.[1];
    if (inner === undefined || inner.includes('<br')) return match;

    const label = headingText(inner);
    if (!label || label.length > LABEL_MAX) return match;
    /* A trailing full stop is what separates a sentence from a title. A colon
       does not — "Luogo:" is a label. */
    if (label.endsWith('.')) return match;

    return `<h2>${inner}</h2>`;
  });
}

/**
 * Give every top-level heading an `id`, after promoting the labels above.
 *
 * Nothing on the page lists these — the contents rail that used to is gone —
 * but they cost one attribute and they are what makes a section linkable:
 * `/privacy-policy/#conservazione-dei-dati` is a URL support staff, a regulator
 * or another page can send, and it stays valid as the document is re-edited
 * because it is derived from the heading's own words.
 *
 * Safe to run on this HTML specifically: it has been through
 * `sanitizeRichText`, whose allowlist gives `<h2>` no attributes at all, so an
 * `<h2>` here is always the bare tag and the match cannot swallow one.
 */
export function renderDocument(html: string): string {
  const used = new Set<string>();
  let count = 0;

  return promoteLabels(html).replace(/<h2>([\s\S]*?)<\/h2>/g, (match, inner: string) => {
    const label = headingText(inner);
    count += 1;
    if (!label) return match;

    const base = slugify(label) || `section-${String(count)}`;
    let id = base;
    for (let n = 2; used.has(id); n += 1) id = `${base}-${String(n)}`;
    used.add(id);

    return `<h2 id="${id}">${inner}</h2>`;
  });
}
