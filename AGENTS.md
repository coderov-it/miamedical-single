# RULES

- Database Indexing Name always should be under 63 bytes in software level, ORM auto generated name shouldn't cross 63 bytes. it would be better if you could explicitely define the database index name under 63 bytes (postgres restriction)

- Coding Docuementation should exist on that code file as comments, but if comment cross 5-10 line then create individual file in /docs/code/*.md and always sync these docs with coding changes.

- **Code is English. Data is Italian.** No Italian wording anywhere in code:
  identifiers, function and variable names, comments, CSS classes, `data-*` and
  `name` attributes, query/form keys, object keys, enum and union members, DB
  column and table names. Italian belongs only to values a human reads — UI copy,
  labels, and DB content. So `{ id: 'company', label: 'Azienda' }`, never
  `id: 'azienda'`.

  Two allowances:

  1. **Italian fiscal and legal instruments keep their Italian names**, in code
     and in the database, because each names a specific Italian artefact and no
     English word means the same thing: `codiceFiscale`, `partitaIva`,
     `codiceUnivoco`. Do not anglicise them to `taxCode` / `vatNumber`. General
     wording around them still goes English — `companyCodiceFiscale`, not
     `codiceFiscaleAzienda`.
  2. **Public route paths stay Italian** (`/carrello/`, `/catalogo-noleggio/`,
     `/prodotto/`). They are user-facing content and an SEO commitment, governed
     in `apps/website/src/lib/routes.ts`. Query and form keys are NOT covered by
     this — they are a machine wire format, so they are code and must be English.

- **Explaining a concept or process: show it, don't describe it.** When I ask how
  something works — a flow, a data model, how a value is matched, how a decision
  is reached — lead with a worked example on real values, as numbered steps in a
  code block: the input on the left, what we get back on the right. Give two
  walks, the normal case and the fallback case. Prose comes after the walk, only
  if the walk left something out.
  No option tables, no trade-off analysis, no alternatives I did not ask for.
  Keep the whole answer short enough to read once. Close by asking whether that
  was the part I meant — do not pre-empt it by adding more sections in case it
  was not.
