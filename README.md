![Mia Medical — moving in autonomy](docs/assets/readme-banner.png)

# Mia Medical — E-commerce Monorepo

Astro website, Svelte admin panel, Hono server, Drizzle + PostgreSQL, Valibot validation.
Turborepo + pnpm workspaces.

## Stack

| Layer      | Choice                                               |
| ---------- | ---------------------------------------------------- |
| Website    | Astro 7 (static + on-demand SSR), Svelte islands     |
| Admin      | SvelteKit 2 SPA (`adapter-static`, no SSR) on Vite 8 |
| Server     | Hono 4 on `@hono/node-server`                        |
| Bundler    | Rolldown 1 (chunk per module + per package)          |
| Styling    | Tailwind CSS 4 (CSS-first config)                    |
| ORM        | Drizzle ORM + `postgres.js`                          |
| Validation | Valibot 1 (shared between server and both clients)   |
| Monorepo   | Turborepo 2 + pnpm 11 workspaces & catalog           |
| Language   | TypeScript 6                                         |

## Layout

```text
apps/
  website/      Astro — public catalog, SSR for dynamic pages
  admin/        SvelteKit SPA — internal dashboard, static build, no SSR
  server/       Hono — modular API, the only thing touching the DB
                see apps/server/AGENTS.md for module conventions
packages/
  db/           Drizzle schema, client, migrations, seed
  permissions/  Permission code catalog + checks, shared by server and admin
  validators/   Valibot schemas shared by every app
  pricing/      Exact money arithmetic + the rental pricing rules, one copy
                see docs/code/orders-placement.md
  i18n/         Enum labels and the label-catalog helper
  templates/    Email markup as plain string functions, zero dependencies —
                importable by the server to send and by a page to preview
                see docs/code/notifications-and-mail.md
  tsconfig/     Shared TypeScript bases
```

**The dependency rule:** apps never import `@mia/db` directly — only `apps/server` does.
Frontends talk to the API over the typed Hono RPC client, so database access stays
in exactly one place.

## Getting started

Everything runs as a plain host process — no containers anywhere in this repo.
You need a PostgreSQL 18 reachable at the `DATABASE_URL` in your `.env`; a
shared instance on `localhost:5432` is the expected setup:

```bash
createdb -h localhost -U postgres miamedical   # once, against your running Postgres
```

Then:

```bash
pnpm install
cp .env.example .env          # then edit AUTH_SECRET
pnpm -w run db:migrate
pnpm -w run db:seed           # demo catalog + a local super admin
pnpm dev                      # all three apps via Turborepo
```

The seed creates `admin@miamedical.local` / `localdev-password` for the admin
panel (development only — it refuses to run when `NODE_ENV=production`). Real
accounts are created with:

```bash
ADMIN_PASSWORD='…' pnpm --filter @mia/server admin:create -- \
  --email ops@miamedical.com --name 'Ops' --role super_admin
```

| App     | URL                                     |
| ------- | --------------------------------------- |
| Website | [localhost:4321](http://localhost:4321) |
| Admin   | [localhost:5173](http://localhost:5173) |
| Server  | [localhost:8787](http://localhost:8787) |

## Scripts

| Command                   | What it does                                                  |
| ------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                | Run every app in watch mode                                   |
| `pnpm build`              | Build all apps (respects the dependency graph)                |
| `pnpm check`              | Typecheck everything (`tsc` / `astro check` / `svelte-check`) |
| `pnpm format`             | Prettier across the repo                                      |
| `pnpm -w run db:generate` | Generate a migration from schema changes                      |
| `pnpm -w run db:migrate`  | Apply pending migrations                                      |
| `pnpm -w run db:push`     | Push schema without a migration (dev only)                    |
| `pnpm -w run db:studio`   | Drizzle Studio                                                |
| `pnpm -w run db:seed`     | Seed demo data                                                |

## Access control

The storefront takes orders **without accounts** — there is no customer login.
Every `users` row is a back-office account for the admin panel.

Permissions are **numbers**, defined once in
[packages/permissions/src/catalog.ts](packages/permissions/src/catalog.ts) and
stored as an `int[]` on the user. `order:update` is a label for humans; `1101` is
what is stored and compared:

```ts
import { P } from '@mia/permissions';

.post('/', requirePermission(P.PRODUCT_CREATE), …)   // integer check, no decoding
```

`super_admin` bypasses every check. A code is permanent once shipped — never
renumber or reuse one, since existing rows already hold the old number.

## Conventions worth knowing

**Static vs. SSR.** Astro's `output: 'static'` prerenders every page at build time.
A page opts into on-demand rendering with `export const prerender = false` — see
[products/index.astro](apps/website/src/pages/products/index.astro). Home and 404
are static; catalog and PDP are SSR so stock and pricing are never stale.

**Imports point at the file that exists.** Source is TypeScript, so specifiers say
`.ts` — `import { httpError } from './errors.ts'`. No `.js`-that-means-`.ts`
indirection anywhere. This works because nothing emits JavaScript from `tsc`:
`noEmit` is set in the shared base, `allowImportingTsExtensions` is on, and the
actual builds are done by Rolldown (server) and Vite (frontends), both of which
resolve `.ts` natively. It is also exactly the form Node's own type stripping
requires, which is why the next two points work.

**Dev runs on `tsx watch`.** It resolves the same `.ts` specifiers the bundler
does, including the workspace packages, so dev and build agree on resolution.

**Rolldown bundles our TypeScript, and only our TypeScript.**
`pnpm --filter @mia/server build` runs Rolldown
([rolldown.config.ts](apps/server/rolldown.config.ts)) with `platform: 'node'`:

- **Inlined:** this app's `src/`, plus the `@mia/*` workspace packages. Those are
  TypeScript source, so Node can't load them — bundling is what removes their
  need for a separate build step or emitted `.d.ts`. `tsc` stays a pure
  type-checker across the whole repo.
- **External:** everything else. `hono`, `drizzle-orm`, `postgres`, `valibot` and
  their transitive deps stay as real bare imports that Node resolves from
  `node_modules` at runtime. They are already valid JavaScript; rebundling them
  only bloats the artifact and mangles stack traces.

Chunks are split by category, not by file (`output.codeSplitting`):

```text
dist/index.js             entry — app, config, infra, shared
dist/products.js          one chunk per src/modules/*
dist/health.js
dist/@mia/db.js           one chunk per workspace package
dist/@mia/validators.js
```

The workspace group carries a higher `priority` than the module group. Without
it, module chunks claim `@mia/*` first as a transitive dependency and inline a
private copy of the schema into every module. Whole build: ~13 ms.

**Server layout** is module-based — `modules/<capability>/` with
`repo → service → routes` and DTO mapping at the edge. The full standard is
[docs/backend-structure-and-standart.md](docs/backend-structure-and-standart.md)
(short form for agents: [apps/server/AGENTS.md](apps/server/AGENTS.md));
`modules/products/` is the reference implementation.

One consequence worth remembering: because the workspace source is inlined, its
runtime dependencies become direct imports of the bundle and must be listed in
`apps/server/package.json`. That is why `drizzle-orm` and `postgres` are declared
there even though nothing under `src/` imports them by name — they arrive via
`@mia/db`. pnpm's strict layout will not resolve them otherwise, and `start`
fails immediately and loudly if one is missing.

### Deploying the server

```bash
pnpm --filter @mia/server build
pnpm --filter @mia/server deploy --prod --legacy ./out   # dist/ + prod node_modules
node dist/index.js                                       # from ./out
```

`--legacy` is required because pnpm ≥10 otherwise expects
`inject-workspace-packages=true`; that setting is deliberately off here, since it
replaces workspace symlinks with copies and breaks watch-mode edits to
`packages/*`. Nothing is lost — the workspace code is already inside the bundle.

### Deploying the admin

The admin is a SvelteKit app but **not** a SvelteKit server. `adapter-static`
plus `ssr = false` in [`src/routes/+layout.ts`](apps/admin/src/routes/+layout.ts)
emits `apps/admin/dist/` as plain files — an `index.html` and `_app/`, with no
Node entry point. There is nothing to run.

Because routing uses the History API rather than hashes, the host must serve
`index.html` for paths that don't exist on disk, or a refresh on `/orders` 404s:

```nginx
location / {
  root /srv/mia/admin/dist;
  try_files $uri $uri/ /index.html;
}
```

That is the whole deployment. The admin does **not** need `/api` proxied onto
its own origin: `API_BASE` in [`src/lib/api.ts`](apps/admin/src/lib/api.ts) is
`PUBLIC_API_URL`, absolute, so the built files call the API wherever it
actually lives. Set that origin at build time and list it in `CORS_ORIGINS`.

The session is an httpOnly `SameSite=lax` cookie, which survives the
cross-origin call as long as both ends are the same _site_ — SameSite compares
registrable domain and scheme, and ports are not part of a site. So
`admin.example.com` → `api.example.com` works, and so does `:5173` → `:8787` in
dev. Only a genuinely different domain (a `*.pages.dev` admin against your own
API domain, say) needs `AUTH_COOKIE_SAMESITE="none"` and HTTPS on both ends.

**Money is `numeric(12,2)`,** carried as a two-decimal string (`"35.00"`) — never a JS
number, never a float. Server arithmetic goes through `modules/products/money.ts`
(bigint hundredths); `formatMoney()` handles display.

**Order and cart lines snapshot their data.** Product name, SKU and unit price are
copied onto the line at write time so historical orders don't mutate when a product
is edited or deleted.

**Session tokens are stored hashed.** `sessions.id` holds a SHA-256 of the token;
the raw value only ever lives in the client's cookie.

**Versions are centralized.** All dependency versions live in the `catalog:` block of
[pnpm-workspace.yaml](pnpm-workspace.yaml) — bump once, applies everywhere.

## Not yet implemented

The scaffold ships working products routes end to end. Still to build:

- `apps/server/src/modules/access/` — admin user CRUD and a permission editor UI
  (the catalog, storage and guards are already in place)
- `apps/server/src/modules/cart/` and `orders/`
- `apps/server/src/modules/payments/`, `users/`, `settings/`, `webhooks/`
- `infra/` adapters: `cache/`, `mail/`, `storage/`, `swagger/`
- Payment provider integration
- Product image uploads
