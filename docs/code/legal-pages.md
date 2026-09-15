# Legal pages

The site's own policies — the privacy notice today — written in the back office
and served in four languages. One table, one editor screen per page, one
storefront view.

## Not the terms documents

`terms_documents` is a **pool**: rental conditions, a warranty text, a returns
text, each linked to any number of products through `product_terms` and picked
from the product editor's Terms tab. It has slugs, a `draft → published →
archived` life and a version number because a product's conditions change while
older orders keep pointing at what they agreed to.

A privacy notice is none of that. It is one document, at one URL the storefront
already declares, that must always be reachable. So it has:

- no slug — `code` names a route key, and the URL per language lives in
  `apps/website/src/lib/routes.ts`;
- no status — there is no legitimate state in which the site serves no privacy
  notice, and an unwritten one already has an answer (see _Before it is
  written_);
- no list — the operator opens "Privacy Policy", not a table with one row in it.

Mixing the two would also have put the privacy notice in the picker that links
conditions to a product, where somebody would eventually attach it to a
wheelchair.

## The pieces

| Where                                               | What                                                       |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `packages/db/src/schema/legal.ts`                   | `legal_pages`, one row per page                            |
| `packages/validators/src/legal.ts`                  | `LEGAL_PAGE_CODES`, the update schema and the field caps   |
| `apps/server/src/modules/legal/routes.ts`           | `GET /api/legal/:code`, `GET`/`PUT /api/admin/legal/:code` |
| `apps/admin/src/lib/legal/legal-page-editor.svelte` | the editor, generic over `code`                            |
| `apps/admin/src/routes/(app)/legal/privacy-policy/` | the route declaration that mounts it                       |
| `apps/website/src/lib/legal.ts`                     | the cached read, and `LEGAL_PAGES` — code → route          |
| `apps/website/src/views/legal/PolicyPage.astro`     | the page                                                   |
| `apps/website/src/pages/privacy-policy.astro`       | the URL                                                    |

Adding a second legal page (a cookie notice, say) is: a `LEGAL_PAGE_CODES` entry,
a `LEGAL_PAGES` entry, a two-line page file, a two-line admin route file, one
line in `nav.ts`. No new table, no new endpoint, no new component.

## Storage

Every text field is one inline `{ it, en, fr, de }` jsonb column, not a
translations table. That is the rule in `packages/db/src/schema/i18n.ts`: a
translations table is for text PostgreSQL indexes — full-text search or a
per-locale unique slug — and a legal page has neither. A new language is a key,
never a migration, and the admin's localized field components bind to the column
with no pivot.

`body` is sanitised HTML, per language. The admin writes it in the same Tiptap
editor the product description uses, and the server runs every language through
`sanitizeRichText` on write (`packages/validators/src/rich-text.ts`) — h2–h6,
`strong`/`em`/`u`/`s`, lists, blockquote, `hr`, links; no images, no `style`, no
`class`. The editor's extension list and that allowlist have to move together;
`docs/code/admin-rich-text.md` is the pairing.

`effective_at` is not `updated_at`. The first is the date the operator says the
notice takes effect and is the one with legal meaning; the second moves when a
typo is fixed. The page prints both.

## Languages

A locale is **available** when the page has both a title and a body in it. The
API computes that once and returns it as `availableLocales`; everything else
follows from it:

- the page renders in the requested language when it is available, and in
  Italian marked `lang="it"` when it is not;
- `hreflang` lists only available locales;
- a locale that is not available points its `canonical` at the Italian URL, so
  four URLs of the same Italian paragraphs are one page to a crawler rather than
  four competing ones;
- the sitemap lists exactly the available locales, with `<lastmod>` from
  `updated_at`.

The admin's Translate action treats the whole page as **one protection group**,
which is stricter than the product editor. Half a privacy notice in French, with
the rest falling back to Italian, is a document nobody can rely on — and by the
rule above it would not be advertised as French anyway.

## Caching

Two caches, ten minutes each, and they add up:

| Layer                                       | Setting                                          |
| ------------------------------------------- | ------------------------------------------------ |
| `LEGAL_POLICY` (`lib/legal.ts`, in-process) | `fresh: 600`, `stale: 86400`                     |
| `LEGAL_PAGE` (`lib/http-cache.ts`, shared)  | `s-maxage=600`, `swr=86400`, `stale-if-error=1w` |
| `middleware.ts`                             | strong ETag over the rendered bytes → 304s       |
| the page itself                             | `Last-Modified` from `updated_at`                |

So an edit saved in the admin is live everywhere within **twenty minutes**, and
between edits the page costs the API one call per locale per ten minutes
whatever the traffic. Much longer than `CATALOG_POLICY`'s four minutes, and
deliberately: a stale price is a customer quoted the wrong number, a
ten-minute-old policy is a document whose new wording has not finished
propagating.

`stale-if-error` is a week. A privacy notice must not become a 500 because the
API is down — a week-old copy of it is still the document that was in force.

## Before it is written

`GET /api/legal/:code` 404s, the page renders the "we can send it to you or read
it to you" panel (`components/legal/UnpublishedNotice.astro`, shared with the
terms route) and is `noindex`. The footer link never 404s, and the sitemap does
not list the page.

The admin GET answers `exists: false` with empty fields instead of 404ing, so
the first visit opens an editor rather than an error and there is no "create"
flow to get wrong.

## What the page does to a pasted document

A privacy notice is almost never typed into our editor. It arrives pasted out of
iubenda, a law firm's Word file or the old site — and those sources mark their
sections with **bold paragraphs**, not headings. The document this site serves
has 40 of them and exactly one real `<h2>`, which without help renders as 134
paragraphs of undifferentiated text with one heading in 5,000 words.

`renderDocument()` (`lib/legal-document.ts`) fixes that at render time, in two
passes:

1. **Promote labels.** A paragraph that is entirely one `<strong>` — no text
   outside it, no second bold run, at most 80 characters, no trailing full stop,
   and not inside a list item or a quote — becomes an `<h2>`. Everything else is
   left exactly as written. The rules and the cases they came from are in
   `lib/legal-document.test.ts`.
2. **Give every heading an `id`**, slugged from its own words. Nothing on the
   page lists them, but they are what makes `/privacy-policy/#diritti-dell-utente`
   a URL support staff or a regulator can send, and it survives re-editing
   because it is derived from the heading text.

It is a rendering decision, never a rewrite: the stored document keeps the
operator's markup, so a bad guess costs a heading, not their text, and a document
that already uses real headings passes through untouched.

The module is import-free so `node --test` can run it: `lib/legal.ts` pulls in
the Hono client through the `~` alias, which Vite resolves and the bare test
runner does not.

## Layout

One centred column at `max-w-240` (60rem), holding the breadcrumb trail, the
title with its two dates, and the document as a white sheet on a hairline.
Centring it is what keeps 5,000 words from hugging the left edge of a 1920px
screen.

Inside the sheet's padding that sets the text at about 95 characters a line,
which is wide for prose and a deliberate trade here: a privacy notice is a
reference document people scan for one section, not an article read top to
bottom, and the promoted headings below are what carries them through it. The
ceiling is the page container (`max-w-page`, 1180px); past 60rem the lines stop
being scannable too.

Type is the site's own ramp, never a fixed size: 14px on a phone, 16px from
`mid` up (`theme.css` § `--text-phone-body`). The document's own rhythm — 1.75
leading, and the air a section opens with — is a `<style>` block at the foot of
`PolicyPage.astro`, because it styles markup that arrives through `set:html` and
carries no classes for a utility to hook onto. `PROSE_CLASS` (`lib/prose.ts`)
owns the parts shared with the product description.

There is no contents rail. It was tried and removed: 40 links is not a table of
contents, it is a second document beside the first.

## Permissions

`legal_page:read` (2500) and `legal_page:update` (2501), in the Content group.
Separate from the 1800 `terms:*` codes on purpose: an operator trusted to edit
rental conditions is not automatically trusted to rewrite the privacy notice.
Both are in the `content_editor` bundle; `read_only` holds the read.
