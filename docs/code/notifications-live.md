# Live notifications

The in-app feed. One table, pushed over SSE, fanned out by `pg_notify` from
inside the transaction that caused it. No queue, no vendor, no polling.

Both audiences are shipped: the operator's feed in the back office, and the
customer's at `/area-clienti/notifiche/`. A language column on
`customer_accounts` and localized email remain outstanding — see
`docs/plan/PLAN_app_push_notifications.html`, where the choice to key push off
the device locale and email off the account pulls that work into the push
phase. The design and the reasoning are in `docs/plan/PLAN_notifications.html`.

`modules/notifications/` used to mean "email". It now means "a thing somebody is
told", and email is one of its two channels — `mail.ts` is the old `service.ts`,
unchanged but for its name.

## The shape, in one worked example

An operator moves order `MIA-2026-001042` from `pending` to `paid`.

```text
1  orders/service.moveStatus
2    └─ orders/repo.applyTransition  ── BEGIN ─────────────────────────────┐
3         UPDATE orders SET status = 'paid'                                │
4         INSERT INTO order_status_events                                  │
5         INSERT INTO notifications (audience='customer', type=            │
6                 'order.status_changed', data={orderNumber, field,        │
7                 from:'pending', to:'paid'})                              │
8         SELECT pg_notify('mia_notification', '{id,type,audience,         │
9                 recipientId}')          ← queued, not sent               │
10       ────────────────────────────────────────────────── COMMIT ────────┘
11                                          ↑ the NOTIFY is released HERE
12
13  hub.ts   onNotify(payload)
14    ├─ streams.get('customer:<id>')  → empty?  return. No query, no work.
15    └─ repo.findById(db, recipient, id)   → one indexed row
16         stream.writeSSE({ event: 'notification', data: row })
17
18  browser  feed.svelte.ts
19    └─ prepend the row. Nothing is reconstructed from the frame sequence.
```

If line 3 had thrown, lines 5–9 would have rolled back **with it** and the
`NOTIFY` would have been discarded rather than sent. That is the whole reason
`pg_notify` is used instead of an in-process emitter: the guarantee is the
database's, not a convention every call site has to keep.

## The two rules

**The table is the truth; the stream is a hint.** Client state comes from
`GET /api/admin/notifications`. A frame either carries a row the snapshot could
have fetched anyway, or says `resync` — look again. A dropped connection is
therefore a re-read, never a lost notification.

**A row stores a type and a payload, never a sentence.** `type:
'rental.ending_soon'` plus `{ orderNumber, endsOn, daysLeft }`. The words live in
`@mia/i18n`'s `NOTIFICATION_LABELS` and are chosen at render time from the
reader's locale — so one row reads in four languages, a copy fix reaches rows
written last year, and a fifth language needs no migration.

A payload carries ids, dates, counts and proper nouns only. Writing a translated
string into `data` freezes that row into one language forever.

## Files

| File                                                             | What it owns                                                                                                     |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `packages/validators/src/notification.ts`                        | THE event catalogue. Pure types — no valibot, so `@mia/db` can type the jsonb column from it.                    |
| `packages/i18n/src/notification-labels.ts`                       | What each event says, per language. `satisfies` the catalogue, so a new event fails `tsc` until its copy exists. |
| `packages/db/src/schema/notifications.ts`                        | The table, the audience enum, the recipient CHECK, the three indexes.                                            |
| `modules/notifications/types.ts`                                 | The channel, the envelope, `ADMIN_EVENT_PERMISSION`.                                                             |
| `modules/notifications/write.ts`                                 | `emit` and `emitToAdmins`. The only writers.                                                                     |
| `modules/notifications/hub.ts`                                   | `LISTEN`, the recipient→streams map, the shared heartbeat.                                                       |
| `modules/notifications/repo.ts`                                  | Feed page, unread count, mark read. Every read scoped to one recipient.                                          |
| `modules/notifications/admin-routes.ts`                          | `GET /` (with `category` / `unread` filters), `GET /stream`, `POST /read`, `POST /read-all`.                     |
| `modules/notifications/customer-routes.ts`                       | The same four, behind `requireCustomer`. A near-copy, deliberately — see below.                                  |
| `modules/notifications/sweep.ts`                                 | The events no transaction produces.                                                                              |
| `modules/notifications/mail.ts`                                  | Email. Was `service.ts`; policy unchanged.                                                                       |
| `apps/admin/src/lib/notifications/`                              | The feed singleton, the row renderer, and the one shared `NotificationRow`.                                      |
| `apps/admin/src/lib/components/notification-bell.svelte`         | The bell, its dropdown, and the SSE connection's lifetime.                                                       |
| `apps/website/src/lib/notifications.svelte.ts`                   | The customer feed store: snapshot, `EventSource`, mark-read.                                                     |
| `apps/website/src/lib/notification-copy.ts`                      | Payload codes and ISO dates → words and dates, per event type. Tested.                                           |
| `apps/website/src/components/account/NotificationsScreen.svelte` | The customer's list, its three states, and mark-all.                                                             |

## Who is told what

An admin notification goes to every operator holding the relevant **read**
permission, one row each — `N` inserts where `N` is the size of the operations
team. That is clearly wrong at fifty thousand recipients and clearly right at
five; a shared row plus a `notification_reads` join table would leave two
mechanisms answering "have I read this".

The mapping is `ADMIN_EVENT_PERMISSION` in `types.ts`, and call sites never pass
a permission — `emitToAdmins` reads it from the event type.

| Event                         | Raised by                         | Audience | Permission           |
| ----------------------------- | --------------------------------- | -------- | -------------------- |
| `order.placed`                | `orders/repo.insertOrder`         | admin    | `ORDER_READ`         |
| `order.link_disputed`         | `order-disputes/service.create`   | admin    | `ORDER_DISPUTE_READ` |
| `contract.signed`             | `contracts/service.sign`          | admin    | `CONTRACT_READ`      |
| `contract.unsigned_blocking`  | sweep, T+48h                      | admin    | `CONTRACT_READ`      |
| `rental.ending_soon`          | sweep, T−3                        | admin    | `RENTAL_READ`        |
| `order.status_changed`        | `orders/repo.applyTransition`     | customer | —                    |
| `order.upcoming`              | sweep, T−2 from the rental start  | customer | —                    |
| `rental.ending_soon`          | sweep, T−7 / T−3 / T−1            | customer | —                    |
| `rental.renewed`              | `rentals/service.renew`           | customer | —                    |
| `contract.awaiting_signature` | `contracts/service.issueContract` | customer | —                    |
| `contract.signed`             | `contracts/service.sign`          | customer | —                    |

Three events reach **both** audiences from one cause, and two of those write
both rows in one transaction: signing a contract tells the operator the order is
unblocked and tells the customer their copy is filed. `rental.ending_soon` is
the third, and it is the reason the sweep computes days-left in the SELECT
rather than the WHERE — one row decides both notices, so "three days left"
cannot come to mean two different things.

An order with no `customer_account_id` writes nothing: there is nobody to
address, and `notifications_recipient_check` refuses the row. That is the normal
state for a guest order or one taken over the phone, and those customers are
reached by the emailed order link instead.

A customer's feed carries no permission dimension at all. Their access is
always "their own rows", which `repo.Recipient` scopes every read and every
write to — a customer cannot even mark an operator's row read.

The feed route itself carries **no** permission code, like `/profile`. What an
operator hears about was decided when the row was written; a grant at read time
could only ever disagree with that.

## What the operator sees

Two entry points, one state. The **bell** in the topbar owns the live connection
— the operator is almost never on the inbox screen, and the point of a live feed
is that it reaches them while they are looking at something else. Its dropdown
shows the newest ten and a link into the inbox.

The **inbox** at `/notifications` is a category rail plus one panel. The rail's
buckets are derived from the event's own name (`order.placed` is an order), so a
new event joins a bucket by being named — there is no second mapping to keep in
step. Badges count **unread**, not total: the rail exists to say where the work
is, and a total keeps shouting long after the work is done.

Three rules the UI follows, each of which was wrong once:

- **The dropdown is never filtered.** A bell that obeyed a category chosen on
  another screen would hide the arrival it exists to announce. The store keeps
  two lists for this reason — `latest` (unfiltered) and `items` (the rail's).
- **The bell's count is global.** `meta.unread` is across every category whatever
  the filter, so filtering to Contracts cannot hide the badge telling you an
  order needs attention.
- **One row component.** `NotificationRow` renders in both places, with a
  `compact` flag rather than a second copy. Two copies is how a dropdown ends up
  disagreeing with the list it summarises.

Clicking a row marks it read and opens what it is about. An operator who has
opened the order has read the notice about it; asking them to tick it off as
well is busywork.

> **Not to be confused with Settings → General.** That page holds the alert-EMAIL
> recipients. Both used to be called "Notifications" and sat one above the other
> in the sidebar, which read as one feature with two pages. Who gets email is a
> setting; what the back office is telling you is an inbox.

## What the customer sees

One destination in the account island's navigation, carrying the unread count,
and one screen at `/area-clienti/notifiche/` — declared in all four languages by
`routePaths`, so the German customer's URL is `/de/kundenbereich/benachrichtigungen/`.

No category rail, unlike the back office. An operator filters because they are
reading everybody's events; a customer has their own orders and a handful of
rows, and a filter would be three controls in front of a list you can see the
end of.

The island opens the stream, not the screen. The count sits in the navigation on
all four screens, so a stream that only ran while the notifications screen was
showing would be a live feed you had to already be looking at.

**The sentence is never stored.** A row carries a type and a payload; the
wording comes from `@mia/i18n`, resolved on the server for the request's
language and shipped in the account copy blob as templates with their
`{placeholder}` slots still standing. The island fills them with the same
`fill()` the order screens use. So a notice written during an Italian checkout
reads in German the moment the customer switches language — including the
status word and the date format.

That last part is what `lib/notification-copy.ts` exists for, and it is worth
stating because getting it wrong is invisible to `tsc`:

```
row.data    { field: 'status', from: 'pending', to: 'cancelled' }
template    "Il tuo ordine {orderNumber} è ora {to}."

without     Il tuo ordine MIA-2026-001011 è ora cancelled.      ← the payload
            Il noleggio termina il 2026-09-17.                    showing through

with        Il tuo ordine MIA-2026-001011 è ora Annullato.
            Il noleggio termina il 17 set 2026.
```

The mapping is stated **per event type**, never per field name: `from` and `to`
are order statuses in `order.status_changed` and calendar dates in
`rental.renewed`. A name-keyed table would format one of them wrongly and say
nothing about it. `order` and `payment` are likewise two label maps rather than
one, because the two enums share members — `paid` is in both — so a merged map
would render a plausible word about the wrong thing.

## Why `customer-routes.ts` is a near-copy of `admin-routes.ts`

They agree today by coincidence, not by contract. The operator feed has a
category rail and a permission model deciding which events reach whom; the
customer feed answers to somebody who owns every row it can see. A shared
parameterised router would make the next divergence — a preference check, a
different page size — arrive as a conditional inside one function, which is
where a feed starts showing one audience the other's rows.

What IS shared is everything underneath. `repo.ts` and `hub.ts` are
recipient-generic and needed no change at all to serve a second audience.

## The sweep, and why `dedupe_key` is the whole design

"The rental ends in three days" is not an event — it becomes true while the
process sits idle. `sweep.ts` runs at boot then hourly, `unref`'d, and every row
it writes carries a `dedupe_key`:

```text
rental.ending_soon:admin:<orderId>:3d:<adminUserId>
contract.unsigned_blocking:<contractId>:<adminUserId>
```

`ON CONFLICT DO NOTHING` against the partial unique index makes a restart, an
overlapping tick and a second API worker all converge on one row. No watermark,
no advisory lock, no decision about which box runs the cron.

> ⚠️ The `ON CONFLICT` clause **must** repeat the index predicate —
> `where: sql\`dedupe_key IS NOT NULL\``. Postgres cannot infer a partial unique
> index without it and raises _"no unique or exclusion constraint matching the
> ON CONFLICT specification"_ at runtime, on the first sweep tick.

The base key is suffixed with each recipient's id inside `emitToAdmins`, because
the index is global: one base key across five operators would let the first
insert win and silently drop the other four.

Both sweep queries cast their parameters (`${days}::int`). A bare placeholder
arrives as `unknown`, and `date + unknown` is ambiguous — Postgres refuses the
query rather than guessing.

## Scaling out is free

Under pm2 cluster mode every worker calls `hub.start()` independently and
Postgres delivers each notification to all of them. No sticky routing (sessions
are in the database), no cross-process bus, no code change. This is verifiable in
one line: emit from any process and a stream held open by another receives the
frame.

The ceiling is roughly 5,000 `NOTIFY`/sec — around 600 orders per second — where
`NotifyQueueLock` starts to matter. Past that, `hub.ts` swaps to Redis pub/sub or
NATS and nothing else changes, because the table is already the truth. At 10,000
concurrent visitors and a few orders a second we are three orders of magnitude
below it; the capacity arithmetic is in the plan.

## Applying the migration

`0014_add_notifications` is purely additive — one type, one table, three indexes,
three foreign keys. It reads no existing row and drops nothing, so there is no
backfill to get wrong.

It is re-runnable at two independent levels, and it needs both.

**The ledger.** `pnpm -w run db:migrate` records what it has applied in
`drizzle.__drizzle_migrations` and wraps **the whole pending batch in one
transaction**. A failure anywhere rolls back every statement _and_ the ledger
rows, so a failed run leaves nothing behind. This covers the normal path and
nothing else.

**The SQL.** The file is hand-edited from drizzle-kit's output so that every
statement is a no-op when its object already exists — a guarded `CREATE TYPE`
and `ADD CONSTRAINT` (PostgreSQL has no `IF NOT EXISTS` for either),
`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`. This covers every
_other_ way DDL reaches a database: applied by hand with psql, replayed onto a
`drizzle-kit push`ed dev database, or re-run after a restore that captured some
objects and not others.

`IF NOT EXISTS` on its own would be worse than nothing, because it cannot tell
_"this already exists, correctly"_ from _"something of this name exists, shaped
differently"_ — and skips both in silence. So the migration's last statement is
an assertion that re-reads the catalog and raises unless the table that ended up
there is the one the file describes: all ten columns, the recipient CHECK, and a
`notifications_dedupe_key` that is both UNIQUE and partial. **Re-running on a
correct database is quiet; re-running onto a divergent one is loud**, names what
is wrong, and — because the batch is one transaction — records nothing.

Verified by applying the file to an emptied schema and then twice more: four
indexes, three foreign keys, no duplicates. And by four divergence probes, each
of which failed with a message naming the fault — including a table missing only
`read_at`, which no other statement in the file would have noticed.

Two things worth knowing before you touch the journal:

- **The skip test is a timestamp comparison, not a hash lookup.** drizzle runs a
  migration only when its journal `when` is greater than the newest `created_at`
  in the ledger. A migration back-dated below an already-applied one is silently
  skipped forever — no error, no output. Editing an applied migration's SQL is
  therefore harmless to drizzle, but reordering the journal is not.
- **A `drizzle-kit push`ed database is now recoverable rather than stuck.** It
  has the objects but no ledger row; `migrate` used to abort on
  `relation "notifications" already exists` and take the whole batch with it.
  With the guards it passes through, provided the pushed shape actually matches —
  and refuses with a specific error if it does not.

## Operational notes

- The SSE route sets `X-Accel-Buffering: no`, so nginx's `proxy_buffering` needs
  no change. The 25-second heartbeat settles `proxy_read_timeout` (60s default)
  and Cloudflare's ~100s idle limit. Both are properties of the response, so dev
  and prod behave identically.
- The heartbeat is **one** `setInterval` walking the map, not `stream.sleep()`
  per connection. At ten thousand streams the per-connection version is ten
  thousand pending timers to save a single timer.
- A tab hidden for five minutes closes its stream and reopens on focus, at the
  cost of one snapshot fetch. Most "concurrent" connections in any real
  deployment are abandoned tabs.
- `hub.start()` returns an `unlisten`, called on SIGINT/SIGTERM. The listener
  holds a connection **outside** the pool, and a process that exits without
  releasing it leaves the backend idle until Postgres times it out.
- Before the customer feed opens to a holiday peak: `worker_connections 16384`,
  `worker_rlimit_nofile 65535`, `LimitNOFILE=65535` on the API process,
  `net.ipv4.ip_local_port_range`, `net.core.somaxconn`. All fail as a silent
  stall with nothing in any log naming the cause. The full list is in the plan.

## What this deliberately does not do

No web push and no service worker — a closed tab gets email or nothing. No
grouping or digest; an order that moves three times produces three rows, and
collapsing them is a read-side change with no migration. No retention sweep yet.
No retries and no dead-letter: the table is the record, so there is nothing to
retry. No delivery receipt — `read_at` records that a row was opened, not that a
human read it.
