# RULES

- **DB index names ≤ 63 bytes** (Postgres truncates past that). Name indexes
  explicitly instead of trusting ORM-generated names.

- **Docs live in the code file as comments.** Past ~10 lines, move them to
  `/docs/code/*.md` and keep that file in sync with the code.

- **Code is English. Data is Italian.** English in code — identifiers, comments, CSS
  classes, `data-*` and `name` attributes, query/form keys, object keys, enum and
  union members, DB tables and columns. Italian only in what a human reads: UI copy,
  labels, DB content. So `{ id: 'company', label: 'Azienda' }`, never
  `id: 'azienda'`. Two allowances:
  1. **Italian fiscal and legal instruments** keep Italian names in code and DB, no
     English word naming the same artefact: `codiceFiscale`, `partitaIva`,
     `codiceUnivoco` — never `taxCode`/`vatNumber`. Wording around them stays
     English: `companyCodiceFiscale`.
  2. **Public route paths stay Italian** (`/carrello/`, `/catalogo-noleggio/`) — an
     SEO commitment governed in `apps/website/src/lib/routes.ts`. Query and form keys
     are wire format, not routes, so English.

- **File names are English — except where the file name IS the URL.** Every
  directory and file in the repo is named in English. The single exception is
  `apps/website/src/pages/**`: in Astro a page file's path is its public route, so
  `pages/carrello.astro` is not a badly named file, it is the declaration of
  `/carrello/`, and renaming it is the SEO event the rule above forbids. Two
  consequences:

  1. **Only page files may carry an Italian name, and only for the segment the URL
     needs.** `pages/prodotto/[slug].astro` — yes. `lib/carrello-stato.ts`,
     `components/product/PdpConfigurazione.astro` — no.
  2. **A page file is a route declaration, not a place to keep code.** When a page
     outgrows the size rule below, the logic moves to an English-named module or
     view component and the Italian file stays the thin shim that names the URL.

- **Nothing lands in the repo root but mainstream repo furniture** — assets go to
  `assets/` or `/docs/assets/`, anything doc-shaped to `/docs/`, scratch outside the repo. don't forget to add auto generated folder in .gitignore.

- **A source file lives in 300–350 lines.** That is the target, not a suggestion:
  past it, split by responsibility — a view into sections, a script into modules, a
  route module into handlers. 800 lines is the absolute ceiling and needs a real
  reason (one generated table, one irreducible state machine), not "it grew".
  Splitting is the default answer; a file at 500 lines is already asking to be two.

- **Never block a customer with a disabled control or a silent return.** A form
  gate must say what is missing, at the control that is missing it, the moment the
  customer asks to move on. So: the action stays clickable, the click validates,
  and an invalid result marks every offending field, scrolls to the first one and
  moves focus there. `disabled` on a submit and `if (invalid) return` in a click
  handler are both the same bug — the customer is stopped and never told why. The
  storefront's implementation of this is `apps/website/src/lib/form-validation.ts`.

- **A ternary chooses a value, never a branch.** `count === 1 ? 'ordine' : 'ordini'`
  is fine. Once an arm is a function expression, spans more than one line, or nests
  another ternary, it is hiding control flow — write it as a branch with an early
  return:

  ```ts
  // NO — two closures to parse before you learn which one runs
  export const suggestAddresses = API_KEY
    ? (query) => fetchSuggestions(query, API_KEY)
    : async () => {
        throw httpError(503, '…');
      };

  // YES
  function resolveSuggestAddresses() {
    const feature = FEATURES.addressSuggestions;
    if (feature === null)
      return async () => {
        throw httpError(503, '…');
      };
    return (query) => fetchSuggestions(query, feature.apiKey);
  }
  ```

  Carve-out: conditional spread for an optional property —
  `...(key ? { credentials: key } : {})` — stays. It is what
  `exactOptionalPropertyTypes` forces for "set this key or omit it", it selects a
  value rather than a code path, and no `if` expresses it inside an object literal.

- **A feature's enabled state is decided at boot, never per request.** Resolve it
  once in `apps/server/src/config/features.ts`, capturing its credential alongside
  the flag so "on but unconfigured" is unreachable. `logFeatureSummary()` reports
  optional features at startup; what production must not start without goes in the
  boot guards in `config/env.ts`.

- **Explaining a concept or process: show it, don't describe it.** Lead with a
  worked example on real values — numbered steps in a code block, input on the left,
  result on the right — for the normal case and the fallback case. Prose only for
  what the walk left out. No option tables, no trade-offs, no alternatives I did not
  ask for. Short enough to read once. Close by asking whether that was the part I
  meant; don't pre-empt it with extra sections.

- **Tooling for Code Exploration** use `ripgrep` or `rg` instead of grep, and for finding any chunk of code in codebase use `ast-grep`. if system doesn't have these tools installed then immidiately stop, and tell me to install this tools with guideline of that OS.

- **Avoid Sloppy Texts** don't add to many texts for user helps, first jusitfy if user actually needed it, reused places doesn't need help texts, but if UI or functionality is too tricky then add over all help with a semi-wide help modal for that section otherwise add (i) information button attach some texting texts. but it steps are understanable by one shot then don't add it.
