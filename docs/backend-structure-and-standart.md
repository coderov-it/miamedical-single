# Backend Structure & Standard

Reference record of how `apps/server` is organised and why. Written to be reused
on future projects — anything project-specific (the `@mia/` scope, table names)
is called out as such.

**Stack:** Hono 4 · Drizzle ORM + PostgreSQL · Valibot · Rolldown · TypeScript 6
(`noEmit`) · pnpm workspaces + Turborepo.

**Status:** `products` and `health` are implemented end to end and verified
against a live database. Remaining modules are listed in §13.

---

## 1. Principles

1. **One process owns the database.** Only the server imports `@mia/db`.
   Frontends talk to it over the typed RPC client. There is exactly one place
   where a query can be written.
2. **Layers depend inward, never outward.** `routes → service → repo`. A repo
   never knows about HTTP; a service never imports `hono`.
3. **The wire is a contract, not a projection of the schema.** Database rows
   never reach a client. DTOs are hand-written and mapped explicitly.
4. **Modules are vertical.** A module owns its data access, policy, contracts
   and endpoints. Splitting happens by capability, never by layer.
5. **Flat until it hurts.** A module stays as single files until they stop
   fitting; only then does it split into sub-folders.
6. **Fail loudly at the boundary.** Env is validated at import. Input is
   validated at the edge. Both crash or 4xx immediately rather than degrading.

---

## 2. Directory structure

```text
apps/server/
├── package.json
├── tsconfig.json
├── rolldown.config.ts
├── turbo.json
├── AGENTS.md                     App-scoped agent rules (short form of this doc)
├── script/                       One-off CLI scripts
│   ├── seed.ts
│   └── create-admin.ts          Bootstrap a back-office account
└── src/
    ├── index.ts                  Process entry — serve() + signal handling only
    ├── app.ts                    Hono composition, global middleware, mounting
    │
    ├── config/
    │   └── env.ts                Parsed, validated environment
    │
    ├── infra/                    Infrastructure adapters — never feature policy
    │   ├── cache/                 (pending)
    │   ├── db/client.ts          Connection bridge to @mia/db
    │   ├── mail/                  SES v2 + a console transport for local dev
    │   ├── media/                 (pending)
    │   ├── storage/               (pending)
    │   └── swagger/               (pending)
    │
    ├── modules/                  One folder per business capability
    │   ├── auth/                 Login, logout, /me, password change
    │   ├── health/routes.ts
    │   └── products/             ← reference implementation
    │       ├── types.ts
    │       ├── dto.ts
    │       ├── mapper.ts
    │       ├── validators.ts
    │       ├── repo.ts
    │       ├── service.ts
    │       └── routes.ts
    │
    └── shared/                   Reusable cross-module capabilities
        ├── auth/
        │   ├── session.ts        withSession, cookie helpers, hashToken
        │   ├── password.ts       Argon2id hash / verify / needsRehash
        │   └── guards.ts         requireAuth, requirePermission, requireCustomer
        └── http/
            ├── context.ts        AppEnv, SessionUser
            ├── errors.ts         httpError + named constructors
            ├── error-handler.ts  onError, onNotFound
            ├── rate-limit.ts     In-process fixed-window limiter
            └── validate.ts       validate() wrapper around vValidator
```

Sibling packages the server consumes:

| Package            | Contains                                   |
| ------------------ | ------------------------------------------ |
| `@mia/db`          | Drizzle schema, client factory, migrations |
| `@mia/permissions` | Permission code catalog and `can()` checks |
| `@mia/validators`  | Valibot schemas shared with the frontends  |
| `@mia/tsconfig`    | Shared TS bases                            |

---

## 3. Layers and dependency direction

```text
        HTTP
         │
      routes.ts ──────────► mapper.ts ──► dto.ts
         │                      ▲
         ▼                      │
      service.ts ──────────► types.ts
         │                      ▲
         ▼                      │
       repo.ts ─────────────────┘
         │
      @mia/db  (schema + query builder)
```

Enforced rules:

- `repo.ts` **must not** import `service.ts` or anything from `shared/http`.
- `service.ts` **must not** import `hono`. It receives `Database` and plain
  arguments, which is what makes it unit-testable without a server.
- `routes.ts` **must not** contain business rules. Validate, delegate, map.
- `@mia/db` **must not** be imported outside `infra/` and `modules/*/repo.ts`.
  (`shared/auth/session.ts` is the one deliberate exception — session lookup is
  cross-cutting and has no owning module.)

---

## 4. Module anatomy

| File            | Responsibility                                         |
| --------------- | ------------------------------------------------------ |
| `types.ts`      | Internal records and domain types. Not wire types.     |
| `dto.ts`        | Network request/response contracts. What clients see.  |
| `mapper.ts`     | Record → DTO. Pure functions, no IO.                   |
| `validators.ts` | Runtime schemas; re-exports shared ones.               |
| `repo.ts`       | DB queries. Returns plain records. No auth, no DTOs.   |
| `service.ts`    | Business orchestration and policy. Transport-agnostic. |
| `routes.ts`     | HTTP edge: validate → service → mapper.                |
| `guards.ts`     | _optional_ — module-owned auth preHandlers.            |
| `gateways.ts`   | _optional_ — ports/adapters for external providers.    |
| `contracts.ts`  | _optional_ — module-specific contract helpers.         |
| `*.test.ts`     | Colocated with the unit under test.                    |

### 4.1 `types.ts` — derive records from the schema

Never hand-maintain a shape that the database already defines:

```ts
export type ProductRow = typeof products.$inferSelect;
export type VariantRow = typeof productVariants.$inferSelect;

export interface ProductWithRelations extends ProductRow {
  variants: VariantRow[];
  images: ImageRow[];
  categories: { category: CategoryRow }[];
}
```

Filter objects passed into the repo also live here, and carry policy decisions
already resolved — the repo never inspects auth state:

```ts
export interface ProductListFilters {
  page: number;
  perPage: number;
  sort: ProductSort;
  /** Set by the service from the caller's role. */
  includeNonActive: boolean;
}
```

### 4.2 `dto.ts` — the wire contract

Hand-written. Composite values get their own type rather than parallel fields:

```ts
export interface MoneyDto {
  /** Two-decimal string, e.g. "35.00" — never a JS number. */
  amount: string;
  currency: string;
}

export interface PublicProductSummaryDto {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  status: 'draft' | 'active' | 'archived';
  pricing: PricingDto;
  thumbnail: PublicMediaItemDto | null;
  inStock: boolean;
}
```

Note what is **absent**: `createdAt`, `updatedAt`, `metadata`, `productId`.
Those are internal. Returning rows directly leaks all of them — this is the
single most common defect this layer prevents.

### 4.3 `mapper.ts` — pure transforms

No IO, no `async`, no imports from `service`/`repo`. Derived values are computed
here, not stored on the DTO by the caller:

```ts
export function toPublicSummary(row: ProductSummaryRowData, locale: LanguageCode) {
  const translation = pickTranslation(row.translations, locale); // en → it fallback
  return {
    /* … */
    title: translation?.title ?? '',
    pricing: {
      mode: row.pricingMode,
      rentalUnit: row.rentalUnit,
      currency: row.currency,
      price: row.basePrice,
    },
    thumbnail: toPublicMediaItem(row.media.thumbnail, locale),
  };
}
```

### 4.4 `repo.ts` — data access only

Takes `Database` as its first argument. Returns records. Builds `where` clauses
from the filter object, never from a request or a user:

```ts
export async function findMany(
  db: Database,
  filters: ProductListFilters,
): Promise<{ rows: ProductSummaryRow[]; total: number }>;
```

Multi-statement writes go in a transaction inside the repo:

```ts
export async function create(db: Database, data: CreateProductData) {
  return db.transaction(async (tx) => {
    /* insert product, then variants */
  });
}
```

### 4.5 `service.ts` — policy

Owns visibility rules, invariants and cross-repo orchestration. Throws domain
errors from `shared/http/errors.ts`:

```ts
const canSeeHidden = (user: SessionUser | null) => can(user, P.PRODUCT_READ);

export async function getBySlug(db: Database, slug: string, user: SessionUser | null) {
  const product = await repo.findBySlug(db, slug);
  if (!product || (product.status !== 'active' && !canSeeHidden(user))) {
    // Deliberately 404, not 403 — a hidden product's existence is not public.
    throw notFound('Product');
  }
  return product;
}
```

### 4.6 `routes.ts` — thin edge

```ts
export const productRoutes = new Hono<AppEnv>().get(
  '/',
  validate('query', ProductQuerySchema),
  async (c) => {
    const query = c.req.valid('query');
    const { rows, total } = await service.list(c.get('db'), query, c.get('user'));
    return c.json({
      data: rows.map(toProductSummary),
      meta: toPageMeta(query.page, query.perPage, total),
    });
  },
);
```

Routers are **chained** (`.get().get().post()`) and mounted chained in `app.ts`.
Breaking the chain into statements loses the literal route types and silently
degrades the frontends' RPC client to `any`.

---

## 5. Splitting a large module

When services and routes stop fitting in one file, split into **capability
sub-folders** and keep shared contracts at the module root:

```text
modules/products/
├── catalog/          repo.ts service.ts routes.ts service.test.ts
├── categories/       repo.ts service.ts routes.ts
├── moderation/       relevance.ts service.ts routes.ts service.test.ts
├── questions/        answers.ts answers.test.ts validators.ts
├── specs/            fields.ts fields.test.ts validators.ts
├── variants/         identity.ts
├── testing/          fixtures.ts
├── dto.ts            ← shared contracts stay at the root
├── mapper.ts
├── types.ts
├── validators.ts
├── guards.ts
└── schema-primitives.ts
```

Split by capability (a vertical slice owning its own repo→service→routes), not
by layer. A `repos/` or `services/` folder is an anti-pattern here.

---

## 6. Cross-cutting contracts

### 6.1 Errors

One envelope everywhere:

```jsonc
{ "error": { "code": "validation_failed", "message": "Invalid query.", "fields": { … } } }
```

Constructors in `shared/http/errors.ts`: `notFound`, `unauthorized`,
`forbidden`, `conflict`, plus `httpError(status, message, code?, extra?)`.
Handlers `throw` them; `error-handler.ts` renders. Unhandled errors log with the
request id and return a generic message in production.

### 6.2 Validation

`shared/http/validate.ts` wraps `@hono/valibot-validator` with a failure hook so
issues are flattened into the same envelope:

```jsonc
{
  "error": {
    "code": "validation_failed",
    "message": "Invalid query.",
    "fields": { "perPage": "Invalid value: Expected <=100 but received 9999" },
  },
}
```

Always use `validate(target, schema)` — never `vValidator` directly, which dumps
raw Valibot issue objects (including `requirement` and input echoes) to clients.

**Where schemas live:** contracts the frontends also need go in
`@mia/validators`. Module-only schemas stay in the module's `validators.ts`,
which re-exports the shared ones so routes have a single import source.

### 6.3 Auth

There are **two** authentication systems, deliberately separate all the way down:
different tables, different session tables, different cookies, different modules.
Nothing crosses between them.

|              | Back office                       | Storefront              |
| ------------ | --------------------------------- | ----------------------- |
| Table        | `admin_users`                     | `customer_accounts`     |
| Sessions     | `admin_sessions`                  | `customer_sessions`     |
| Cookie       | `mia_session`                     | `mia_customer_session`  |
| Module       | `modules/auth`                    | `modules/customer-auth` |
| Access model | permission codes + `is_superuser` | "their own rows" only   |
| Expiry       | fixed                             | sliding                 |

Storefront accounts are created by checkout, never by a signup form, and claimed
afterwards from an emailed link. The whole flow is documented in
[customer-accounts.md](./code/customer-accounts.md); what follows is the shared
machinery.

- `shared/auth/session.ts` — `withSession` resolves the user onto the context
  and **never rejects**. Also owns the cookie: `setSessionCookie`,
  `clearSessionCookie`, `createSessionToken`.
- `shared/auth/password.ts` — Argon2id via `@node-rs/argon2` (prebuilt binary,
  nothing to compile). Hashes are PHC strings, so the cost parameters travel
  with the value and `needsRehash` upgrades old ones at next login.
- `shared/auth/customer-session.ts` — the storefront mirror. Imports
  `hashToken`/`createSessionToken` from `session.ts` so there is one definition of
  how a session token is made. Adds sliding expiry, throttled by
  `CUSTOMER_SESSION_REFRESH_HOURS` so an active customer costs at most one write
  per day rather than one per request.
- `shared/auth/guards.ts` — `requireAuth`, `requirePermission(...codes)`,
  `requireAnyPermission(...codes)`, `currentUser(c)`, plus `requireCustomer` and
  `currentCustomer(c)` for the storefront.

There is deliberately **no `requireRole`**: codes are the only unit of access, so a
guard asking about anything else would be answering a question the system does not
model.

Session tokens are stored **hashed**: the session row's `id` holds a SHA-256 of the
token; the raw value exists only in the client cookie (`httpOnly`, `SameSite`
from `AUTH_COOKIE_SAMESITE`, `Secure` in production).

Login is rate limited per IP (`shared/http/rate-limit.ts`, in-process). Failures
count; successes are refunded, so an office behind one NAT address cannot lock
itself out. Move the counter to `infra/cache/` before running more than one
instance.

Authorisation decisions belong in `service.ts`, not in route guards, whenever
the answer depends on the resource rather than the capability alone. Everything on
the customer side is of that kind, which is why `requireCustomer` takes no codes and
every query in `modules/customer-account/repo.ts` is scoped by account id in its
`WHERE` clause.

Emailed one-shot links (activation, magic link, password reset, dispute report) live
in `customer_auth_tokens`, hashed the same way and redeemed by a single atomic
`UPDATE … WHERE consumed_at IS NULL` so two clicks cannot both win.

### 6.3.1 Permissions

`@mia/permissions` is the single catalog, shared by the server and the admin UI.

**There are no roles.** Access is attribute-based and always has been; the old
`user_role` enum only ever carried a blanket bypass, which is now
`admin_users.is_superuser`.

**A permission is a number.** `admin_users.permissions` is an unindexed `int[]`, and
every check is an integer comparison — the `order:update` string exists so a
human can read and assign it, and is never decoded at runtime or in SQL.

```ts
import { P } from '@mia/permissions';

.post('/', requirePermission(P.PRODUCT_CREATE), …)   // compiles to 1202
```

`is_superuser` is the one attribute that is not a code. It means "every code,
including ones added to the catalog later" — which is why it exists rather than
writing the whole catalog into the array: adding a permission tomorrow must not
silently strip an all-access operator of the new area. There must always be at least
one superuser, or nobody can grant access again.

Codes are laid out in blocks of 100 per capability area (`1100` orders, `1200`
products, …), with `+0` read, `+1` update, `+2` create, `+3` delete and `+10…`
for area-specific actions. **A code is permanent**: never renumber it, never
reuse a retired one — existing rows already hold the old number. Retiring one
means deleting the entry; `normalizePermissions` drops codes that no longer
exist, so no migration is needed.

The first superuser is created with
`pnpm --filter @mia/server admin:create -- --email you@example.com --superuser`.
There is deliberately no self-service registration for the admin panel.

### 6.4 Money

`numeric(12, 2)` in the database — exact decimal, not a float — carried as
`MoneyDto { amount, currency }` where `amount` is a two-decimal **string**
("35.00"). Drizzle returns `numeric` as a string by design, and a string is
what survives JSON (a number 10.00 serialises back as 10). Never parse an
amount into a JS number for arithmetic: `modules/products/money.ts` does the
maths in bigint hundredths with half-up rounding; anything needed inside a
query (sorting, BETWEEN) is done in SQL, where `numeric` is already exact.

### 6.4b i18n

Italian (`it`) is mandatory, English (`en`) optional, fallback `en → it`.
Translated text goes in a `*_translations` table **only if PostgreSQL indexes
it** — full-text search or a per-locale unique slug (products, categories,
terms documents). Everything else is a `localized()` `{ it, en }` jsonb column
with a `CHECK (col ? 'it')`. `search_vector` is a plain tsvector column
written by the repo via `searchVectorFor()` — it cannot be GENERATED because
the dictionary varies per row.

### 6.5 Pagination

`{ data: T[], meta: { page, perPage, total, pageCount } }`. `pageCount` is
computed server-side by `toPageMeta` so clients never re-derive it.

### 6.6 Context

`AppEnv` types every router, so `c.get()` is checked:

```ts
export interface AppEnv {
  Variables: { db: Database; requestId: string; user: SessionUser | null };
}
```

---

## 7. Configuration

`config/env.ts` parses `process.env` with Valibot at import time and throws a
formatted list of every problem at once. Nothing else reads `process.env`.

Consequence: a misconfigured deploy fails at boot, not on the first request that
happens to need the variable.

---

## 8. Infrastructure adapters

`infra/` holds adapters to the outside world and **never** feature policy. Each
is an interface plus a provider implementation, so modules depend on the port.

`infra/db/client.ts` is the only one implemented — it owns the connection for
this process; schema and query builders stay in `@mia/db`.

---

## 9. Build and bundling

### 9.1 What gets bundled

Rolldown bundles **our TypeScript only**: this app's `src/` and the `@mia/*`
workspace packages. Everything else stays a real bare import that Node resolves
from `node_modules` at runtime.

```ts
external(id) {
  if (id.startsWith('node:')) return true;
  if (id.startsWith('.') || isAbsolute(id)) return false;
  return !id.startsWith('@mia/');
}
```

Deriving this from the **import specifier** rather than a dependency list is
deliberate: transitive dependencies of the workspace packages are then handled
automatically. Reading `dependencies` instead misses them.

Rationale: workspace packages are TypeScript, so Node cannot load them —
bundling is what removes their need for a build step or emitted `.d.ts`, and
lets `tsc` stay a pure type-checker (`noEmit`) across the repo. Third-party
packages are already valid JavaScript; rebundling only bloats output and mangles
stack traces.

> **Gotcha — declare inlined packages' runtime deps.** Because workspace source
> is inlined, its dependencies become direct imports of _this_ bundle and must
> appear in `apps/server/package.json`. That is why `drizzle-orm` and `postgres`
> are declared there although no file under `src/` names them. pnpm's strict
> layout will not resolve them from `packages/db`. Symptom:
> `ERR_MODULE_NOT_FOUND: Cannot find package 'drizzle-orm'` at boot.

### 9.2 Chunk strategy

One chunk per business module, one per workspace package, everything else in the
entry:

```text
dist/index.js             app, config, infra, shared
dist/products.js          per src/modules/*
dist/health.js
dist/@mia/db.js           per workspace package
dist/@mia/validators.js
```

```ts
const moduleChunk = (id: string) =>
  /[\\/]src[\\/]modules[\\/]([^\\/]+)[\\/]/.exec(id)?.[1] ?? null;

const workspaceChunk = (id: string) => {
  const pkg = /[\\/]packages[\\/]([^\\/]+)[\\/]src[\\/]/.exec(id)?.[1];
  return pkg ? `@mia/${pkg}` : null;
};

codeSplitting: {
  minSize: 0,
  groups: [
    { name: workspaceChunk, priority: 10 },
    { name: moduleChunk, priority: 0 },
  ],
}
```

> **Gotcha — the workspace group needs the higher priority.** Group
> `includeDependenciesRecursively` defaults to `true`, so without the priority
> each module chunk claims `@mia/db` as a transitive dependency and inlines a
> private copy of the whole schema into _every_ module. Symptom: no `@mia/*`
> chunks are emitted and module chunks are implausibly large. Higher-priority
> groups form first and their modules are removed from lower-priority groups.
> (The alternative — `includeDependenciesRecursively: false` — additionally
> requires `preserveEntrySignatures: false` and `strictExecutionOrder: true` to
> avoid invalid chunks. Priority is the cheaper fix.)

> **Gotcha — `advancedChunks` is deprecated** in Rolldown ≥1.2. Use
> `output.codeSplitting`; the old key still works but warns.

Use regex `[\\/]` rather than `/` for path separators so the rules hold on
Windows.

### 9.3 Module resolution

Imports carry explicit `.ts` extensions (`./errors.ts`). `tsc` never emits, so
there is no `.js` output for a `.js` specifier to refer to;
`allowImportingTsExtensions` is on in the shared base, and Rolldown, Vite and
`tsx` all resolve `.ts` directly.

---

## 10. Commands

| Command                           | Effect                                    |
| --------------------------------- | ----------------------------------------- |
| `pnpm --filter @mia/server dev`   | `tsx watch src/index.ts`                  |
| `pnpm --filter @mia/server build` | Rolldown → `dist/`                        |
| `pnpm --filter @mia/server start` | `node dist/index.js` (needs node_modules) |
| `pnpm --filter @mia/server check` | `tsc --noEmit`                            |
| `pnpm -w run db:migrate`          | Apply migrations                          |
| `pnpm -w run db:seed`             | `apps/server/script/seed.ts`              |

Creating the first back-office account:

```bash
ADMIN_PASSWORD='…' pnpm --filter @mia/server admin:create -- \
  --email ops@miamedical.com --name 'Ops' --superuser
```

Omit `ADMIN_PASSWORD` to be prompted without echo. The password is never passed
as an argument — arguments land in shell history and in `ps` output. Non-super
Everyone else takes `--permissions 1100,1101` (codes, comma separated); an account
with neither flag is refused, since it could open nothing.

---

## 11. Deployment

```bash
pnpm --filter @mia/server build
pnpm --filter @mia/server deploy --prod --legacy ./out
node dist/index.js            # from ./out
```

`--legacy` is required because pnpm ≥10 otherwise expects
`inject-workspace-packages=true`. That setting is deliberately **off**: it
replaces workspace symlinks with copies and breaks watch-mode edits to
`packages/*`. Nothing is lost, since workspace code is already inside the bundle.

> **Gotcha —** `pnpm deploy --prod` leaves the workspace's dependency state
> marked production. A later `pnpm run build` in the same checkout then tries to
> purge `node_modules` and fails with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`.
> A plain `pnpm install` resets it. Relevant for CI that builds and deploys from
> one working copy.

---

## 12. Testing

Colocate as `*.test.ts` beside the unit. Vitest is in the catalog.

Testability is a consequence of the layering, not of mocks:

- `service.ts` takes `Database` as an argument and never imports `hono` — test
  it directly against a transaction that rolls back.
- `mapper.ts` is pure — table-driven tests, no fixtures needed.
- `repo.ts` needs a real database; keep those tests separate from unit runs.
- Shared fixtures for a large module go in `modules/<name>/testing/fixtures.ts`.

---

## 13. Adding a new module — checklist

1. `mkdir src/modules/<name>` and add `types.ts`, `dto.ts`, `mapper.ts`,
   `validators.ts`, `repo.ts`, `service.ts`, `routes.ts`. Omit what you don't
   need; do not create empty files.
2. Put any schema the frontends also need in `@mia/validators`; re-export it
   from the module's `validators.ts`.
3. Mount in `app.ts` with a **chained** `.route('/api/<name>', <name>Routes)`.
4. If it adds a runtime dependency to a `@mia/*` package, declare that
   dependency in `apps/server/package.json` too (§9.1).
5. `pnpm check` — the frontends' RPC client will surface any contract break at
   the call site.
6. Confirm the build emits `dist/<name>.js`.

Modules still to build: `payments`, `webhooks`. (`products`, `categories`,
`media`, `terms`, `attributes`, `orders`, `settings`, `notifications`, `blog`,
`contracts`, `order-disputes` and `admin-users` are built; `modules/media` is only upload (server-side WebP
conversion via sharp) + staging deletion — objects commit through
`modules/products/media/service.ts`.)

`admin-users` is the write side of `admin_users` — who exists in the back office
and what each of them holds — while `auth` stays read-only over the same table.
Its policy is the interesting part and lives in `docs/code/access-control.md`.

`orders` also serves the **read-only cart** surface (`/api/admin/carts`) rather
than a separate `cart` module: a cart is a pre-order, it reuses `ORDER_READ`,
and splitting it would mean two modules over the same four tables. A `cart`
module becomes worth having only when the storefront needs to _write_ carts.
Its state machine is documented in
[docs/code/orders-status-machine.md](code/orders-status-machine.md).
Infra adapters still to build: `cache`, `mail`, `swagger`. (`storage/` — the
Cloudflare R2 port — is built.)

---

## 14. Open decisions

- **Dependency injection.** Currently the database is placed on the Hono context
  in `app.ts` and read via `c.get('db')`; services take it as their first
  argument. A project-wide DI standard is pending — do not introduce a container
  or framework before it lands, and revisit §4.4/§4.5 signatures when it does.
- **Price sorting.** `price_asc` / `price_desc` order by `products.base_price`
  — option modifiers are ignored, which is right for "from" prices but worth
  revisiting if SKU-level sorting is ever wanted.
- **Admin user management.** The `access` module — listing back-office users and
  editing their permission arrays from the UI — is not built yet. Until it is,
  accounts are provisioned with `script/create-admin.ts`. The permission catalog,
  storage and guards are already in place, so this is CRUD over
  `admin_users.permissions` plus a picker built from `permissionsByGroup()`.
- **Rate-limit storage.** The login limiter is per-process (§6.3). Multiple
  instances divide the effective limit; move it to `infra/cache/` when scaling
  horizontally.
