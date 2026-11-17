# Manual orders

An admin agent creates an order for a customer who phoned or wrote, then sends the
customer a private link to complete it (details, contract, payment) or records
a payment taken outside the gateway. Status: Phases 1 (schema + server rules), 2 (admin create,
send link, record payment) and 3 (website token page) built; Phase 4 is spec. Update this file in the phase that ships each part.

Code: `apps/server/src/modules/orders/manual/`, `apps/server/src/modules/order-links/` (mint only),
`apps/admin/src/lib/orders/new-order/`, `apps/website/src/{pages/complete-order.astro, views/complete-order, components/complete-order, scripts/complete-order}` (built).

## Worked examples

(a) Phone rental, customer signs and pays online

```
 1. agent opens /orders/new            search "rossi@"      → account Anna Rossi (email, name, phone)
    lines: letto-degenza, package 7-day, from 2026-12-01    → quote 180.00 (resolveLine, same as checkout)
    discount 20.00, reason "cliente storico"                → total 160.00
 2. POST /api/admin/orders/manual      → MIA-2026-001050 pending/unpaid, source manual,
                                         created_by_admin_user_id = agent, payment_due_at NULL,
                                         stock taken now (stockTaken true), held until paid or cancelled
                                         timeline: status null→pending, discount 0→20.00 "cliente storico"
                                         admin label: "waiting for signature"
 3. agent: steps "sign + pay", details form ON (codice fiscale missing)
    POST /api/admin/orders/:id/link    → token minted (30 d), email "manual order" sent
                                         (agent can resend: mints a new token, revokes the old; no reminders)
 4. customer opens /complete-order/?token=…   → left: details → contract → Nexi; right: summary 160.00
 5. PUT details (codice fiscale)       → order complete
    POST sign                          → contract CTR-… born signed (issueSigned), timeline "signed"
                                         admin label: "waiting for payment"
    POST payment                       → startForOrder → Nexi → settle.ts → pending→paid, rental starts
```

(b) Sale, customer pays by transfer

```
 1. agent creates order: sedia-ritirata x1, shipping 15.00 → MIA-2026-001051, total 15.00+price
    all details typed by agent; no rental → nothing to sign
 2. customer pays outside the gateway → agent sends no link (a sale has no contract, so
    "sign only" would be refused 422); label stays "waiting for payment"
 3. transfer arrives → "Record payment": method bank_transfer, reference "CRO 1234"
    POST /api/admin/orders/:id/record-payment
                                       → one move (moveStatus): status pending→paid, then paymentStatus
                                         unpaid→paid, both events carry the note; timeline "Payment recorded: bank transfer, ref. CRO 1234."
 4. missing details at step 3          → 409 "Complete the customer details first", fields listed
```

Rental, sign only: the customer signs from the link, pays outside, the agent clicks Record payment
(contract is signed, so `assertContractSigned` passes).

## Rules: manual versus online

|                       | online (`source = 'online'`)   | manual (`source = 'manual'`)                                                                               |
| --------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Customer details      | complete at checkout           | only `email` required at creation                                                                          |
| `orders_fiscal_check` | applies                        | does not apply (relaxed, see Schema)                                                                       |
| Unpaid sweep          | cancels past `payment_due_at`  | never: `payment_due_at` is NULL and the sweep also filters `source = 'online'`                             |
| Contract              | signed before the order exists | may be absent or unsigned while pending                                                                    |
| Start (pending→paid)  | gateway only if signed         | needs complete details AND, for rentals, a signed contract                                                 |
| Creator               | customer                       | `created_by_admin_user_id`                                                                                 |
| Discount              | none                           | order-level amount, reason required; locked once the contract is signed or a payment attempt is open (409) |
| Stock                 | taken at placement             | taken at creation too (`stockTaken: true`); cancelling returns it                                          |

- No new `order_status`. The admin derives a stage from existing data
  (`manualStage` on the DTO, computed once in `orders/mapper.ts`):
  `pending` + rental + latest contract not `signed` → `awaiting_signature` ("waiting for signature");
  `pending` + unpaid + (sale or signed) → `awaiting_payment` ("waiting for payment");
  `paid` onwards → the normal status label.
- Lines are catalogue products only: `PlaceOrderItemSchema`, resolved by `resolveLines`.
  There is no price field anywhere in the body.
- Total is `subtotal + shippingTotal - discountTotal` and must stay above 0.00 (the gateway cannot charge nothing).
  The discount cannot change after the customer signed (the contract states the amount) or while a payment attempt is open (409).
- Details are "complete" when the `CheckoutCustomerSchema` rules hold: first name, last name, phone,
  `customerType`, `codiceFiscale` (private, company), `partitaIva` (company).
- Record payment permission: `ORDER_UPDATE` (`order:update`). It is the code that already gates
  `POST /api/admin/orders/:id/status` (the move to `paid`) and `/payment`; recording a payment is exactly that
  move plus a note, so a new grant would only add a second way to the same act. `PAYMENT_UPDATE` is unused today and
  belongs to the gateway payments list. `ORDER_CREATE` (in the `order_desk` bundle) gates create, send link, discount.

## Schema changes (`packages/db/src/schema/orders.ts`, new migration after `0024_add_product_views.sql`)

```
orders.source                    order_source NOT NULL DEFAULT 'online'   -- enum 'online' | 'manual'; backfill = default
orders.created_by_admin_user_id  uuid NULL → admin_users.id ON DELETE SET NULL
                                 FK named orders_created_by_admin_fk
orders.discount_reason           text NULL
orders_discount_check            CHECK (discount_total >= 0 AND discount_total <= subtotal + shipping_total)
orders_fiscal_check              DROP + ADD: (source = 'manual') OR (existing expression)
orders_manual_actor_check        CHECK (source <> 'manual' OR created_by_admin_user_id IS NOT NULL)
```

`orders.discount_total` already exists (default 0.00, read by the admin and `analytics/rollup.ts`); only manual orders write it.
`orders.customer_type`, names and phone are already nullable, so an email-only order inserts as is.
`order_status_events.field` is text: new values `discount` and `link` need no migration (the DTO union has both), only labels in
`apps/admin/src/lib/orders/order-timeline-card.svelte` (`FIELD_LABELS`) and in `docs/code/orders-status-machine.md`.

New table `order_link_tokens` (new file `packages/db/src/schema/order-links.ts`, exported from the schema index):

```
id                       text PK            -- SHA-256 of the raw token, like contract_signing_tokens
order_id                 uuid NOT NULL → orders.id ON DELETE CASCADE      (derived fk name 39 bytes, ok)
steps                    text NOT NULL      -- 'sign_pay' | 'sign' | 'pay'
include_details          boolean NOT NULL
expires_at               timestamptz NOT NULL
revoked_at               timestamptz NULL   -- set when a newer link is minted
created_by_admin_user_id uuid NULL → admin_users.id ON DELETE SET NULL, FK named order_link_tokens_admin_fk
created_at               timestamptz NOT NULL DEFAULT now()
indexes: order_link_tokens_order_idx (order_id), order_link_tokens_expires_idx (expires_at)
```

Not single-use (the page is visited several times); ends by expiry (30 days), revocation, or the order leaving `pending`.
Resending mints a new token and revokes the old; nothing reminds the customer automatically.
The derived FK name for the admin column would be 60 bytes, so it is named explicitly. All names above are under 63 bytes.
Add `order_link_tokens` expiry cleanup next to `customerAuthRepo.deleteExpiredAuthTokens` callers.

## Server

Mount prefixes from `apps/server/src/app.ts`: `/api/admin/orders` (`orderAdminRoutes`), new `/api/order-links` (`orderLinkPublicRoutes`).
Static admin routes are registered before `/:id`, as `/customers` already is. Each handler carries the banner comment.

```
GET  /api/admin/orders/customer-accounts?q= (order:create)      accounts by email first, then name/phone
POST /api/admin/orders/manual/quote         (order:create)      lines → priced lines + subtotal, for the form's totals
POST /api/admin/orders/manual               (order:create)      creates the order (+ discount event)
POST /api/admin/orders/:id/discount         (order:create)      set/replace discount on a pending manual order, reason required
POST /api/admin/orders/:id/link             (order:create)      mint token; deliver 'email' or 'copy'; resend = mint again
POST /api/admin/orders/:id/record-payment   (order:update)      { method: bank_transfer|cash|card_pos, reference? }

GET  /api/order-links?token=                (public, order link token)  summary, allowed steps, missing fields
PUT  /api/order-links/details?token=        (public, order link token)  save customer details
POST /api/order-links/contract-preview?token= (public, order link token) rendered draft contract
POST /api/order-links/sign?token=           (public, order link token)  signature + consent
POST /api/order-links/payment?token=        (public, order link token)  starts the Nexi session
```

The raw token is stored nowhere, so "Copy link" mints a fresh token (revoking the previous one) and returns its URL once.

Reuse and refactor:

- `orders/placement-input.ts` `resolveLines(db, items)`: reused as is for create and quote. `PlaceOrderInput['items']` is the type; no change.
- `orders/repo.ts` `insertOrder`: `NewOrderData` types names, phone, `customerType` as required strings. Make them nullable, add `source`,
  `createdByAdminUserId`, `discountTotal`, `discountReason`, `paymentDueAt: null`, `openingNote`. `order.placed` still goes
  to admins with order:read, except the creating agent (`emitToAdmins` takes `exceptAdminUserId`). The `pending` event note is
  "Created by <agent> for a phone order." and its actor is the agent. `stockTaken: true` stays (decision 1).
- Total: one new `orders/totals.ts` `orderTotal(subtotal, shipping, discount)` built on `addMoney`/`subMoney` from `@mia/pricing`.
  Replace both derivations: `placement.ts` (`const total = addMoney(subtotal, shippingTotal)`) and `service.update`
  (`patch.total = addMoney(order.subtotal, input.shippingTotal)`), which must read the stored `order.discountTotal`.
  `OrderPatch` already carries `total`; add `discountTotal`, `discountReason`.
- `PlacementContext` and `place()` are bound to `PlaceOrderInput` (complete customer, `contractSignature`, session). Do not bend them.
  A sibling `orders/manual/create.ts` shares `resolveLines`, `deliverySnapshot`, `addressSnapshot` (their customer parameter becomes
  a `Partial` shape) and `insertOrder`.
- Customer account: `customer-auth/order-account.ts` `resolveForOrder` also plans activation mails. Add `resolveForManualOrder`
  (find-or-create by email via `repo.createOrGetByEmail`, empty names allowed as sign-in-page accounts already are; no mail plan;
  link status `confirmed` when the agent picked an existing account, `unverified` for a typed email, decision 5) so the "Didn't ask for this order?" token has a `customerAccountId` to bind to (`issueAuthToken`, purpose `order_report`).
- Readiness: `orders/manual/readiness.ts` `missingCustomerFields(order): string[]` and `assertStartable(order)` (409 with a `fields` map);
  used by the link endpoint, the token payment endpoint and `recordPayment`.
- Discount: `orders/manual/discount.ts` `setDiscount` (pending manual order only; `pricing.ts` holds the pure `priceDiscount` and
  `assertDiscountEditable`, the lock of decision 8); writes `discountTotal`, `discountReason`, `total` and a `discount` event.
- `service.recordPayment(db, id, input, actor)` (new, in `orders/manual/payment.ts`, mirrors `rental-extensions/service.recordPayment`):
  checks order is `pending`, `assertStartable`, then calls `moveStatus(db, id, 'paid', note, actor)`. `moveStatus` already runs
  `assertContractSigned`, moves status then payment (`PAYMENT_FOLLOWS_ORDER`), and writes both events with the note.
- Sweep: `payments/attempt-repo.ts` `findOverdueOrders` adds `eq(orders.source, 'online')`. `payments/start.ts` `isPayable` is unchanged
  (NULL `paymentDueAt` is payable). `startForOrder` is called by the token payment endpoint after `assertStartable`; a rental
  with an unsigned contract is a 409, because `settle.applyPaid` would otherwise take money it cannot move to `paid`.
- Contract at the link: `contracts/signing.ts` `sign` needs a contract and a signing token minted at issue time, and freezes the
  customer block then; a manual order may not have its details yet. So the page signs like the account renewal does (decision 3):
  `contracts/service.ts` `termsFromOrder(db, orderId)` → `contracts/checkout.ts` `renderDraft` for preview →
  inside `db.transaction`, `issueSigned(tx, order, terms, signature, 'order_link')` (add `'order_link'` to `SignedChannel` and
  `SIGNED_NOTE`), then `sendSignedReceipt` after commit. No contract row exists until the customer signs.
  Details saved after signing are refused (409): the contract is frozen. The contract states the order discount, so the signed
  amount equals what is charged (decision 6; `contracts/draft.ts` totals, Phase 3).
- Token module `order-links/{token,service,routes,repo}.ts`: `generateToken`/`hashToken` from `contracts/token.ts`; a token whose
  order is no longer `pending`, or is revoked/expired, answers 410.
- Email: `notifications/links.ts` gets `completeOrderUrl(token, language)` and `PATHS.completeOrder`; `notifications/mail.ts` gets
  `sendManualOrderLink`; `mail-failure.ts` `MailKind` gets `manual_order_link`, so a failed send lands on the timeline.
- DTOs (`orders/dto.ts`): `AdminOrderSummaryDto` and `AdminOrderDetailDto` gain `source`, `manualStage` (`manual/stage.ts`, called by `mapper.ts`), `discountReason`, `createdByName`.
  `hasRental` and `contractStatus` are already on the list row.

## Admin UI

Route `apps/admin/src/routes/(app)/orders/new/+page.svelte` (add `orderNew: '/orders/new'` to `apps/admin/src/lib/routes.ts`),
a "New order" button on `orders/+page.svelte` shown with `session.can(P.ORDER_CREATE)`. Components in `apps/admin/src/lib/orders/new-order/`,
split like `apps/admin/src/lib/contracts/new-contract/` (each file under 350 lines):

- `order-form.svelte.ts` state class, as `contract-form.svelte.ts` (`$state` fields, `busy`, derived totals from the quote, not client math).
- `customer-section.svelte`: from `new-contract/customer-section.svelte` keep the debounced `Resource` + result list pattern, but query
  `customer-accounts` (not `orders/customers`), email first; picking fills email, name, phone and, from that account's latest order,
  customer type, codice fiscale, partita IVA and address (decision 4).
- `lines-section.svelte`: catalogue product picker (existing admin products list endpoint), package, start date, add-ons, answers; no price inputs.
  `new-contract/items-section.svelte` is NOT reusable (free-typed items and prices).
- `discount-section.svelte` (amount + required reason), `delivery-notes-section.svelte`, `totals-card.svelte` (reuse `new-contract/totals-card.svelte`
  and `money.ts`).
- Order detail (`order-detail-view.svelte`): stage badge, "Send link" dialog (steps radio: sign + pay / sign only / pay only; checkbox "include customer
  details form", checked by default; actions "Send by email" and "Copy link"), "Record payment" dialog (method + reference), discount shown in
  `order-money-card.svelte`.
- Validation follows CLAUDE.md: buttons are never `disabled`. Click validates; the server's 422 `fields` map to the offending controls, scroll to the
  first, focus it. Details incomplete + details box unchecked → mark the missing fields. Rental unsigned + "pay only" → warning
  "contract signing required for payment". Texts in `~/lib/ui-text`; no help text beyond one line on the steps radio.

## Website token page

- `PRIVATE_SEGMENTS.completeOrder: '/complete-order/'` in `apps/website/src/lib/routes.ts`; mirror in `notifications/links.ts` (`PATHS`, the
  two files must agree). Page file `apps/website/src/pages/complete-order.astro`, thin shim like `payment.astro`:
  `prerender = false`, `noindex`, body in `views/complete-order/CompleteOrderBody.astro`, behaviour in `scripts/complete-order/`.
  Not the checkout stepper; checkout files are not touched.
- Layout: left column steps, only those the token allows: (1) details form if `include_details`, (2) contract view + signature, (3) Nexi payment.
  Right column: order summary (lines with package/period, quantities, prices, discount, total, derived status).
- Reuse: `scripts/signature-pad.ts` `createSignaturePad`, `scripts/signature-dialog.ts` `wireSignatureDialog`,
  `components/contract/SignatureDialog.astro`, `lib/form-validation.ts` `createFormGate` (click validates, never disabled),
  `components/checkout/CheckoutField.astro` for inputs. New: summary panel, step shell, API client.
- Behaviour: pay with unsigned rental contract is refused with the same 409 the server sends; "pay" button starts
  `POST /api/order-links/payment` and redirects to `redirectUrl`; Nexi returns to `/payment/` (existing result page).
- i18n: copy keys through `translate`, listed in a `SCRIPT_KEYS` array as `payment.astro` does.

## Emails

New `packages/templates/src/literal/email/manual-order-link.ts` (+ entry in `samples.ts`, export in `index.ts`), separate from the
three `order-placed-*` templates. Content: greeting, what to do (sign / pay / fill details, per steps), the link button, the order number
and total, and "Didn't ask for this order? Click here" pointing at `reportOrderUrl(reportToken, language)` (token from
`issueAuthToken`, purpose `order_report`; `order-disputes/service.create` consumes it). Language follows the account
(`customer-auth/language.ts`), translated like the other templates.

## Build phases

1. BUILT. Schema + server rules. Files: `schema/orders.ts`, `schema/order-links.ts`, `schema/enums.ts` (`order_source`), migration,
   `orders/totals.ts`, `placement.ts`, `service.ts`, `repo.ts`, `orders/manual/*`, `payments/attempt-repo.ts`, `orders/dto.ts`, `mapper.ts`.
   Done when: a manual order inserted with email only passes the DB; an online order with `private` and no codice fiscale is still refused;
   the sweep leaves a manual order pending past any time; both total derivations subtract the discount (tests); `recordPayment` refuses
   incomplete details and unsigned rentals and, when valid, writes both events in one move.
2. BUILT. Admin create + send link + record payment. Files: `orders/routes.ts`, `order-links/{service,token,repo}.ts` (mint only),
   admin `orders/new`, `new-order/*`, detail dialogs, timeline labels, `ui-text`. Done when: an agent creates example (a) steps 1-3 end to end,
   the link is copied or mailed (console transport), click validation marks and focuses fields, example (b) completes through Record payment.
3. BUILT. Website token page. Files: `order-links/routes.ts` (public), `contracts/checkout.ts` (`'order_link'`), `routes.ts`, `links.ts`,
   `pages/complete-order.astro`, view and scripts. Done when: the link opens the page, details save, contract signs, Nexi sandbox pays and the order is
   `paid` with the right stage labels in the admin; revoked/expired/paid-order links answer 410.
   Must do: the token payment endpoint locks the order row (`SELECT ... FOR UPDATE`) and re-checks the discount lock
   (`assertDiscountEditable` inputs) in the same transaction that opens the payment attempt, closing the race with `setDiscount`.
4. Emails + translations. Files: `manual-order-link.ts`, `samples.ts`, `mail.ts`, `mail-failure.ts`, `@mia/i18n` stage labels, website keys for all
   languages (`docs/code/adding-a-language.md`). Done when: the email renders in every language in `/email-preview`, the report link files a dispute,
   a failed send shows on the timeline.

## Phase 2 as built

```
server  orders/manual/routes.ts     the six spec routes + GET /manual/products (line picker); mounted into
                                    orderAdminRoutes with .route('/') ahead of /:id (banners carry full paths)
        orders/manual/{accounts,quote,products}.ts   account search (+ prefill), quote, picker projection
        order-links/{token,repo,service,validation}.ts   mint only: revoke previous, 30 d, `link` event, 422/409 rules
        notifications/links.ts      completeOrderUrl + PATHS.completeOrder (website PRIVATE_SEGMENTS.completeOrder mirrors it)
        notifications/mail.ts       sendManualOrderLink: STUB (plain subject/text/html, no report link) - Phase 4 swaps it
packages/validators/src/manual-order.ts   ManualOrderSchema, ManualOrderQuoteSchema, ManualDiscountSchema,
                                          SendOrderLinkSchema, RecordPaymentSchema, search schemas
admin   routes/(app)/orders/new, lib/orders/new-order/*, order-manual-card / -link-dialog / -payment-dialog /
        -discount-dialog, manual-order.ts, timeline labels, i18n namespace `newOrder` (en, it, fr, de)
tests   order-links/validation.test.ts (pure), order-links/links.integration.test.ts (MIA_DB_TESTS=1, not yet run)
```

Deviations from the spec text:

- The quote takes `discountAmount` (amount only), not the whole discount: the reason is checked at creation.
- `GET /manual/products?q=` is new. The order desk bundle has no `product:read`, so the line picker cannot use the admin
  products list; this route returns the storefront projection (`toPublicDetail`, Italian) trimmed to what `resolveLine` asks.
- The link endpoint also refuses `sign` alone when the contract is already signed (422), and a non-manual or non-pending order (409).
  It answers `{ url, expiresAt, delivered, emailSent }`; a failed email is `emailSent: false` (and a timeline `email` entry), not an HTTP error.
- The Send link dialog always shows all three step options. A click on Send/Copy whose choice cannot work (sale + a sign option,
  unsigned rental + "pay only", signed + "sign only") shows the reason at the radio group and focuses it; missing details with the
  details box unchecked are listed at the checkbox. The server's 422 `fields` map to the same two controls.
- The discount button stays visible; a signed contract is explained at the button on click. An open payment attempt is only
  known to the server, so that case answers with a 409 toast from the dialog.
- "Copy link" writes the URL to the clipboard and also shows it in a read-only field, because a clipboard write can be refused.
- The `link` timeline entry shows the steps without a "from" value; `discount` shows the amounts.
- The three new dialogs are mounted only while open (`{#if}`), so each opening starts from fresh state without an `$effect` reset.
- Files over the size target were split with no behaviour change: the orders list page into `lib/orders/list/{orders-kpi-strip,orders-table,order-drawer}.svelte`,
  the order detail view into `order-{customer,delivery,contract,address-cards}-card.svelte`.
- The stub email carries no "Didn't ask for this order?" link; that belongs to the Phase 4 template.

## Phase 3 as built

```
server  order-links/routes.ts      GET / , PUT /details, POST /contract-preview, /sign, /payment   (mount /api/order-links)
        order-links/access.ts      pure: linkRefusal (revoked > expired > paid > closed), allowedSteps, assertCanSign/Pay, assertSameTotal
        order-links/{redeem,read,summary,details,sign,payment,notify}.ts
        payments/start.ts          begin() split into openAttempt (a row) + dispatch (the gateway call); startForOrder unchanged
        orders/manual/discount.ts  setDiscount takes the row lock FIRST, then checks signed / open attempt / pending
        contracts/{draft,service,checkout}.ts + @mia/templates   discountTotal on the terms, a discount row, 'order_link' channel
        orders/status-notice.ts    the creating agent hears `paid` (order.status_changed, admin audience, .admin labels in @mia/i18n)
packages/validators/src/order-link.ts   OrderLinkQuery / Details / Sign / Payment schemas (details = CheckoutCustomerSchema minus email)
website pages/complete-order.astro (shim) → views/complete-order/CompleteOrderBody.astro, components/complete-order/*,
        scripts/complete-order/{index,client,details,contract,pay,summary,format,types}.ts; keys `completeOrder.*` in it/en/fr/de
tests   order-links/access.test.ts, contracts/draft.test.ts (pure); order-links/pay-flow.integration.test.ts (MIA_DB_TESTS=1, not run)
```

```
 customer opens /complete-order/?token=…   (steps sign_pay, details on, codice fiscale missing)
 1. GET summary                    → stage awaiting_signature, missingFields ['codiceFiscale'], total 160.00
 2. PUT details                    → missingFields []                         (409 once signed)
 3. POST contract-preview          → html + total 160.00, discount row "Sconto −20.00"
 4. POST sign {…, expectedTotal 160.00}
        lock order row → re-check pending / unsigned / details / total → issueSigned('order_link')
        → feed rows: contract.signed to contract:read operators and to the agent → receipt email after commit
 5. POST payment                   lock order row → isPayable, assertStartable, rental signed → attempt row (amount 160.00)
        commit → Nexi start (HTTP, no lock) → redirect → /payment/ result page → settle → paid → agent hears "Order paid"
 discount edit between 4 and 5     setDiscount waits for the lock, then sees the open attempt → 409
 token replaced / 30 days / order paid or cancelled → 410 { reason: revoked | expired | paid | closed }
```

Deviations from the Phase 3 spec text:

- Sign carries `expectedTotal` (the total the preview showed): an agent editing the discount between preview and signature
  gets a 409 and the page re-reads, so nobody signs a text other than the one stored.
- Sign (and the preview) need complete details first (409 + `fields`), because the contract states the customer; with a
  link whose details box is off the details were already complete at mint time.
- The discount reaches the contract as a `Sconto` row and a lower total; `contractTotals` clamps at 0.00. On a mixed
  order the contract still covers the rented rows only (as before), so its total is the rented rows plus delivery less the discount.
- The page does not ask for an address: the delivery is the agent's (Phase 2). The agent's discount reason is not shown to the customer.
- Pay with an unsigned rental is a 409 `{ step: 'sign' }`; the page shows its own localized sentence at the pay card, since
  the server's message is English. A link without the pay step answers 403 on `/payment`, one without sign 403 on `/sign`.
- The agent's "paid" notice reuses `order.status_changed` with the `.admin` label variant and goes only to the creating agent (and
  not when that agent recorded the payment themselves); no new notification kind. Contract-signed goes to the other `contract:read`
  operators as well, as the emailed-link signature does.
- `termsFromOrder` and `orderRequiresDeposit` take `DatabaseWriter` so they run inside the signing transaction.
- The page was SSR-checked in all four locales; the browser flow (signature pad, dialogs, Nexi redirect) is not covered by tests.

## Decisions

Owner-approved answers to the questions the first draft left open.

1. Stock: a manual order takes its units at creation (`stockTaken: true`, as `insertOrder` does); cancelling returns them.
2. The order link lives 30 days. The agent can resend (mints a new token, revokes the old). No automatic reminders.
3. The contract signs at the link through `issueSigned` (the account-renewal precedent); its row is born signed.
4. Picking an existing account in the admin also prefills customer type, codice fiscale, partita IVA and address from that account's latest order.
5. Account link status: the agent picked an existing account → `confirmed`; a new or typed-email account → `unverified`.
6. The contract shows the order discount, so the signed amount matches what is charged (Phase 3 work).
7. Notifications: `order.placed` goes to admins with order:read except the creating agent (built, Phase 1). The creating agent does get
   contract-signed and paid notices for their own manual orders (Phase 3: those notices come from `contracts/signing.ts` and
   `payments/settle.ts`; make sure the agent is among the recipients even without a general order:read fan-out).
8. The discount is locked once the contract is signed or a payment attempt is open for the order (409).

## Phase 1 as built

```
orders/totals.ts          orderTotal(subtotal, shipping, discount); placement.ts and service.update use it
orders/detail-repo.ts     findById (+ createdByName, contractStatus); re-exported by repo.ts
orders/manual/create.ts   createManualOrder(db, input, agent)   no route yet (Phase 2)
orders/manual/readiness.ts, payment.ts (+payment-note.ts), discount.ts (+pricing.ts), stage.ts, repo.ts
customer-auth/order-account.ts  resolveForManualOrder
payments/attempt-repo.ts  findOverdueOrders filters source = 'online'
migration 0025_add_manual_orders.sql
tests: orders/manual/manual.test.ts (pure) and manual.integration.test.ts (MIA_DB_TESTS=1, needs 0025 applied)
```

`recordPayment` calls `moveStatus`, which moves the status and then the payment status in two transactions, as it
does for the admin's own status move. `setDiscount` locks the order row for its write, but `startForOrder` does not
lock, so a payment started in the same instant as a discount edit is not excluded; closed in Phase 3 (see "Phase 3 as built").
