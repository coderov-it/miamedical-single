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
- **Money is integer cents**, carried as `MoneyDto { cents, currency }`.
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

`access`, `cart`, `media`, `notifications`, `orders`, `payments`, `settings`,
`users`, `webhooks`. Follow the anatomy above when adding one, and mount it in
`app.ts` with a chained `.route()` so RPC types stay inferred.

Infra adapters still to add: `cache/`, `mail/`, `media/`, `storage/`,
`swagger/`.

## Dependency injection

Currently the database is placed on the Hono context in `app.ts` and read via
`c.get('db')`; services take it as their first argument, which keeps them
testable. A project-wide DI standard is pending — do not introduce a container
or framework before it lands.
