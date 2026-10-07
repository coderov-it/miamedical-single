# Rental contracts

`apps/server/src/modules/contracts` issues, tracks and signs the rental
contracts. `service.ts` is the front door (reads, building from an order or a
form); `issue.ts` issues, `lifecycle.ts` holds the operator actions on an open
contract (resend, link, period, void), `signing.ts` the customer's signature. The four blank paper contracts (PDFs in `docs/assets/blank-contracts/`)
are the spec;
`packages/templates/src/literal/contract/` renders their HTML equivalents.

## The four variants

Two facts pick the variant, both read off the order — never off the request:

|                      | Italian (`private`/`company`) | Foreigner (`tourist`)     |
| -------------------- | ----------------------------- | ------------------------- |
| **Deposit category** | `scooter_italian` (IT)        | `scooter_tourist` (EN)    |
| **No deposit**       | `carrozzina_italian` (IT)     | `carrozzina_tourist` (EN) |

- Language follows `orders.customerType`: `tourist` → English, otherwise Italian.
- Deposit follows the catalogue: `categories.requiresDeposit` (set in the admin's
  category editor; scooters and electric wheelchairs) → the `scooter_*` variants
  with the €300 deposit clause. `contracts/repo.orderRequiresDeposit` resolves it
  per order through item → product → category.

## Lifecycle

```
generated → sent → viewed → signed          voided (exit, admin, with reason)
```

1. **Issue** — a storefront rental is signed on the checkout and never goes
   through this lifecycle; see "Signed at checkout" below. Everything else —
   the admin's "Generate contract" and a paid rental extension — calls
   `service.generateFromOrder(db, orderId)`. It refuses an
   order with no rental lines, and refuses while a non-voided contract is still
   unsigned — resend or void, never a silent duplicate. That check runs inside the
   issuing transaction under a `FOR UPDATE` on the order row, so two concurrent
   issues cannot both pass it. Totals are summed over the rental lines alone, so a
   mixed order's contract adds up to its own table.
2. **Send** — a signing token (30 days, SHA-256 at rest) is mailed via
   `contractReady`; locally `MAIL_TRANSPORT=console` prints it to the server log.
   The link lands on the storefront's `/firma-contratto/` page. The contract row
   and the token commit first; the email goes after. Only a delivered email moves
   the contract to `sent` and writes "sent" on the timeline — a failed one leaves
   it `generated` with an `email` failure entry on the order, for the operator to
   resend (see `notifications-and-mail.md`).
3. **Sign** — the public `POST /api/contracts/sign` stores the drawn signature
   (data URL + IP + user agent) and confirms by email. Previews rendered after
   that composite the signature image into the signature block. See below.
4. **Order coupling** — every milestone writes an `order_status_events` row with
   `field: 'contract'` (sent / signed / voided / renewal sent), and
   `service.moveStatus` refuses `pending → paid` on a rental order until the
   newest non-voided contract is signed. See `orders-status-machine.md`.

## Signed at checkout

A storefront rental is signed before it is placed: checkout step 3 shows the
contract and takes the signature, and placement writes the order and the signed
contract in one transaction. No signing token and no "contract ready" email.
Code: `contracts/checkout.ts`, `orders/placement-contract.ts`,
`apps/website/src/scripts/checkout/contract.ts`.

```text
 Normal: one bariatric wheelchair, 3 days, collected in Roma
 1. step 3 opens     POST /api/orders/contract-preview  {items, customer, delivery}
                     → html of carrozzina_italian, numbered BOZZA      nothing written
 1'. until it lands  a loader replaces the sign box; checkbox, "Annulla" and
                     "Firma e continua" disabled. Failed → "Riprova" in the row
 2. "Visualizza"     the html in a dialog (shadow root)
 2'. "Ingrandisci"   a large signing popup; "Usa questa firma" crops the drawing
                     and fits it into the inline box, the one the form reads
 3. "Firma e …"      gate: box signed, consent ticked
                     signature kept in the page, keyed to the body it was given for
 4. "Invia"          POST /api/orders {…, contractSignature: {signatureDataUrl, consent: true}}
                     ┌ one transaction ──────────────────────────────────────────┐
                     │ order MIA-2026-001028 + lines                             │
                     │ contract CTR-2026-001025, born `signed`, signature_data   │
                     │   { imageDataUrl, ipAddress, userAgent, consentedAt,       │
                     │     channel: 'checkout' }                                  │
                     │ timeline "signed"                                         │
                     └───────────────────────────────────────────────────────────┘
                     → after commit: "contratto firmato" email

 Changed: customer signs, then edits their surname in step 1
 3'. step 3 reopens  body differs from the signed one → box and tick cleared,
                     "I tuoi dati sono cambiati…" shown, preview re-fetched
 4'. "Invia" with a stale signature cannot happen: placement reopens step 3

 Refused (422, nothing written):
   rental without contractSignature   → fields.contractSignature
   consent: false                     → fields['contractSignature.consent']
   sale WITH contractSignature        → fields.contractSignature
   preview of a sale-only order       → 422
```

The preview and the stored contract are built by the same `draftContract`
(`contracts/draft.ts`) from the same request, so what was read is what is
stored — only BOZZA becomes the drawn number. A sale-only checkout has no step 3.

## Signing by email link

The admin-issued contracts above. Opening the link never spends the token — `GET /api/contracts/sign` only moves
`generated`/`sent` → `viewed` (first view time kept). The token is spent by the
submit, in the transaction that saves the signature.

```text
 Normal: CTR-2026-001018 sent, renewal extension awaiting_signature
 1. GET  ?token=abc            → status viewed            token unspent
 2. GET  ?token=abc (again)    → still viewed             token unspent
 3. POST ?token=abc            ┌ one transaction ────────────────────────────────┐
                               │ token: consumed_at set  (if unspent, unexpired)  │
                               │ contract → signed       (if generated/sent/viewed)│
                               │ timeline "signed", operator + customer feed      │
                               │ extension → active, order end date moved         │
                               └──────────────────────────────────────────────────┘
                               → after commit: "contratto firmato" email
 4. POST ?token=abc (again)    → 409 "Contract is already signed."  nothing changes

 Fault:  step 3 fails mid-way (database error, crash)
 3.  POST ?token=abc           → 500; the whole transaction rolls back:
                                 status viewed, token unspent, end date unchanged
 3'. POST ?token=abc (retry)   → signed, exactly as in the normal case
```

Either guard matching no row means another request won — a second submit, or an
operator's void — and the loser gets 409 (signed / voided) or 410 (link used /
expired) with nothing written. A failed confirmation email never unsigns: it is
sent after commit and, on failure, written on the order's timeline.

The operator side is guarded the same way (`lifecycle.ts`): void, resend and the
period change only write while the contract is still `generated`/`sent`/`viewed`,
so none can overwrite a signature that landed between their read and their write.
A resend whose email fails answers 502 to the operator, with the failure also on
the order's timeline.

## Renewal

A rental is extended through `modules/rental-extensions`, not by rewriting the
order. Once the operator records the extension's payment,
`generateFromOrder(…, { kind: 'renewal', extension })` issues a **new** contract
on the same order. It covers only the extension's span, at the amounts frozen on
the extension row, and charges no delivery. The contract and the extension's
link to it commit in one transaction (`onIssued`). When it is signed,
`rental-extensions/activate.ts` moves the order's end date inside the signing
transaction. Earlier contracts stay in the
history: `GET /api/admin/contracts/by-order/:orderId` lists them all, newest
first. The full flow is in `rental-extensions.md`.

## Manual contracts

Walk-in and phone rentals go through `POST /api/admin/contracts/manual`
(`ManualContractSchema`), which has no order behind it: `orderId` is null, the
admin types the items, and `hasDepositProduct` is asked explicitly.
