# Notifications and mail

How email leaves this system, and who decides whether a failure to send matters.

Before this there was no mail at all — `infra/mail/` was listed as pending and the
order confirmation panel deliberately never claimed an email had been sent.

## The layers, and what each one is not allowed to decide

```text
packages/templates/       what a message SAYS      (Italian; the audience reads it)

apps/server/src/
  infra/mail/port.ts      MailSender — the interface feature code depends on
  infra/mail/ses.ts       AWS SES v2
  infra/mail/console.ts   prints to the log, sends nothing
  infra/mail/index.ts     picks one, once

  modules/notifications/
    links.ts              where it POINTS          (absolute URLs)
    service.ts            whether a failure MATTERS
```

A transport never knows what an email is for. `@mia/templates` never knows how mail
travels. Only `service.ts` decides what happens when a send fails — and that is the
one interesting decision in the whole subsystem.

## Failure policy

Two helpers, and which one a path uses is a judgement about what is already recorded.

**`sendQuietly` — logs and swallows.** Used by order mail and dispute alerts. An
order is a recorded fact the moment its transaction commits; letting an SES outage
propagate would turn a delivery problem into a lost order. The customer already has
their number on screen. Same for a dispute: the report is stored and visible in the
admin panel before the alert is attempted, and a thrown error would invite a
re-submit against a token that is now spent.

**`sendOrThrow` — propagates.** Used by magic links and password resets. The route is
about to tell somebody "check your inbox", which is a lie if the send failed, and
there is nothing recorded that they lose by being asked to try again.

Order mail is also sent **after** the transaction commits, never inside it.

## Transports

`MAIL_TRANSPORT=console` prints the message — including the activation and magic
links — to stdout. This is not a stub for convenience: those links are only ever
delivered by email, so without it there is no way to obtain one locally and every
account flow is untestable. The plain-text body is what gets printed, because the
links are readable in it and the HTML body's markup would bury them.

`config/env.ts` **refuses to boot production** on the console transport, and requires
`MAIL_FROM_ADDRESS`. A link nobody receives is a silent failure with no error
anywhere to show it, so it fails loudly at startup instead.

The SES group is optional as a group, following `infra/storage/r2.ts`: the server
starts without credentials and `SesMailSender` fails on first send, naming what is
missing. The two access keys are optional even then — omit both and the SDK uses its
default credential chain, so an EC2 instance role works with no secret in the
environment. Supplying only one is treated as a misconfiguration rather than
silently falling through.

## The messages

| Template                      | When                                     | Carries                   |
| ----------------------------- | ---------------------------------------- | ------------------------- |
| `orderPlacedNewAccount`       | first order from an unknown address      | activation + report link  |
| `orderPlacedActivateReminder` | order from a known but unclaimed account | activation + report link  |
| `orderPlacedConfirmation`     | order from an activated account          | orders link + report link |
| `magicLink`                   | passwordless sign-in requested           | one 15-minute link        |
| `passwordReset`               | reset requested                          | one 60-minute link        |
| `adminDisputeAlert`           | a customer disowns an order              | link into the admin panel |

All three order emails carry the "Non hai effettuato tu questo ordine?" link, not
just the one for a new account. An already-activated account is exactly the case
where somebody else ordering under that address matters most.

Copy is Italian because it is content a customer reads. `adminDisputeAlert` is the
one exception and is English: its audience is the operations team.

## Where the markup lives: `@mia/templates`

Templates are a workspace package, not a folder inside the server, because the server
is not the only thing that needs a rendered message: a preview page can import them and
show exactly what an inbox will get, with no transport and no database. The package has
**no dependencies** and imports nothing from any app — adding one would decide, for
every consumer, what a template costs to render.

```text
packages/templates/src/
  brand.ts                          name, tagline, and the palette as hex
  contact.ts                        WhatsApp + free-phone number (see below)
  literal/email/
    order-placed-new-account.ts     one file per message, top level
    order-placed-activate-reminder.ts
    order-placed-confirmation.ts
    magic-link.ts
    password-reset.ts
    admin-dispute-alert.ts
    samples.ts                      every message against fixture data, for previews
    component/                      everything reused
      header.ts footer.ts contact-footer.ts
      paragraph.ts subheading.ts button.ts report-link.ts
      escape.ts order.ts text.ts message.ts audience.ts
```

`literal/` names the technique, so a second one can land beside it without moving these
files — a PDF built by a real layout engine would not belong in `literal/`.

A message is a template literal with pieces spliced into it, so the file reads as the
markup it produces:

```ts
html: `${header({ heading: subject, audience: 'customer' })}
${paragraph({ text: greeting(input.recipient) })}
${subheading({ text: ORDER_SECTION })}
${paragraph({ text: line })}
${button({ href: input.activationUrl, label: 'Attiva il tuo account' })}
${reportLink({ reportUrl: input.reportUrl })}
${footer({ audience: 'customer' })}`;
```

`header()` opens the tags `footer()` closes — including the `<!--[if mso]>` wrapper,
which is why the two closing sequences are not mirror images. They are a split pair
rather than one function taking the body precisely so a message reads top to bottom.

Section labels are consts in the message file (`ORDER_SECTION` above) because the same
words go into the HTML `<h2>` and the plain-text body, and two copies would drift.

### Layout rules the clients force on us

- **The card is `width="100%"` with `max-width:560px`, wrapped in an Outlook ghost table
  pinned to 560.** A fixed 560 was the original and it was wrong: on a 375px phone it
  overflows, which is a horizontal scrollbar in a browser and a zoomed-out, unreadable
  message in a phone client. But Word — which renders Outlook mail — ignores `max-width`
  outright, so without the `<!--[if mso]>` table the message would run full-bleed across
  a maximised Outlook. Each half fixes what the other cannot.
- **Headings are real `<h1>`/`<h2>`**, one `<h1>` per message. These used to be a subject
  followed by an undifferentiated run of paragraphs, which gives a reader skimming on a
  phone nothing to aim at and a screen reader no outline.
- **The action button is a `<td width="200">`, not `min-width` on the link.** A cell's
  width is a floor in HTML, so a longer label still grows the button; Word honours the
  attribute and ignores `min-width`; and `min-width` on the link would have added the
  padding on top of the 200, making every button 248px wide.
- **The footer is centred, the body copy is not.** Centring marks the block as closing
  matter, so the eye stops at the last paragraph rather than reading on into boilerplate.
- **The footer's two contact buttons are one per row, never side by side.** They were two
  `<td>`s in one `<tr>`, and that broke every message on a phone: cells in a single row
  cannot wrap, and a table grows to fit content that will not wrap, so the pair's ~400px
  dragged the whole card past a 375px screen and clipped the body paragraphs too. A media
  query would fix it only for clients that honour one. One cell per row cannot overflow at
  any width. `verify` asserts at most one `white-space:nowrap` element per table row.
- **Colours are inline hex from `COLORS` in `brand.ts`**, mirroring the site's tokens in
  `apps/website/src/styles/app.css`. Email clients strip `<style>` and do not resolve CSS
  custom properties, so a colour is an inline literal or it is nothing. The one deliberate
  divergence: the site's primary CTA is `--color-accent` (#3846b1); in email it is black.
- **The brand is set in type, not the logo file.** `logo.svg` cannot be used — SVG is
  stripped by Gmail, Outlook and Apple Mail — and even a PNG is blocked by default in
  Outlook desktop until the reader asks for images. A wordmark always renders.

### Escaping

**Every piece escapes its own props.** `paragraph({ text })` escapes `text`,
`button({ href, label })` escapes both. So a message file interpolates piece return
values and never calls `escapeHtml` itself, and there is no way to interpolate raw data
into markup without going through a piece that escapes it.

The values that make this matter are a customer's own first name and the free text of a
dispute, which is the only customer-written prose any message prints. Both are covered
by a test asserting that `<script>` and `"><b>` in a name come out as entities.

### Why template literals and not a template engine

Measured on the real order email — 20k renders × 5 runs, median, node 26, all three
producing byte-identical output:

| renderer                   | per email | throughput |
| -------------------------- | --------- | ---------- |
| template literals (this)   | 1.7 µs    | ~580k/s    |
| eta 4.6.0 (sync)           | 11.5 µs   | ~87k/s     |
| edge.js 6.5.1 (renderSync) | 13.5 µs   | ~74k/s     |

The engines cost 7× the time, a dependency, and untyped template variables — a renamed
field renders `href=""` into a sent activation email instead of failing `pnpm check`.
An earlier version of this code used an auto-escaping tagged template returning a
`RawHtml` wrapper; it measured the same 1.7 µs, so the plain literals won on being one
concept smaller. Prettier also leaves an untagged literal alone, which keeps the markup
exactly as written instead of reflowing it.

⚠️ The most expensive thing in rendering an email turned out not to be markup at all:
`new Intl.NumberFormat` per render put a whole message at **39 µs**. `component/order.ts`
caches the formatter per currency, which is what takes it under 2 µs. Do not construct
an `Intl` formatter inside a template.

AMP was considered and declined — see below.

## Nobody replies to us

`MAIL_FROM_ADDRESS` is a no-reply mailbox and is meant to read as one
(`no-reply@…`). **No `Reply-To` header is ever sent** — `MailMessage` has no
`replyTo` field and `ses.ts` sets no `ReplyToAddresses`. SES here is outbound only:
there are no receipt rules, so a reply has nowhere to land and bounces.

That is a deliberate choice and it creates an obligation, which is what
`component/contact-footer.ts` discharges. Every customer template ends with the notice that
the address does not accept replies, then a **WhatsApp** button and the free-phone
number. A customer who replies and hears nothing reasonably concludes they contacted
us and were ignored, so the message has to say up front that replying is not the
route, and name the routes that are.

`footer()` takes a required `audience` argument rather than defaulting it, so adding a
template forces a decision about the footer. `adminDisputeAlert` passes `'internal'`
and gets none: its readers have the admin panel.

Contact details live in `packages/templates/src/contact.ts`. It is still duplicated in
`CONTACT` in `apps/website/src/lib/site.ts`, but unlike `links.ts` — which duplicates
`routes.ts` because the server cannot import from the website app — that copy no longer
_has_ to exist: both apps can import this package. Delete the website's copy the next
time that file is touched.

### Why not AMP for Email

Asked and declined. These messages exist to carry a one-time link; the interactive
parts — confirming an order, rejecting a link, filing a dispute — are real pages that
work in every client and can do more than an AMP part could. AMP would add a third
MIME body (`text/x-amp-html`, which rules out SES's `Simple` content and means
hand-assembling raw MIME), a per-domain registration with Google, and a validator in
CI, while every non-supporting inbox falls back to the HTML anyway. The effort belongs
in making that one HTML body robust instead.

## Previewing a message

`EMAIL_SAMPLES` renders all six against fixture data:

```ts
import { EMAIL_SAMPLES } from '@mia/templates';

for (const sample of EMAIL_SAMPLES) {
  const { subject, html, text } = sample.render();
}
```

The fixtures live next to the templates and are type-checked against them, so renaming
a prop fails `pnpm check` instead of leaving a stale preview. `sample.name` is the
export name rather than a label, so the file to edit is obvious from what you are
looking at.

### The gallery

With `pnpm dev` running, **<http://localhost:8787/email-preview>**.

| Route                       | Serves                                             |
| --------------------------- | -------------------------------------------------- |
| `/email-preview`            | the first message, with the list of all six        |
| `/email-preview/:name`      | one message, in the chrome                         |
| `/email-preview/:name/html` | the HTML body alone — paste this into a real inbox |
| `/email-preview/:name/text` | the plain-text body alone                          |

The message is loaded in an `<iframe>`, not inlined, so it cannot inherit the
surrounding page's styles and show you something no inbox will render — the frame
fetches the same bytes SES sends. Width buttons (375 / 600 / full) restyle the frame
without re-fetching, and the text body sits in a `<details>` below.

⚠️ **Mounted only when `NODE_ENV !== 'production'`**, on its own rather than in the
typed `.route()` chain in `app.ts`: it serves HTML to a human rather than JSON to the
RPC client, needs neither CORS, CSRF nor a session, and a production API should not
answer requests for a gallery. `apps/server/src/modules/email-preview/` defines no
fixtures of its own — it renders `EMAIL_SAMPLES`, because a second set of fixtures
would drift from the templates, and drift is what a preview exists to catch.

## Recipients

`adminDisputeAlert` goes to whatever is in `platform_settings.notificationRecipients`,
edited at **Settings → Notifications** in the admin. Deduplicated and lowercased on
save (`EmailSchema` lowercases, so two rows differing only in case would otherwise
both mail the same person), capped at ten.

An empty list is a configuration state, not an error: the service logs a warning and
skips the send, because the dispute is already stored and visible. The settings page
says so, rather than leaving an operator wondering whether saving nothing broke
something.

`platform_settings` is a key→jsonb bag rather than a wide row, so the next setting
costs an INSERT instead of a migration. Every read parses the value through the key's
schema rather than casting it — a hand-edited row must degrade to the default, not
reach a caller as a shape it does not expect.

## Links

`links.ts` builds absolute URLs from `PUBLIC_SITE_URL`, and one from
`PUBLIC_ADMIN_URL` for the internal alert.

⚠️ The paths in that file mirror `apps/website/src/lib/routes.ts`, which is the
source of truth for public URLs. The server cannot import from the website app, so
they are written twice and there is no check binding them. Change one and you must
change the other. The full list is in
[customer-accounts.md](./customer-accounts.md#route-paths-are-duplicated-on-purpose).

Query keys are English (`?token=`) even on Italian paths: the path is content, the
query string is a machine wire format.

## Testing it locally

```bash
MAIL_TRANSPORT=console pnpm dev
```

Place an order, then read the boxed block in the server log. It contains both links.
Paste the `attiva-account` one into a browser to activate; paste the
`segnala-ordine` one to file a dispute.

To exercise SES for real, set `MAIL_TRANSPORT=ses` with a verified sending domain and
confirm the links resolve against `PUBLIC_SITE_URL` rather than localhost.

## Known gaps

- **No bounce or complaint handling.** SES will report both; nothing consumes them,
  so a permanently bouncing address keeps being mailed.
- **No retry.** A failed send is logged and gone. For order mail that is deliberate;
  for a magic link the customer simply requests another.
- **New orders do not alert the operator.** The recipients setting is generic and
  ready for it — deliberately out of scope for this change.
- **No send log.** Whether a given customer was actually emailed is only answerable
  from application logs, not from the database.
