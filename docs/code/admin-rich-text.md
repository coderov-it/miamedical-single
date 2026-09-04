# Rich text: the product description

One field in the whole system is rich text — `product_translations.description`,
written in the admin's Description tab and rendered on the PDP's "Descrizione"
panel. Everything else stays plain text or a `{ it, en }` label.

It is stored as **sanitised HTML in the existing `text` column**. No migration, no
node-tree renderer in the storefront, and the SEO description and search paths
keep working off the same row. The alternative (ProseMirror JSON in a new jsonb
column) is lossless across a schema change, but it makes every consumer learn the
tree for the sake of one field.

---

## The allowlist exists twice, on purpose

| Layer                                                   | What it is                                          |
| ------------------------------------------------------- | --------------------------------------------------- |
| `apps/admin/src/lib/components/rich-text-editor.svelte` | The editor's extension list — a usability guarantee |
| `packages/validators/src/rich-text.ts`                  | `sanitizeRichText()` — the security boundary        |

The editor's copy is the reason a paste from Word arrives clean: ProseMirror
parses incoming HTML against its schema and drops every node and mark it has no
extension for, at paste time, in front of the operator. That is worth having, and
it is **not** a defence — the API accepts a PATCH from anything holding a token.

So the server restates the list and the server's copy decides. `sanitizeRichText`
runs in `products/catalog/service.ts` on the way in, which means the database
never holds markup the storefront would not dare render, and `set:html` on the
PDP is rendering this system's own output rather than a request body.

**Adding a formatting feature means editing both.** An extension added to the
editor but missing from the sanitiser becomes formatting that works while you
type and silently vanishes on save — the worst failure shape available, because
it looks like the save is broken.

What is allowed today: `p`, `br`, `strong`, `em`, `u`, `s`, `h2`–`h6`, `ul`, `ol`,
`li`, `blockquote`, `hr`, `a[href]`. What is deliberately absent:

- **`h1`** — the PDP's single `h1` is the product title. A second one is an
  outline bug, so the editor's block menu starts at Heading 2.
- **images and video** — they belong on the Media tab, where they get WebP
  conversion, size caps and the orphan sweep (see the media rules). An `<img>`
  inside the description would be an unmanaged hotlink with no alt discipline.
- **`style`, `class`, `id`** — presentation belongs to the storefront's own
  stylesheet. The HTML arrives class-less, which is why `.pdp-prose` can style it
  with plain element selectors.
- **`code` / `<pre>`** — a rental catalogue has no use for monospace, and the two
  ways to reach it were two ways to reach it by accident.

Links get `target="_blank" rel="noopener noreferrer"` bolted on by the sanitiser
rather than the editor, so a link pasted straight into the API gets them too.

## Search indexes words, never tags

`search_vector` is written by hand in the repo (see `packages/db/src/schema/search.ts`
for why it cannot be a generated column), and it now runs the description through
`richTextToPlain()` first. Two reasons, and the second is the one that bites:

1. Tags become tokens. `strong` and `blockquote` are not words a customer
   searches for.
2. Removing tags without replacing them glues neighbours together —
   `…domicilio.</p><p>Consegna…` collapses to `domicilioConsegna`, one nonsense
   token, and both real words disappear from the index. `richTextToPlain` turns
   block ends into spaces before stripping, exactly to avoid that.

Every writer has to do this. Today that is the API path (`catalog/repo.ts`);
anything else that builds a vector has to call `richTextToPlain` first.

## Storefront rendering

`PdpInfoTabs.astro` renders `product.description` with `set:html` inside
`.pdp-prose`, whose styles are element selectors at the foot of that file. Before
this, the same field was plain text split on blank lines into `<p>` elements —
if you find that pattern anywhere else, it is a leftover.

## Editor notes worth keeping

- **Tiptap 3, `@tiptap/core` + `@tiptap/starter-kit`**, admin-only. StarterKit v3
  already includes Underline, Link and ListKeymap, so no extra packages.
- **The instance lives in a wrapper object** (`box`), reassigned on every
  transaction, because Tiptap mutates the editor in place and the toolbar's
  `isActive()` reads need something to invalidate. It must not be called `state`
  — a variable of that name turns every `$state(…)` in the file into a store
  subscription and the runes stop compiling.
- **`element` is the creation effect's only dependency.** `value` is read
  `untrack`ed inside it. Read it normally and the effect re-runs on every
  keystroke, destroying and rebuilding the editor mid-word: the first character
  lands, the rest go nowhere, because the node holding the caret is gone. Content
  comes back in only through the `key` effect, and `key` is the content language.
- **Indent is list indent** (`sinkListItem` / `liftListItem`), which is what
  ProseMirror models. There is no paragraph indent, and blockquote covers the
  "set this apart" case that usually asks for one.
