# Online payments

The customer pays 100% of the goods online, by card, before the order counts.
Delivery is not charged online: a home delivery is paid to the carrier on the
doorstep. Gateway: Nexi XPay, hosted payment page.

Code: `apps/server/src/modules/payments/{start,settle,result,sweep,online-routes,attempt-repo}.ts`,
the gateway port and Nexi adapter in `apps/server/src/infra/payments/`, the
storefront in `apps/website/src/scripts/payment/` and `views/payment/`.

## Normal case: guest, wheelchair 7 days, €30

```text
 1. Step 4 "Pay and Confirm"       → POST /api/orders { items, customer, delivery, language: 'it' }
                                     order MIA-2026-001042 pending/unpaid, stock 3 → 2
                                     payment_due_at = now + 60 min (signed in: 24 h)
 2. payments/start.ts              → attempt MIA2026001042P1, token Xy3…, pending
                                     Nexi POST /orders/hpp €30.00 → hostedPage, securityToken
 3. 201 { number, payment: { token, redirectUrl } }
                                   → browser goes to Nexi's page, customer pays
 4. Nexi → POST /api/webhooks/payments/nexi { securityToken, operation.orderId }
                                   → secret matches the attempt → settle.ts
 5. settle.ts asks Nexi            GET /orders/MIA2026001042P1 → AUTHORIZATION EXECUTED, VISA
                                   → attempt paid; order pending → paid, payment unpaid → paid
                                     timeline "Paid online by card (VISA): 30.00 EUR, nexi ref. …"
 6. Nexi sends the browser to      /pagamento/?token=Xy3… → GET /api/payments/Xy3… → paid → ✓
```

Steps 4 and 6 race. Whichever reaches `settle.ts` first settles the attempt
(`attempt-repo.finish` only moves a `pending` row); the other finds it final.
In development Nexi cannot reach `localhost`, so step 6 does the settling.

## When it does not go through

```text
 Card declined            Nexi → result page → failed, canRetry
                          → "Try again" → POST /api/payments/Xy3…/retry → attempt P2 → Nexi
 Back button from Nexi    checkout remembers the order (placement-lock.ts)
                          → "Your order is waiting for payment" + "Pay now" → attempt P2
 Nexi unreachable         attempt P1 failed (START_FAILED), 201 still carries the token
                          → browser goes to the result page → "Try again"
 Never paid               sweep, every minute:
                            attempt pending > 20 min → asked once more → expired
                            order past payment_due_at, nothing in flight
                            → cancelled "Not paid in time", stock 2 → 3
 Signed in, came back     account order page: "Pay by 13/11/26, 10:00" + "Pay now"
                          → POST /api/customer/payments/orders/MIA-2026-001042
 Paid after cancel        payment recorded anyway; timeline says "refund it"
 Paid twice (two tabs)    second one noted on the timeline: "already paid — refund this one"
```

## Renewals

A renewal signed in the account (`docs/code/rental-extensions.md`) is paid the
same way. The modal's "Pay and Confirm" places it, then calls
`POST /api/customer/payments/orders/:number`, which pays the order's open
signed renewal when the order itself is already paid. Paid → `recordPayment`
with method `card_online` → the extension is active and the end date moves.
Unpaid renewals have no deadline; the customer can "Pay now" or withdraw.

## Configuration

`PAYMENT_PROVIDER=nexi`, `NEXI_API_KEY`, `NEXI_ENVIRONMENT=sandbox|production`,
`PUBLIC_API_URL` (where Nexi posts). Parsed in `config/payment-env.ts`, resolved
once in `config/features.ts` (`FEATURES.payments`). `PAYMENT_PROVIDER=none` is
development only: orders are placed unpaid with no deadline and nobody is sent
anywhere. Production refuses to start with it. The sandbox accepts Nexi's
public test keys and test cards (developer.nexi.it → Test area).

## Not built yet

Refunds (done in Nexi's back office for now), a second gateway (add an adapter
in `infra/payments/` next to `nexi.ts`), and a deadline on unpaid renewals.
