# apps/server — agent rules

Hono API. The only process that talks to PostgreSQL.

> Operational short form. The full standard — rationale, code walkthroughs,
> build internals and known gotchas — is
> [docs/backend-structure-and-standart.md](../../docs/backend-structure-and-standart.md).
> Update that document when a convention changes here.

## Layout

```text
src/
  index.ts          Process entry — serve() and signal handling only
  app.ts            Hono composition, global middleware, module mounting
  config/env.ts     Parsed, validated environment (fails fast at import)
  config/features.ts     Optional features, resolved once at boot — never per request
  config/external-apis.ts Every third-party host, so a moved API is one edit
  infra/            Infrastructure adapters — never feature policy
    db/             Connection bridge to @mia/db (schema lives in the package)
  modules/          One folder per business capability
  shared/           Reusable cross-module capabilities
    auth/           session.ts (resolve user + cookie), password.ts (Argon2id),
                    guards.ts (require*)
    http/           context.ts, errors.ts, error-handler.ts, validate.ts,
                    rate-limit.ts
script/             One-off CLI scripts (seed, admin bootstrap)
```

## Module anatomy

A module is flat until it stops fitting. Files, in dependency order:

| File            | Responsibility                                                 |
| --------------- | -------------------------------------------------------------- |
| `types.ts`      | Internal records and domain types. Not wire types.             |
| `dto.ts`        | Network request/response contracts. What clients see.          |
| `mapper.ts`     | Record → DTO. Pure functions, no IO.                           |
| `validators.ts` | Runtime schemas. Re-export shared ones from `@mia/validators`. |
| `repo.ts`       | DB queries. Returns plain records. No auth, no DTOs.           |
| `service.ts`    | Business orchestration and policy. Transport-agnostic.         |
| `routes.ts`     | HTTP edge: validate → service → mapper. Thin.                  |
| `guards.ts`     | _optional_ — module-owned auth preHandlers.                    |
| `gateways.ts`   | _optional_ — ports/adapters for external providers.            |
| `contracts.ts`  | _optional_ — module-specific contract helpers.                 |
| `*.test.ts`     | Colocated with the unit under test.                            |

`modules/products/` is the reference implementation.

### Direction of dependencies

`routes → service → repo`, and `routes → mapper`. Never backwards.
`repo.ts` must not import `service.ts`; `service.ts` must not import `hono`.

### Splitting a large module

When services and routes stop fitting in one file, split into **capability
sub-folders**, keeping shared contracts at the module root:

```text
modules/products/
  catalog/      repo.ts service.ts routes.ts service.test.ts
  categories/   repo.ts service.ts routes.ts
  moderation/   relevance.ts service.ts routes.ts
  variants/     identity.ts
  testing/      fixtures.ts
  dto.ts mapper.ts types.ts validators.ts guards.ts
```

Split by capability, not by layer — a sub-folder owns a slice end to end.

## Rules

- **Never import `@mia/db` outside `infra/` and `modules/*/repo.ts`.** The
  database is an implementation detail of the repo layer.
- **Never return a DB row from a route.** Always go through `mapper.ts`, or
  internal columns leak onto the wire.
- **Money is `numeric(12,2)`**, carried as `MoneyDto { amount, currency }`
  where `amount` is a two-decimal string ("35.00"). Never parse it into a JS
  number for arithmetic — use `modules/products/money.ts` (bigint hundredths,
  half-up), or do it in SQL where `numeric` is already exact.
- **i18n:** translated text goes in a `*_translations` table **only if
  PostgreSQL indexes it** — full-text search or a per-locale unique slug.
  Everything else is a `localized()` `{ it, en }` jsonb column with a
  `CHECK (col ? 'it')`. Fallback is always `en → it`.
- **Media:** `MediaItem` is `{ path, mimeType, alt }` — the R2 key, never a
  URL. Icons are a bare `text` path column. Limits live in `MEDIA_PROFILES`
  (`@mia/validators`), not env. Every stored image is WebP; geometry is
  verified server-side on save (`storage.probeImage`), not trusted.
- **Hidden resources 404, not 403.** Existence is not public information.
- **Cross-app contracts go in `@mia/validators`**, so the website and admin can
  reuse them. Module-only schemas stay in the module's `validators.ts`.
- **Permissions are integers.** Guard routes with
  `requirePermission(P.ORDER_UPDATE)` from `@mia/permissions` — never compare
  the `order:update` string, and never decode a code in SQL. `super_admin`
  bypasses every check. Codes are permanent: never renumber or reuse one.
- **The storefront has no accounts.** Every `users` row is a back-office user;
  `modules/auth` signs them in and nothing else. There is no registration route.
- **Imports use `.ts` extensions.** Rolldown and Vite resolve them; `tsc` never
  emits.
- Adding a runtime dependency to a `@mia/*` package? Declare it in this
  package's `dependencies` too — workspace source is inlined at build time, so
  its imports become this bundle's imports.

## Modules not yet built

`access`, `cart`, `customers` (a back-office view of accounts), `payments`,
`users`, `webhooks`. Follow the anatomy above when adding one, and mount it in
`app.ts` with a chained `.route()` so RPC types stay inferred.

Built: `products` (capability sub-folders: catalog, variants, specs, addons,
faqs, questions, terms-links, media), `categories`, `media` (upload + staging
deletion only — no DB), `terms`, `attributes`, `orders`, `delivery`, `address`,
`auth`, `customer-auth`, `customer-account`, `order-disputes`, `notifications`
(not routed — a service other modules call; the email markup itself lives in
`@mia/templates`, so a preview page can render it without a transport), `settings`,
`email-preview` (development only — a gallery of every email at `/email-preview`, not
mounted when `NODE_ENV=production`).

Infra adapters still to add: `cache/`, `swagger/`. Built: `storage/`
(Cloudflare R2 behind the `ObjectStorage` port), `convert/` (sharp), `mail/`
(Plunk, Cloudflare Email Sending and AWS SES v2 behind the `MailSender` port — one is
live, chosen by `MAIL_TRANSPORT`, with a console transport for local development; see
docs/code/notifications-and-mail.md).

Every third-party hostname the server calls lives in `config/external-apis.ts`, not
in the adapter that calls it. Paths stay with the adapter — a path is part of the
call's contract, a host is not.

## Dependency injection

Currently the database is placed on the Hono context in `app.ts` and read via
`c.get('db')`; services take it as their first argument, which keeps them
testable. A project-wide DI standard is pending — do not introduce a container
or framework before it lands.
