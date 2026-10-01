# Rental contracts

`apps/server/src/modules/contracts` issues, tracks and signs the rental
contracts. The four blank paper contracts (PDFs in `docs/assets/blank-contracts/`)
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

1. **Issue** — `service.generateFromOrder(db, orderId)` is the single path:
   storefront placement (rental lines only — a sale has nothing to sign), the
   admin's "Generate contract", and a paid rental extension all call it. It refuses an
   order with no rental lines, and refuses while a non-voided contract is still
   unsigned — resend or void, never a silent duplicate. Totals are summed over
   the rental lines alone, so a mixed order's contract adds up to its own table.
2. **Send** — a single-use signing token (30 days, SHA-256 at rest) is mailed via
   `contractReady`; locally `MAIL_TRANSPORT=console` prints it to the server log.
   The link lands on the storefront's `/firma-contratto/` page.
3. **Sign** — the public `POST /api/contracts/sign` stores the drawn signature
   (data URL + IP + user agent) and confirms by email. Previews rendered after
   that composite the signature image into the signature block.
4. **Order coupling** — every milestone writes an `order_status_events` row with
   `field: 'contract'` (sent / signed / voided / renewal sent), and
   `service.moveStatus` refuses `pending → paid` on a rental order until the
   newest non-voided contract is signed. See `orders-status-machine.md`.

## Renewal

A rental is extended through `modules/rental-extensions`, not by rewriting the
order. Once the operator records the extension's payment,
`generateFromOrder(…, { kind: 'renewal', extension })` issues a **new** contract
on the same order. It covers only the extension's span, at the amounts frozen on
the extension row, and charges no delivery. When it is signed,
`rental-extensions/activate.ts` moves the order's end date. Earlier contracts stay in the
history: `GET /api/admin/contracts/by-order/:orderId` lists them all, newest
first. The full flow is in `rental-extensions.md`.

## Manual contracts

Walk-in and phone rentals go through `POST /api/admin/contracts/manual`
(`ManualContractSchema`), which has no order behind it: `orderId` is null, the
admin types the items, and `hasDepositProduct` is asked explicitly.
