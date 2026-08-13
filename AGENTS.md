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

- **A ternary chooses a value, never a branch.** `count === 1 ? 'ordine' : 'ordini'`
  is fine. Once an arm is a function expression, spans more than one line, or nests
  another ternary, it is hiding control flow — write it as a branch with an early
  return:

  ```ts
  // NO — two closures to parse before you learn which one runs
  export const suggestAddresses = API_KEY
    ? (query) => fetchSuggestions(query, API_KEY)
    : async () => { throw httpError(503, '…'); };

  // YES
  function resolveSuggestAddresses() {
    const feature = FEATURES.addressSuggestions;
    if (feature === null) return async () => { throw httpError(503, '…'); };
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
