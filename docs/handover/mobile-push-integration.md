# Push notifications — integration guide for the mobile app

**Audience:** the Capacitor app developer, and any LLM assisting them.
**Status of the backend:** built and merged. Every endpoint below exists.
**What this document is:** the complete contract, plus the reasoning behind each
decision, so that a change on either side can be judged rather than guessed at.

You do not need access to the backend repository to implement this. Everything
the app needs is here.

---

## 1. The one-paragraph version

The server already stores every notification a customer receives and serves them
as a feed. Push is a **doorbell for that feed**, not a second source of truth.
The app registers its FCM token against the signed-in customer, the server sends
a message when something happens, the customer taps it, and the app opens the
path the message carries. The wording of the notification comes from **string
resources compiled into your app**, not from the payload.

---

## 2. What you must build

In rough order of dependency.

| #   | Task                                                                            | Notes                                                                       |
| --- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | Add `@capacitor/push-notifications`                                             | Or `@capacitor-firebase/messaging` if you prefer — the server does not care |
| 2   | `requestPermissions()` then `register()`                                        | Android 13+ needs this too, it is no longer iOS-only                        |
| 3   | `POST /api/customer/push/devices` on every launch and on every token refresh    | See §4                                                                      |
| 4   | `DELETE /api/customer/push/devices` **before** clearing the session on sign-out | See §4                                                                      |
| 5   | Drop in the generated string resources                                          | See §6 — without these, notifications arrive blank or as raw keys           |
| 6   | Tap handler: read `data.route`, navigate there, mark `data.notificationId` read | See §7                                                                      |
| 7   | (Optional) a notifications screen and a settings screen                         | Endpoints in §8 and §9                                                      |

---

## 3. Authentication — read this first

**Everything is session-cookie based.** The cookie is `mia_customer_session`,
HttpOnly, set by `POST /api/customer/auth/login`. There is no bearer token and no
API key.

You have confirmed the app already signs customers in, so this works. It is
called out because it has one consequence that shapes the whole feature:

> **Push requires a signed-in account. There is no way around this.**

A device row must name a customer account, and the only proof of which account a
handset belongs to is a session. Binding a token to anything weaker — an order
number, an email typed at checkout — would let anyone who learned an order number
subscribe to that order's notifications.

### What this means for guest orders

Your site lets people order without an account, so this matters. The good news is
that guests lose less than it looks:

```text
1  anna@example.com checks out — not signed in
2    the server creates a customer_accounts row anyway, link 'unverified'
3    the order carries customer_account_id                  ← she has an identity
4
5  an operator moves the order to 'paid'
6    a notification row is written against her account      ← recorded
7    push? no device registered for that account → nothing  ← the only loss
8
9  Anna opens the activation link in her order email and signs in
10   the feed opens with step 6 and everything since, already there
11   the app registers her device → every later event reaches her lock screen
```

A guest loses their **real-time** notifications and none of their history.

**This makes activation the highest-leverage screen in the app.** If most orders
are placed by guests and nothing asks them to set a password, push will reach
very few people. The app has just taken a guest checkout — it knows the order
number and the email, with the customer still holding the phone. That is a far
better moment to ask than an inbox visited hours later. Scheduling that screen is
your call; its impact on this feature is large.

---

## 4. Device registration

### `POST /api/customer/push/devices`

Call on **every app launch** after permission is granted, and again on every
`registration` / token-refresh callback. It upserts, so repeated calls are correct
and cheap. Never cache a token and assume it is stable — the OS reissues them on
reinstall, on restore, and on its own schedule.

```jsonc
// Request
{
  "token": "fxK9…", // the FCM registration token
  "platform": "ios", // "ios" | "android"
  "language": "de", // optional; the device locale, two-letter
  "appVersion": "1.4.0", // REQUIRED — see the warning below
}
// → 204 No Content
```

> ⚠️ **`appVersion` is load-bearing, not telemetry.** The server uses it to decide
> whether this device is sent a localization key or a pre-rendered sentence. Send
> a wrong or stale value and a customer reads
> `order_status_changed_paid_body` on their lock screen.
>
> It must be **dot-separated digits only** — `1.4.0`, `2.10`, `3`. Anything else
> (`1.4.0-rc1`, `nightly`, a commit hash) is deliberately treated as _older than
> everything_, which is safe: the customer gets a server-rendered sentence
> instead. It never crashes, it just silently stops using your string resources.

`language` is only used for that fallback sentence. When localization keys are in
play the OS picks the language itself and this field is never read.

### `DELETE /api/customer/push/devices`

```jsonc
// Request
{ "token": "fxK9…" }
// → 204 No Content
```

**Call this before you clear the session, not after.** Once the cookie is gone the
request is unauthenticated and the row survives — and a surviving row keeps
delivering the previous customer's order updates to a handset that now belongs to
somebody else. This is the most likely privacy bug in the whole integration.

204 is returned whether or not a row was deleted. A token that is not this
customer's, or already gone, is the normal shape of sign-out after a reinstall —
not an error.

---

## 5. What a push actually looks like

```jsonc
{
  "message": {
    "token": "fxK9…",
    "data": {
      "notificationId": "8f3c…",
      "type": "order.status_changed",
      "route": "/area-clienti/ordini/MIA-2026-001042/",
    },
    "android": {
      "priority": "high",
      "notification": {
        "title_loc_key": "order_status_changed_status_paid_title",
        "body_loc_key": "order_status_changed_status_paid_body",
        "body_loc_args": ["MIA-2026-001042"],
      },
    },
    "apns": {
      "headers": { "apns-priority": "10" },
      "payload": {
        "aps": {
          "sound": "default",
          "alert": {
            "title-loc-key": "order_status_changed_status_paid_title",
            "loc-key": "order_status_changed_status_paid_body",
            "loc-args": ["MIA-2026-001042"],
          },
        },
      },
    },
  },
}
```

Note there is **no top-level `notification` block** and no Italian anywhere. The
wording lives in your app.

For a device whose `appVersion` is below the threshold, the server sends a plain
`notification` block with `title` and `body` already rendered, in the language
from `push_devices.language` → the account's language → Italian. You do not have
to handle these differently; they are ordinary notifications.

---

## 6. The string resources — the part that breaks if skipped

Because the OS draws the notification while your app is closed, **no JavaScript
runs**. The keys are resolved against native resources, not your i18n bundle.

We generate those files. Ask for the output of:

```sh
pnpm --filter @mia/i18n run generate:native
```

which produces, for all four languages (it, en, fr, de):

```text
android/values/strings.xml        ← Italian, the source language, bare `values/`
android/values-en/strings.xml
android/values-fr/strings.xml
android/values-de/strings.xml
ios/it.lproj/Localizable.strings  ← iOS uses a .lproj for every language
ios/en.lproj/Localizable.strings
ios/fr.lproj/Localizable.strings
ios/de.lproj/Localizable.strings
```

Sample content:

```xml
<string name="order_status_changed_status_paid_title">Aggiornamento ordine</string>
<string name="order_status_changed_status_paid_body">Il tuo ordine %1$s è ora pagato.</string>
<string name="rental_ending_soon_3d_body">Il noleggio dell’ordine %1$s termina tra tre giorni.</string>
```

```objc
"order_status_changed_status_paid_body" = "Il tuo ordine %1$@ è ora pagato.";
```

**Rules:**

1. **Commit them to your repo and never hand-edit them.** They are generated. An
   edit is lost on the next regeneration, and the copy is reviewed on our side.
2. **Merge, do not replace,** if you already have `strings.xml` — these are
   additional keys, not a whole file.
3. **When we add keys, we tell you the app version that must carry them.** Ship
   it, then tell us the version so we can raise the threshold. Until then those
   events fall back to server-rendered sentences — which is correct, not broken.

### Why the key encodes the status and the day count

`order_status_changed_status_paid`, not `order_status_changed` with `paid` as an
argument. Two reasons, and they are the same reason:

- `loc_args` are **printed verbatim**. The OS does not translate them. A status
  passed as an argument would appear in one language inside a sentence rendered in
  another.
- There is **no formatter**. A count cannot pick a plural form, and a date cannot
  be formatted. So `rental_ending_soon_3d` says "in three days" in words, and
  there is no `%d giorni` to get wrong for `1`.

Consequently **every argument is an order number or a contract number** — the only
things that are identical in every language.

---

## 7. Handling a tap

```ts
PushNotifications.addListener('pushNotificationActionPerformed', async ({ notification }) => {
  const { route, notificationId } = notification.data as Record<string, string>;

  if (notificationId) {
    // Fire and forget; a failure here must not block navigation.
    void fetch(`${API}/api/customer/notifications/read`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: [notificationId] }),
    });
  }

  if (route) router.navigate(route);
});
```

`route` is a **path**, deliberately, not a screen name. It means a new event type
added on the server needs no change in your app — you follow whatever you are
given. Paths you can currently receive:

| `data.type`                   | `data.route`                           |
| ----------------------------- | -------------------------------------- |
| `order.status_changed`        | `/area-clienti/ordini/{orderNumber}/`  |
| `order.upcoming`              | `/area-clienti/ordini/{orderNumber}/`  |
| `rental.ending_soon`          | `/area-clienti/ordini/{orderNumber}/`  |
| `contract.awaiting_signature` | `/area-clienti/notifiche/` — see below |

> **Signing a contract from a push is not yet possible end to end.** The signing
> page needs a one-time `?token=` that only travels by email, and a stored
> notification is not where a signing secret belongs. So that tap lands on the
> feed. The endpoint that closes this —
> `GET /api/customer/contracts/{number}/signing-link` — is **not built yet**. Ask
> for it when you get to that screen.

Paths are Italian because they are real public URLs on the storefront and an SEO
commitment. Do not translate them.

---

## 8. The notification feed

The same rows, for an in-app screen. **The feed is the record; push is a hint.**
Never reconstruct state from notifications you happened to receive — always read
this endpoint.

### `GET /api/customer/notifications?page=1&perPage=20`

```jsonc
{
  "data": [{
    "id": "8f3c…",
    "type": "order.status_changed",
    "data": { "orderNumber": "MIA-2026-001010", "field": "status", "from": "pending", "to": "paid" },
    "orderId": "1b2e…",
    "readAt": null,
    "createdAt": "2026-09-16T05:12:44.019Z"
  }],
  "meta": {
    "page": 1, "perPage": 20, "total": 14,
    "unread": 3,                       // GLOBAL — this is your badge number
    "counts": { "all": {"total":14,"unread":3}, "order": {…}, "rental": {…}, "contract": {…} }
  }
}
```

Optional query params: `category` (`order` | `rental` | `contract`) and
`unread=true`.

> **A row never contains a sentence.** It carries a `type` and a payload of ids,
> codes, counts and dates. You render the wording from your own i18n bundle, keyed
> on `type`. This is why one stored row can be read in four languages and why a
> copy fix reaches rows written last year.
>
> In-app you use **the language the customer picked in the app**. On the lock
> screen the OS uses **the device language**. These can differ, and that is
> intended — a glance notification belongs to the device owner in their device's
> language. If you want them to agree, have your language picker set the native
> per-app locale (Android 13+ `AppCompatDelegate.setApplicationLocales`) rather
> than only a JavaScript setting; on iOS the per-app language lives in system
> Settings and an in-app picker does not move it.

### `GET /api/customer/notifications/stream`

Server-sent events, for a screen that is open. Requires `withCredentials`.

| Event          | Meaning                                               |
| -------------- | ----------------------------------------------------- |
| `ready`        | Connected. Fetch the snapshot now.                    |
| `notification` | One row, same shape as `data[]` above. Prepend it.    |
| `resync`       | Something may have been missed. Re-read the snapshot. |
| `ping`         | Heartbeat every 25s. Ignore.                          |

Every frame is safe to lose. A dropped connection is a re-read, never a lost
notification.

### `POST /api/customer/notifications/read` · `POST …/read-all`

```jsonc
{ "ids": ["8f3c…"] } // up to 200; read-all takes no body
// → { "data": { "marked": 1, "unread": 2, "counts": { … } } }
```

**Use the `unread` you get back — never decrement locally.** Local arithmetic is
how a badge ends up disagreeing with the list beneath it.

---

## 9. Notification settings

Three toggles: Orders, Rentals, Contracts. Push only.

### `GET /api/customer/notification-preferences`

```jsonc
{ "data": { "order": { "push": true }, "rental": { "push": true }, "contract": { "push": true } } }
```

This is the **effective** state, defaults already applied. Render it directly.
Do not implement a default of your own — ours and yours would drift.

### `PUT /api/customer/notification-preferences`

```jsonc
{ "order": { "push": false } } // partial; unnamed categories untouched
// → the full effective object, same shape as GET
```

Notes:

- **The toggles mute, they do not promote.** Some events are never pushed (a
  contract _you just signed_, a rental _you just renewed_) because they confirm
  something the customer did seconds earlier. Turning a category on does not
  enable those.
- **The feed always records everything**, whatever the toggles say. They govern
  the lock screen only.
- **The OS permission is the real off switch.** This screen is for tuning. Do not
  build a second consent flow in front of it.

---

## 10. Decisions already made, and why

Useful context if you or your LLM are weighing a change.

| Decision                                       | Reasoning                                                                                                                                                             |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FCM HTTP v1 for both platforms**             | Firebase relays to APNs, so one transport and one code path. The legacy FCM endpoint is decommissioned.                                                               |
| **Localization keys, not rendered text**       | No translated prose crosses the wire, and the language is the phone's own — correct the moment someone changes their device language, with nothing stored or guessed. |
| **`appVersion` gate with a rendered fallback** | Lets a new event type ship server-side the same day instead of waiting on an App Store release. The fallback goes quiet one release cycle later.                      |
| **Data-only messages rejected**                | iOS throttles and drops `content-available` at Apple's discretion, so customers would silently miss notifications. This is the one shape we will not ship.            |
| **`route` is a path, not a screen name**       | A screen-name vocabulary is a second contract across two repos, and the one that drifts is always the one nobody can deploy quickly.                                  |
| **Push requires sign-in**                      | A device row must name an account; nothing weaker than a session proves which. See §3.                                                                                |
| **Status and day count live in the key**       | `loc_args` are printed verbatim and there is no formatter. See §6.                                                                                                    |
| **Feed is the record, push is a hint**         | A dropped push costs a delay, never a notification. Nothing is ever reconstructed from what arrived.                                                                  |

---

## 11. Testing without Firebase

The backend runs with `PUSH_TRANSPORT=console`, which prints the exact message —
including the localization keys — to the server log instead of sending it. Ask
for a dev server run with that set, place an order, move it to `paid` in the back
office, and read the log. That verifies registration, preferences, the key
selection and the arg list without a Firebase project or a signed build.

For a real device you need, on your side: `google-services.json` (Android), and
for iOS an APNs `.p8` key uploaded to the Firebase project, the Push
Notifications capability, and a physical device — the simulator has no APNs.

---

## 12. Questions to send back

1. What is the app's version string format, exactly as you will send it? We need
   dot-separated digits; tell us if that is a problem.
2. Which version will first carry the generated string resources? We set the
   threshold to that.
3. Does your language picker set the native per-app locale, or only a JS setting?
   It decides whether the lock screen and the in-app feed agree.
4. Are you building the post-checkout activation prompt (§3)? It largely
   determines how many people this feature reaches.
