# Push notifications

The third channel. `notifications-live.md` covers the feed and the SSE hub;
`notifications-and-mail.md` covers email. This is the one that reaches a phone
that is locked and an app that is closed.

The integration contract handed to the mobile developer is
[docs/handover/mobile-push-integration.md](../handover/mobile-push-integration.md).
Keep the two in step: that file is the API's public description.

## The shape, in one worked example

An operator moves order `MIA-2026-001042` from `pending` to `paid`.

```text
1  orders/repo.applyTransition  ── BEGIN ──────────────────────────────────┐
2       INSERT INTO notifications (audience='customer', type=              │
3               'order.status_changed', data={orderNumber, field,          │
4               from:'pending', to:'paid'})                                │
5       SELECT pg_notify('mia_notification', …)      ← queued, not sent    │
6  ──────────────────────────────────────────────────────── COMMIT ────────┘
7
8  hub.deliver(envelope)
9    ├─ audience === 'customer' → push/dispatch.dispatch(db, id)   ← fire and forget
10   └─ streams.get('customer:<id>') → SSE frame, as before
11
12 push/dispatch.dispatch
13   ├─ UPDATE notifications SET pushed_at = now()
14   │    WHERE id = $1 AND pushed_at IS NULL RETURNING …    ← one winner, always
15   ├─ repo.settingsFor   → { language, preferences }
16   ├─ mayPush('order.status_changed', preferences)   → false? stop.
17   ├─ repo.devicesFor    → [{ token, platform, language, appVersion }]
18   └─ per device:
19        buildAlert → appVersion >= LOCALIZED_STRINGS_SINCE
20                      ? { titleKey, bodyKey, bodyArgs: ['MIA-2026-001042'] }
21                      : { title, body }  rendered in the reader's language
22        pushSender.send → FCM → APNs for iOS
23        result.deadToken → DELETE the device row
```

Line 14 is the design. Everything else follows from it.

## The three rules

**The row is the record, the push is a doorbell.** Nothing is ever reconstructed
from what arrived on a phone. A dropped push costs a delay; the feed still has
the row and `docs/handover` tells the app never to infer state from a
notification.

**No translated prose crosses the wire.** The payload carries a key and an
ordered list of arguments; the OS resolves the key against the app's own string
resources. This is the same rule the feed already keeps — a row stores a type and
a payload, never a sentence — extended one layer out to the lock screen.

**An argument is printed verbatim.** So an argument may only ever be an order
number, a contract number or a proper noun. Anything translatable is folded into
the key instead, which is why the keys are per-status and per-threshold.

## Why `pushed_at` and not a queue

`LISTEN` has no backlog: a notification committed while the dispatcher was
restarting reached nobody and raised no error anywhere. The feed survives that
because the next screen load re-reads the table. **A closed app has no next screen
load**, so without a marker the push is lost outright.

`pushed_at` makes the table its own outbox and buys three things at once:

- **A retry.** `push/sweep.ts` picks up anything still `NULL` inside
  `RETRY_WINDOW_HOURS`, every minute.
- **A delivery record.** "Was this customer actually pinged" is now a query, which
  the mail side still lists as a known gap.
- **Concurrency safety, free.** The claim is one conditional `UPDATE`; Postgres
  takes a row lock for its duration, so of two workers racing, exactly one matches
  `pushed_at IS NULL`. No advisory lock, no leader election, no decision about
  which process runs the dispatcher.

> The mark is written **before** the send, not after. A crash between the two
> therefore drops a push rather than repeating one. That is the right way round: a
> missed notification is invisible, a duplicate lock-screen alert is the kind of
> thing people uninstall an app over.

Rows older than the window are marked by `expireStale` rather than left pending —
an alert about yesterday is worse than no alert, and leaving them would make the
sweep rescan the same stale backlog forever.

## The two gates

A notification reaches a phone only when both say yes, and keeping them apart is
deliberate.

| Gate                         | Owner                                          | Where                                        |
| ---------------------------- | ---------------------------------------------- | -------------------------------------------- |
| `PUSH_BY_DEFAULT[type]`      | us — is this worth a lock screen at all?       | `@mia/validators/push-preferences`           |
| `preferences[category].push` | the customer — may this category interrupt me? | `customer_accounts.notification_preferences` |

Collapsing them into one stored flag per event would mean a customer's stored
answer deciding something they were never asked, and would freeze today's
editorial judgement into every row written before we changed our minds.

The preference bag holds **deviations only**. `{}` is correct for every account
that has never opened the screen — which is all of them — and a category added
later is live for everyone on the day it ships, with no backfill.

The toggles **mute, they never promote**: `mayPush` checks `PUSH_BY_DEFAULT`
first, so a stored `true` cannot resurrect an event we later judged too noisy.

## Localization, and the `appVersion` gate

The wording is in `strings.xml` and `Localizable.strings`, generated from
`@mia/i18n` by `pnpm --filter @mia/i18n run generate:native` into
`packages/i18n/generated/` (gitignored here, committed in the app repo).

Keys encode everything translatable:

```text
order_status_changed_status_paid        a status is a closed set → into the key
order_status_changed_payment_status_paid   both enums have `paid`; keys keep them apart
rental_ending_soon_3d                   the sweep fires at 7/3/1 → no plural rule needed
order_upcoming_2d                       fires at T−2 only
contract_awaiting_signature             no variants
```

Sixteen keys today, from four pushable events.

⚠️ **A key the installed app does not define renders as the raw key on iOS.** That
is the single failure mode of this approach, and `LOCALIZED_STRINGS_SINCE` in
`modules/push/message.ts` is the guard: devices below it get a server-rendered
sentence instead. **Bump it in the same commit that adds a key**, to the app
version that will carry it.

`atLeastVersion` treats anything unparseable as _older_ — `1.0.0-rc1`, a build
name, a hash. The bias is deliberate: guessing "new" sends keys to a build that
may not have them; guessing "old" costs only a rendered sentence.

> `Number.parseInt` is the trap, and it shipped once in review: it stops at the
> first non-digit, so `'1.0.0-rc1'.split('.')` parses as `[1, 0, 0]` and a release
> candidate compares equal to the release. Every segment is now matched against
> `/^\d+$/`.

Status labels are recased for mid-sentence use — `In attesa` → `in attesa`,
`Bezahlt` → `bezahlt` — through the language's own casing rules, because the enum
catalogs are written for standalone display.

## Why sign-in is required, and what it costs

A `push_devices` row names an account, and the only proof of which account a
handset belongs to is a session. A token bound to an order number or a typed email
would let anyone who learned an order number subscribe to it.

Guest checkouts still get an account row — `resolveForOrder` finds or creates one
by email and marks the link `unverified` — so **notification rows are written for
guests today and waiting for them**. What a guest loses is the real-time push, not
the history: activating and signing in opens a feed that already has everything.

That makes activation, not push, the lever on reach. The full walk is in the
handover doc, §3.

## Files

| File                                                                 | What it owns                                                      |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/validators/src/push-preferences.ts`                        | The two gates. Pure, so `@mia/db` types the jsonb column from it. |
| `packages/validators/src/push.ts`                                    | Registration and preference wire schemas.                         |
| `packages/i18n/src/push-strings.ts`                                  | The keys, the copy, and `pushStringKey`.                          |
| `packages/i18n/scripts/generate-native-strings.ts`                   | `strings.xml` + `Localizable.strings`.                            |
| `packages/db/src/schema/push-devices.ts`                             | The table. Token unique across it, not per customer.              |
| `apps/server/src/infra/push/port.ts`                                 | `PushSender`, `PushAlert`, `PushResult`.                          |
| `apps/server/src/infra/push/fcm.ts`                                  | FCM HTTP v1, and the service-account JWT.                         |
| `apps/server/src/infra/push/console.ts`                              | Prints the message. The only way to test without Firebase.        |
| `apps/server/script/push-test.ts`                                    | One message by hand, printing FCM's own answer.                   |
| `apps/server/src/modules/push/dispatch.ts`                           | The claim, the fan-out, dead-token pruning.                       |
| `apps/server/src/modules/push/message.ts`                            | Key or sentence, the args, the tap route.                         |
| `apps/server/src/modules/push/language.ts`                           | The resolution ladder, written once.                              |
| `apps/server/src/modules/push/routes.ts`                             | Device register/unregister, preference read/write.                |
| `apps/server/src/modules/push/sweep.ts`                              | The one-minute retry tick.                                        |
| `apps/website/src/components/account/NotificationPreferences.svelte` | The three toggles.                                                |

## Setting up Firebase

Nothing here is code. It is done once, in two consoles, and it produces exactly
three environment variables for us and two files for the app repository.

```text
1  Firebase console → Add project           name it, Analytics off (we use none)
2  Project settings → General → Your apps
     Add app → Android    package name must MATCH the app's applicationId
                          → downloads google-services.json  ──→ app developer
     Add app → iOS        bundle ID must MATCH the app's
                          → downloads GoogleService-Info.plist ──→ app developer
3  Project settings → Cloud Messaging → Apple app configuration
     Upload the APNs .p8 auth key          ← iOS only, and the Apple Developer
       + its Key ID and your Team ID         account is the prerequisite
4  Project settings → Service accounts → Generate new private key
     → downloads ONE json. These three fields are ours:
         project_id     ──→ FCM_PROJECT_ID
         client_email   ──→ FCM_CLIENT_EMAIL
         private_key    ──→ FCM_PRIVATE_KEY   (keep its literal \n escapes)
5  Set PUSH_TRANSPORT=fcm and restart. Boot prints:  push  fcm
```

Step 3 is the only one that touches Apple, and it is why iOS has no credentials
in our environment: Firebase holds the APNs key and relays for us.

The service-account JSON in step 4 is a **secret with send rights on the whole
project**. It goes in `.env` on the server and nowhere near the app repository —
the app gets the two files from step 2, which are not secrets and are meant to be
committed.

> ⚠️ **Steps 2 and 4 are different downloads and are confused constantly.**
> `google-services.json` identifies the _app_ to Firebase and is useless to a
> server. The service-account key authenticates _us_ and must never ship inside a
> binary, where anyone can extract it.

### Checking it works

```sh
# 1. No Firebase needed — proves everything except the network call.
PUSH_TRANSPORT=console pnpm dev
#    place an order, move it to `paid` in the back office, read the log:
#    ┌─ push ──────────────────────────────
#    │ alert  order_status_changed_status_paid_title / …_body ["MIA-2026-001042"]

# 2. With credentials set, the boot line is the first check.
#    push  fcm                                   ← configured
#    push  fcm — FCM_PRIVATE_KEY unset, every send will fail
#    push  console — printed to this log, no device is notified
```

A real send needs a registered device, so it cannot be tested end to end before a
client exists — the app, or the browser page described below. Everything up to
Google can be tested by hand with neither:

```sh
# 3. One message, no app involved.
pnpm --filter @mia/server run push:test -- --token=<fcm-token> --dry-run
#    ↳ Google validates the credentials and the shape of the payload, sends
#      nothing, and returns validate_only's own answer.

# 4. The same, for real.
pnpm --filter @mia/server run push:test -- --token=<fcm-token>
```

`--token` must come from a real client. Leaving it off mints a throwaway token,
which FCM can reject with `INVALID_ARGUMENT` even with `--dry-run`; that rejection
is not evidence of broken credentials. `--type`, `--app-version`, `--language` and `--platform` shape the
message (`--app-version=1.0.0` chooses localised keys over rendered text);
`--register=<customer-account-id>` additionally writes the token into
`push_devices` so the real dispatcher reaches that device within a minute.

#### Where a test token comes from

A token belongs to one **client instance of the same Firebase project**: nothing
server-side mints one, the console's "Send test message" only consumes a token
you already have, and a token from a different project is answered with
`SENDER_ID_MISMATCH`. A test therefore needs one throwaway client, and the
cheapest is a web page running `firebase-messaging` on `localhost` — a real
token, from a web app config and a VAPID key found under the same project.

That page is two files, and it lives in the gitignored `.scratch/fcm-probe/`
rather than in the source tree: it is a local test client, not part of the
product, and the web push it performs is deliberately unbuilt (see Known gaps).
Serve it with `python3 -m http.server` — `file://` cannot register a service
worker — and it prints both validation and delivery commands once it has a token.
Getting a token does not send anything. Run the second command, without
`--dry-run`, to deliver a message. The probe logs foreground messages and displays
them through its service worker; background data messages are displayed by the
worker itself. Reload the page after editing the probe and get the token again.

Both values it needs come from the same project, under Project settings →
General: the web app config from **Your apps** → Web (add one if the project has
none), and the public VAPID key from the **Cloud Messaging** tab → **Web
configuration** → **Web Push certificates** → Generate Key Pair. The four
config values are already in both files for the web app `mia-dev-probe`, read
from the Management API rather than copied by hand, so only `vapidKey` is left
to fill — and no API exposes it, the console is the only source. The key is
passed to `getToken()`; leaving it out does not raise — the SDK falls back to a
fixed Google default that the browser then subscribes with instead of the
project's own key pair, and the token that comes back is one our send cannot
reach. Change the key and the existing subscription survives it (the browser
reuses what it has), so testing a second key needs the site's storage cleared.

What that proves needs stating, because `buildPayload` puts the text in the
platform blocks. `data` — `notificationId`, `type`, `route` — travels to every
platform, so a service worker that shows a notification from it does
demonstrate the credentials, a live token and delivery. The title, the body and
the localisation keys do not travel with it: they live in `android.notification`
and `apns`, which only a native build reads. Seeing those means running
`firebase/quickstart-android` in an emulator with `google-services.json`.

Either way, use the real token with `--dry-run` first to validate without delivery,
then run without that flag. For `INVALID_ARGUMENT`, read Google's error message:
an invalid registration token and a malformed payload can both produce this code.
Android and APNs blocks configure their respective platforms; they do not supply
the browser's notification text.

Unlike `ConsolePushSender`, which prints the intent, the script prints the exact
POST body — the one place where the Android keys (`title_loc_key`) and the APNs
keys (`title-loc-key`) are spelled out — and then FCM's verbatim answer:

```text
ok                        accepted. With --dry-run it stops here; without it,
                          Google is handing the message to the device now.
UNREGISTERED              the app was uninstalled, or the OS retired the token.
INVALID_ARGUMENT          the request itself is wrong, or the token was never
                          valid — every `data` value must be a string.
THIRD_PARTY_AUTH_ERROR    APNs refused it: the iOS key from step 3 is missing.
```

The script carries a meaning for each code it knows and prints Google's own
sentence verbatim for the ones it does not; `--dry-run` is the same request with
`validate_only` set, which is the mode that says whether our side is right.

The first failure on a fresh project is usually the private key: a PEM whose `\n`
were expanded to real newlines by a shell or a secrets manager fails to parse,
and the script reports it as `OAuth token mint failed`.

## Configuration

```sh
PUSH_TRANSPORT=console      # or fcm
FCM_PROJECT_ID=…
FCM_CLIENT_EMAIL=…
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n…"
```

All three FCM variables are optional as a group, following `R2FileUploader`: the
server starts without them and the adapter fails on first send naming what is
missing. `logFeatureSummary()` reports the state at boot, which matters more here
than elsewhere because there is **no production guard** refusing the console
transport — unlike mail, where a console transport locks every customer out.

`FCM_PRIVATE_KEY` is a PEM block; a `.env` cannot hold real newlines, so literal
`\n` escapes are converted in `fcm.ts`.

## Known gaps

- **No signing link from a push.** `contract.awaiting_signature` is the most
  valuable notification we have and it cannot open the thing it is about: the page
  needs a one-time token that only travels by email. `GET
/api/customer/contracts/{number}/signing-link` closes it and is not built.
- **No delivery receipt.** FCM accepting a message is not a phone showing it.
  `pushed_at` records that we sent.
- **No web push.** A different transport (VAPID and a service worker), for desktop
  browsers. Separate plan.
- **No quiet hours and no grouping.** Both read-side policy, neither needs a
  migration.
