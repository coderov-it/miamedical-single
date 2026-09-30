# Account deletion

`/delete-profile/` — the public page Google Play requires: a customer can erase
their profile without the app and without signing in. Server:
`apps/server/src/modules/account-deletion/`. Storefront:
`pages/delete-profile.astro` → `views/account/DeleteProfileView.astro` →
`scripts/account/delete-profile.ts`.

The slug is English in every language — `/delete-profile/`, `/en/delete-profile/`,
`/fr/delete-profile/`, `/de/delete-profile/` — so the Google Play URL never
changes, while the page still sits in `routePaths` and the language switcher
works.

## The walk

### Normal case

```text
 1. Page: "Email o ID utente" = elena@example.com  → [Invia il codice]
      POST /api/customer/account-deletion/request { identifier }
      findByEmail("elena@example.com")          → account 4f2a…
      discardCodes(4f2a…)                       → any older code stops working
      code = 482915
      customer_auth_tokens.id = sha256("4f2a…:482915"), purpose account_deletion, 15 min
      accountDeletionCode email                 → "Il tuo codice: 482915"
    ← "Se il profilo esiste, abbiamo inviato un codice…"   same answer for everyone

 2. Page: code = 482915  → [Verifica il codice]
      POST …/verify { identifier, code }        → live row for that hash?  yes
    ← { ok: true }                                nothing spent yet

 3. Page: ☑ "Ho capito che … non potrò recuperarli"  → [Elimina definitivamente]
      POST …/confirm { identifier, code, acknowledged: true }
      consumeAuthToken(hash)                    → atomic, single use
      eraseAccount(4f2a…)                       → one transaction (below)
    ← { deleted: true }                           page shows "Profilo eliminato"
```

The identifier may also be the customer's UUID — `findById` instead of
`findByEmail`. The code always goes to the account's own address, never to
anything typed on the page.

### Fallback cases

```text
 unknown address     → step 1 answers the same; no mail, so step 2 always fails
 wrong code          → 400 invalid_code → shown at the code field
 code expired while  → confirm answers invalid_code → page returns to step 2,
   reading step 3       field marked; "Invia un nuovo codice" mails a fresh one
 6th wrong guess     → 429 for 15 minutes, keyed on the identifier (and IP)
```

## What erasure does

| Deleted                                                                   | Kept                                   |
| ------------------------------------------------------------------------- | -------------------------------------- |
| sessions, emailed tokens, addresses, carts, push devices, in-app feed     | orders, order disputes (fiscal record) |
| account row: names, phone, password, language, preferences blanked        |                                        |
| `email` → `deleted-<id>@deleted.invalid`, `deletedAt` set, `isActive` off |                                        |

Orders carry their own name/email snapshot, which Italian tax law makes us hold
for 10 years. They stay pointing at the tombstoned row. The same address can
register again later and gets a clean new account, because `findByEmail` skips
soft-deleted rows.

## Why a 6-digit code is enough

The hash includes the account id, so a code only ever matches one account. Verify
and confirm share one limiter keyed on the identifier: 5 wrong guesses per 15
minutes, against a one-in-a-million code that expires in 15 minutes. Only
failures count, so a customer who types it right the first time never hits the limit.
The limiter is per-process, like every other one (`shared/http/rate-limit.ts`).
