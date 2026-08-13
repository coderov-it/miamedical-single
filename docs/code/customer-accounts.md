# Customer accounts

Storefront accounts, how an order comes to belong to one, and what happens when it
belongs to the wrong one.

Back-office accounts are a different table (`admin_users`), a different module
(`modules/auth`), and a different cookie. Nothing crosses between them.

## Why accounts exist at all

Before this, `POST /api/orders` took an order with no account and `orders.user_id`
was never written. The only thing that told a customer their order number was the
confirmation panel they were standing on — close the tab and it was gone.

## Nobody registers

There is no signup form and there will not be one. An account comes into existence
because somebody ordered, and they claim it afterwards by clicking a link we email
them. `activatedAt` is null for the whole period in between, which is a normal
state: an unclaimed account is a real row that simply nobody has proved they own.

## The two walks

### Normal case — a first order from an address we have never seen

```text
 1. POST /api/orders  { customer: { email: "elena@example.com", firstName: "Elena", … } }
    no customer session cookie

 2. resolveForOrder()               ── modules/customer-auth/order-account.ts
      findByEmail("elena@example.com")            → undefined
      createOrGetByEmail(...)                     → account 4f2a…, activatedAt NULL
    → { customerAccountId: "4f2a…", customerLinkStatus: 'unverified',
        mailPlan: 'newAccount' }

 3. insertOrder(...)                              → MIA-2026-001000
      orders.customer_account_id   = "4f2a…"
      orders.customer_link_status  = 'unverified'   ← a claim, not a fact
      orders.first_name/last_name  = "Elena"/"Moretti"

 4. issueOrderMailTokens({ orderId })   ← AFTER the insert, so both carry the id
      activation   token A, expires in 7 days,  order_id = MIA-…001000
      order_report token R, expires in 30 days, order_id = MIA-…001000

 5. orderPlacedNewAccount email
      "Attiva il tuo account"          → /attiva-account/?token=A
      "Non hai effettuato tu…?"        → /segnala-ordine/?token=R

 6. Elena clicks A
      consumeAuthToken(A)              → row, consumed_at set (single use)
      markActivated(4f2a…)             → activatedAt = now()
      issueSession()                   → mia_customer_session cookie
      confirmLink(order, 4f2a…)        → customer_link_status = 'confirmed'
                                         + order_status_events row, actor = customer

 7. GET /api/customer/orders           → [ MIA-2026-001000, link: confirmed ]
```

Step 6 is the point of the whole design: following the link **is** the
confirmation. Elena proved she reads the inbox the order was placed under, which is
exactly the claim `unverified` was recording, so asking her again on the next screen
would be asking twice.

### Fallback case — somebody types an address that is not theirs

```text
 1. POST /api/orders  { customer: { email: "elena@example.com", … } }   ← not Elena

 2. resolveForOrder()
      findByEmail("elena@example.com")  → account 4f2a…, activatedAt SET
    → { customerAccountId: "4f2a…", customerLinkStatus: 'unverified',
        mailPlan: 'confirmation' }

 3. insertOrder(...)                    → MIA-2026-001007, linked, unverified
    The order's own email/phone/name are the buyer's; the ACCOUNT's email is where
    the mail goes, because that is the address anybody has proved they own.

 4. orderPlacedConfirmation email to elena@example.com, carrying report token R

 5a. Elena signs in and presses "No, non è mio"
       rejectLink()  →  customer_account_id  = NULL
                        customer_link_status = 'rejected'
                        order_status_events: unverified → rejected, actor = customer
     The ORDER SURVIVES. It is a real order somebody placed and a fiscal record;
     only the claim that it belongs to Elena goes away. `orders_customer_link_check`
     enforces that pairing so the two columns can never disagree.

 5b. Or she clicks "Non hai effettuato tu questo ordine?" instead
       POST /api/order-disputes { token: R, reportedPhone, message }
       → order_disputes row, status 'open'
       → alert email to the addresses in Settings → Notifications
       → an operator calls the number SHE gave, never the one on the order
```

`rejectLink` reads the current status before overwriting it, because a customer can
reject an order they confirmed months earlier — the timeline records
`confirmed → rejected`, not an assumed `unverified`.

## Signed-in checkout

A session is proof, so the link is written `confirmed` immediately and no activation
mail is sent. If the form carries a different email from the account's, the order
links to the **session** account and the typed address is snapshotted as that
order's contact detail. It is not treated as an identity claim and no second account
is created from it.

For this to work at all, `checkout.astro`'s `submitOrder()` must send
`credentials: 'include'` — the API is a different origin, so without it the cookie
never arrives and a signed-in order would link as `unverified`.

## Sessions

Cookie-based with the session held server-side. A random 256-bit token lives in an
`HttpOnly` cookie; the database stores only its SHA-256, as `customer_sessions.id`.
No JWT, no library. `shared/auth/customer-session.ts` imports `hashToken` and
`createSessionToken` from `session.ts` so there is one definition of how a session
token is made.

Two differences from the back office, both deliberate:

|                 | `admin_sessions`                       | `customer_sessions`              |
| --------------- | -------------------------------------- | -------------------------------- |
| Cookie          | `mia_session`                          | `mia_customer_session`           |
| TTL             | `SESSION_TTL_DAYS` (7)                 | `CUSTOMER_SESSION_TTL_DAYS` (30) |
| Expiry          | Fixed from sign-in                     | **Sliding**                      |
| Password change | Revokes every session, caller included | Revokes every **other** session  |

Sliding expiry only fires when the row has drifted more than
`CUSTOMER_SESSION_REFRESH_HOURS` below a full TTL. Without that threshold every
request from an active customer would write a row — a write per page view for no
benefit. With it, a customer who visits monthly is never signed out and the cost is
at most one `UPDATE` per customer per day.

Password change keeping the caller signed in differs from `modules/auth/service.ts`
on purpose. A stolen session still dies the moment the victim reacts, but the
customer is not thrown onto a login screen immediately after choosing a password —
the case that matters most, since setting one is the first thing an activating
customer does.

## Emailed tokens

One table, `customer_auth_tokens`, four purposes. Same lifecycle throughout: issue,
mail, redeem once, expire. Only the SHA-256 is stored, so a database dump cannot be
turned back into a working link.

| Purpose          | TTL     | Carries `order_id` | Redeemable as a sign-in |
| ---------------- | ------- | ------------------ | ----------------------- |
| `activation`     | 7 days  | yes                | yes                     |
| `magic_link`     | 15 min  | no                 | yes                     |
| `password_reset` | 60 min  | no                 | yes                     |
| `order_report`   | 30 days | yes                | **no**                  |

`order_report` is excluded from `redeemToken` deliberately. It is a capability for
one page, handed to somebody who may not own the account — letting it mint a session
would turn a link designed for "this wasn't me" into a way into the account being
complained about.

Redemption is a single atomic statement:

```sql
UPDATE customer_auth_tokens SET consumed_at = now()
WHERE id = $1 AND consumed_at IS NULL AND expires_at > now()
RETURNING *
```

Two clicks arriving together cannot both win. A select-then-update would let them.

## Not leaking who has an account

`POST /magic-link` and `POST /password-reset` always answer
`"Se l'indirizzo è registrato, riceverai un'email tra poco."`, whether or not the
address exists. Both are unauthenticated, so any difference in the response makes
them an account-enumeration oracle. `login` uses one generic error for every failure
mode and burns equal work via `fakeVerify()` on an unknown address, so response
timing does not answer the question either.

Two rate limiters guard the mail routes: one keyed on the caller's IP, one on the
**address being mailed**. The second is not redundant — an attacker rotates IPs far
more cheaply than a victim changes their email, so without it we are a way to flood
somebody else's inbox.

## Route paths are duplicated, on purpose

The server builds email links from `modules/notifications/links.ts`; the storefront
owns the same paths in `apps/website/src/lib/routes.ts`. The server cannot import
from the website app, so they are written twice.

**Change one and you must change the other**, or every link in every account email
404s. There is no build-time check binding them. The pairs:

| Purpose                 | Path                    |
| ----------------------- | ----------------------- |
| Sign in                 | `/accedi/`              |
| Account home            | `/area-clienti/`        |
| Orders                  | `/area-clienti/ordini/` |
| Activation + magic link | `/attiva-account/`      |
| Password reset          | `/reimposta-password/`  |
| Dispute report          | `/segnala-ordine/`      |

All six are in `PRIVATE_ROUTES`, which drives `noindex` and `no-store`. The
token-bearing pages carry a live credential in their query string, which must never
reach a cache or an index.

## What a customer can see of their own order

`CustomerOrderDetailDto` is narrower than the admin's, and the omissions are the
point: no internal id, no status timeline, no operator notes, no `allowedStatuses`,
and no fiscal identifiers. Reading back your own codice fiscale gains you nothing
and is the sort of field that ends up in a screenshot.

Every query in `modules/customer-account/repo.ts` is scoped by
`customerAccountId` in its `WHERE` clause rather than filtered afterwards, so no
code path there can return somebody else's order. An order number that is not theirs
404s rather than 403s, per the hidden-resource rule in `apps/server/AGENTS.md`.

## Access control has no roles

`admin_users` has no `role` column and there is no role enum. Back-office access is
a list of integer permission codes in `admin_users.permissions`, plus
`admin_users.is_superuser`, which means "every code, including ones added to the
catalog later". That one attribute exists so adding a permission does not silently
strip an all-access operator of the new area — with a plain array, every new code
would need backfilling onto existing rows.

Customers have neither. Their access is always "their own rows", which is a
service-layer question about a specific resource, not something a route guard can
answer — which is why `requireCustomer` takes no codes.

## Where things live

```text
packages/db/src/schema/
  admin-users.ts        admin_users, admin_sessions
  customers.ts          customer_accounts, customer_sessions, addresses
  customer-auth.ts      customer_auth_tokens  (own file: needs accounts AND orders,
                                               which keeps the import graph acyclic)
  orders.ts             orders, order_items, order_status_events, order_disputes
  settings.ts           platform_settings

apps/server/src/shared/auth/
  customer-session.ts   cookie, withCustomerSession, sliding expiry
  guards.ts             requireCustomer, currentCustomer
  password.ts           Argon2id — shared with the back office, unchanged

apps/server/src/modules/
  customer-auth/        sign-in, tokens, password
    order-account.ts    resolveForOrder — called BY orders, knows nothing about it
  customer-account/     own orders, profile
    order-links.ts      confirm / reject  (shared with customer-auth, so neither
                                           module has to depend on the other)
  order-disputes/       the report and its back-office queue
  notifications/        templates, links, send policy
  settings/             notification recipients
```

The dependency runs one way: `orders → customer-auth`. `resolveForOrder` lives in
its own file for exactly that reason — putting it in `customer-auth/service.ts`
alongside code that needed orders would close the loop.

## Known gaps

- **Saved addresses are unwired.** `addresses` exists and points at
  `customer_accounts`, but nothing writes to it and checkout does not offer to reuse
  one.
- **No admin customers list.** The 1500 `CUSTOMER_*` permission codes are defined
  and unused; an operator cannot browse accounts, only see the one on an order.
- **Email cannot be changed.** Deliberate — it needs a re-verification round trip —
  but it means a customer who mistypes their address at checkout cannot fix it
  themselves.
- **Checkout is not prefilled** for a signed-in customer. The order links correctly;
  they just retype their details.
- **The rate limiter is per-process.** Documented in `shared/http/rate-limit.ts`;
  running two instances halves every limit here.
- **Two pre-existing orders lost their name for good.** `MIA-2026-001018` and
  `MIA-2026-001022` were store pickups placed before `orders.first_name` existed, so
  their name lived only in a null address snapshot. Nothing can recover them.
