# The customer-area island

`/area-clienti/**` is one Svelte island. Three thin Astro pages declare the
routes; `components/account/AccountApp.svelte` is the application.

Accounts themselves — how an order comes to belong to one, sessions, emailed
tokens — are in [customer-accounts.md](./customer-accounts.md). This file is
only about the storefront half.

## Why it is an island

The three pages it replaced were SPAs already, written by hand. Each rendered a
loading plate on the server, fetched from the cross-origin API in the browser,
and built its DOM with template literals and its own `escapeHtml`. One of them
built an entire order view as a single `innerHTML` string.

```text
                      before                    after
  documents           3, one per screen         1
  GET /auth/me        1 per document            1 per visit
  order list fetch    per visit to the list     once, cached
  escapeHtml copies   3                         0
  form validation     none, and one violation   the storefront's own gate
```

Four pages that are NOT part of it — `accedi`, `attiva-account`,
`reimposta-password`, `segnala-ordine` — still use `<AccountCopy>` and their own
inline scripts. `firma-contratto` too. Nothing about them changed.

## The pieces

```text
pages/area-clienti/index.astro            30 lines  → initial={{ name: 'account' }}
pages/area-clienti/ordini/index.astro     26 lines  → initial={{ name: 'orders' }}
pages/area-clienti/ordini/[number].astro  42 lines  → initial={{ name: 'orderDetail', … }}

components/account/
  AccountApp.svelte          context, session gate, screen switch, focus, title, switcher
  AccountShell.svelte        the ground, the heading, the identity and the navigation
  AccountNav.svelte          the three destinations, sidebar above `mid`, strip below
  titles.ts                  document title / page title / crumb trail, from one screen
  ProfileScreen.svelte  ProfileForm.svelte  PasswordForm.svelte
  OrdersScreen.svelte   OrderCard.svelte    OrderStatusPill.svelte
  OrderDetailScreen.svelte
  AccountCrumbs.svelte  AccountLink.svelte  FieldError.svelte  fields.ts

lib/
  account-routes.ts          PURE path ⇄ screen. Tested. No runes, no DOM.
  account-router.svelte.ts   $state screen, pushState, popstate, scroll
  account-session.svelte.ts  promise-memoised /me, 401 funnel, sign-out
  account-state.svelte.ts    order list + per-number detail cache
  account-context.ts         setContext/getContext + `say()`
  form-gate-action.ts        use:formGate
  api-base.ts                the API origin, importing nothing
```

## The shell owns the chrome

`AccountShell` renders everything the three screens have in common: the muted
page ground, the crumbs, the `h1`, the customer's identity and the navigation.
The screens under it render their CONTENT and nothing else. Before it, each one
carried its own container and heading — the widths disagreed (`max-w-2xl`,
`max-w-3xl`) and two of them painted a title the `<title>` already carried.

```text
                    phone                            ≥ mid
  AccountShell      crumbs · h1 + Esci               same
                    identity card                    identity in a 250px sidebar
                    one scrolling strip of pills     the same list, stacked, sticky
  screens           content only                     content only
```

The navigation is ONE list in ONE `<nav>`. The classes place it, so the document
never holds two navigation landmarks offering the same destinations.

`titles.ts` holds the three names a screen has — the document title, the `h1`
and the trail — so a screen cannot appear under one name in the navigation and
another in the tab.

## Routing

There is no router library. Astro is already the app framework; three screens
need a `$state`, a `pushState` and a `popstate` listener.

The parsing is split into `account-routes.ts`, which is pure and therefore the
only part `node --test` can execute — runes are a compiler transform, not a
runtime function. That split is deliberate: a path that fails to parse does not
throw, it makes the back button reload the document, and it would do so only in
the language nobody develops in.

**It contains no locale logic and names no language.** The paths arrive already
resolved for one locale in `AccountCopy.routes`; in the browser
`location.pathname` is also the public path, because the middleware's rewrite
onto the source-language route declaration is internal. They match by
construction in all four languages.

Order matters when parsing, and `account-routes.test.ts` covers it in all four:

```text
  /de/kundenbereich/                        → { name: 'account' }
  /de/kundenbereich/bestellungen/           → { name: 'orders' }
  /de/kundenbereich/bestellungen/MIA-…/     → { name: 'orderDetail', number: 'MIA-…' }
```

`account` is a prefix of `accountOrders`, which is itself the order-detail
prefix, so the exact matches are tried first or every screen parses as an order.
A trailing slash is normalised (Astro's default `trailingSlash: 'ignore'`), a
malformed escape returns `null` rather than throwing out of the `popstate`
handler, and `null` makes the router reload rather than paint a screen the URL
does not describe.

Links are always real anchors with working hrefs — `AccountLink` yields to
middle-click, ⌘-click and every modifier, and carries
`data-astro-prefetch="false"` because `prefetchAll` is on and Astro's
MutationObserver finds links an island renders.

## What a client-side navigation has to move itself

No document changes, so nothing the server owns updates on its own.

|                      | Handled by                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `document.title`     | `$effect` in `AccountApp`; the `*.metaTitle` keys ride in the copy blob                                     |
| Focus + announcement | the screen wrapper is `tabindex="-1"` and takes focus — never on first render, which would steal it on load |
| Scroll               | `history.scrollRestoration = 'manual'`, offset stamped on the outgoing entry, restored **after `tick()`**   |
| Language switcher    | `AccountApp` repoints `[data-language-switcher] a[data-language]` from `copy.languageRoutes`                |
| `<html lang>`        | nothing — the island only ever navigates within one locale                                                  |
| Header active state  | nothing — `SiteHeader` sets `exact: false` and all three paths share a prefix                               |

Two of those have a sharp edge worth keeping:

- **Scroll restores after `tick()`, and instantly.** Restoring in the same tick
  scrolls the screen being _left_ — a short order detail — so the offset clamps
  to its height and the customer lands at the top of the list anyway.
  `styles/app.css` sets a global `scroll-behavior: smooth`, so both router
  scrolls pass `behavior: 'instant'`: a screen change is a navigation, not a
  glide.
- **A 401 from anywhere** funnels through `AccountSession.escalate()`. Three
  separate documents never needed it — the next page load asked again — but one
  long-lived document has to notice a session revoked under it, which a password
  change on another device does.

## Forms: the gate, not a fork

`lib/form-validation.ts` is what `AGENTS.md` names as the implementation of
"never block a customer with a disabled control or a silent return". The island
reuses it through `use:formGate` rather than reimplementing it in Svelte state,
which would fork the rule and drift from the checkout's and the product page's
copies.

**The gate owns five attributes** on everything inside the form: `hidden` and
`id` on each `[data-field-error]`, and `aria-invalid`, `aria-describedby` and
`tabindex` on the controls. The template must never write them.

That works because Svelte only re-asserts attributes it renders _reactively_. A
literal `hidden` is written once at create time and never touched, leaving the
gate as the only writer. Give it an expression, or wrap `<FieldError>` in an
`{#if}`, and there are two writers: the message flickers or never appears, and
nothing type-checks it. `bind:value` and `bind:this` are fine — neither is one
of the five.

A gated field, matching `components/checkout/CheckoutField.astro` — the
`<label>` _is_ the `[data-gate]` block, so the message is a descendant of the
block whose controls it describes:

```svelte
<label class="block" data-gate="firstName">
  <span class={LABEL}>{say(copy, 'firstName')}</span>
  <input class={FIELD} bind:this={firstNameEl} bind:value={firstName} />
  <FieldError key="firstName" message={say(copy, 'errorFirstName')} />
</label>
```

Gates are hand-written rather than discovered, for the reason
`scripts/checkout/gates.ts` gives: two of the four are not "is it empty". Their
declaration order is visual order, because `enforce()` focuses the first unmet
gate in that order.

`currentPassword` is rendered with `{#if hasPassword}`, not hidden. An account
created by checkout has never had a password — that is the normal arrival — and
when the field is absent the gate is inert: satisfied, no control to flag, no
message to reveal. A gate a customer cannot see and cannot meet would be a
silent block.

**No submit is ever disabled**, not even mid-save. Re-entry is guarded by a flag
inside the handler.

Server-side field errors (`ApiError.fields`) are deliberately not fed into the
gate: `form-validation.ts` builds no strings, and injecting an API message would
break that. They surface in the form's status line instead.

## Copy

Every string arrives from the server in `AccountCopy`, passed as a **prop** —
not through `<AccountCopy>`, whose `readAccountCopy()` reaches for `document`
that the island's SSR pass does not have.

`ACCOUNT_ISLAND_KEYS` is one set shared by all three shims. Per-page lists would
let a screen reach a key its entry point never shipped — a blank label that only
appears when you arrive from the other page.

Keys outside `account.` are reused verbatim from the checkout
(`errorFirstName`, `errorCountOne`, `total`, `delivery`…). A second translation
of the same sentence is a second thing to keep in step.

## Bundle

The island must not pull the server graph into the browser. `lib/api.ts` calls
`hc()` at module scope and imports `@mia/i18n`; `lib/i18n.ts` reaches
`node:async_hooks` and the four locale catalogues. `lib/api-base.ts` exists so
`API_BASE` can be had without any of that.

Types are exempt and used freely: `customer-session.ts` derives its DTOs from
the server's own router through `InferResponseType`, and `import type` erases.

Verify after touching anything here — the same greps as
[storefront-cart.md](./storefront-cart.md):

```bash
pnpm --filter @mia/website build
grep -l  "Invalid cookie name"            apps/website/dist/client/_astro/*.js
grep -lE "AsyncLocalStorage|searchConfig" apps/website/dist/client/_astro/*.js
grep -l  "Caricamento"                    apps/website/dist/client/_astro/*.js
grep -o 'from"\./[^"]*"' apps/website/dist/client/_astro/AccountApp.*.js | sort -u
```

All three must find nothing. The last should print only the Svelte client
runtime, `copy`, `customer-session` and `form-validation`.

## Checking

`astro check` **does not check `.svelte` files** — `@astrojs/language-server`
filters them out by design. `pnpm --filter @mia/website check` therefore runs
`svelte-check` after it, against `tsconfig.svelte.json`. Without that second
command the islands are checked by nothing but the compiler.

`svelte.config.js` exists only to satisfy `svelte-check` and declares no
preprocessor: the islands use nothing but `<script lang="ts">`.

Nine `state_referenced_locally` warnings are expected and shared with the cart
island: both pass init-only props into a class constructor, which is what an
Astro island's props are.

## Known gaps

- **No pagination.** `listOrders()` fetches `perPage=50` and the store exposes
  `meta.total`, so a caller can tell it has been truncated; nothing renders a
  pager. Fifty is far beyond any real customer's order count.
- **Server field errors are not shown per field**, by design — see above.
- **A `{#if}`-remounted control needs its gate written as a thunk.**
  `controls: () => [el]`, never `controls: [el]`, or a future edit silently
  captures a dead node.
