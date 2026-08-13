import { env } from '../../config/env.ts';
import { EXTERNAL_APIS } from '../../config/external-apis.ts';
import { type FromAddress, parseFromAddress } from './from-address.ts';
import type { MailMessage, MailSender } from './port.ts';

/**
 * Cloudflare Email Sending, over its REST API.
 *
 * The REST layer, deliberately, not the Workers `send_email` binding: this server
 * is a long-lived Node process on a host, so a binding is not available to it and
 * introducing a Worker purely to relay our own mail would add a hop that can fail
 * on its own. `fetch` and no SDK, for the same reason as Plunk — one POST.
 *
 * Construction is lazy, like every other adapter here: the server boots without
 * credentials and only the first send fails, naming what is missing.
 *
 * Of the three providers this is the only one whose payload matches our port
 * exactly — it takes `html` and `text` as separate fields, so the plain-text body
 * we generate is the one that ships, as it is on SES and unlike Plunk.
 *
 * Two things about it are worth knowing before reading the send below, and both are
 * documented in `docs/code/notifications-and-mail.md`:
 *
 * 1. Email Sending is in **beta** and sending to arbitrary recipients needs a
 *    Workers Paid plan. An account without the entitlement fails every send with
 *    `not_entitled` rather than at boot, which is why the production guard in
 *    `config/env.ts` cannot catch this one for you.
 * 2. A 200 with `success: true` does not mean delivered. The envelope splits
 *    recipients into `delivered`, `queued` and `permanent_bounces`, and a
 *    permanent bounce is a final refusal reported inside an otherwise happy
 *    response. See `assertDelivered`.
 */

const SEND_PATH = (accountId: string) => `/accounts/${accountId}/email/sending/send`;

/** As on Plunk: `fetch` has no default timeout and order placement awaits this. */
const TIMEOUT_MS = 10_000;

interface CloudflareError {
  code?: number;
  message?: string;
}

interface CloudflareResponse {
  success?: boolean;
  errors?: CloudflareError[];
  result?: {
    delivered?: string[];
    queued?: string[];
    permanent_bounces?: string[];
  } | null;
}

export class CloudflareMailSender implements MailSender {
  private config: { accountId: string; apiToken: string; from: FromAddress } | undefined;

  private cloudflare(): { accountId: string; apiToken: string; from: FromAddress } {
    if (!this.config) {
      const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_EMAIL_API_TOKEN, MAIL_FROM_ADDRESS } = env;

      if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_EMAIL_API_TOKEN || !MAIL_FROM_ADDRESS) {
        throw new Error(
          'Mail is not configured. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_EMAIL_API_TOKEN and MAIL_FROM_ADDRESS.',
        );
      }

      this.config = {
        accountId: CLOUDFLARE_ACCOUNT_ID,
        apiToken: CLOUDFLARE_EMAIL_API_TOKEN,
        from: parseFromAddress(MAIL_FROM_ADDRESS),
      };
    }

    return this.config;
  }

  async send(message: MailMessage): Promise<void> {
    const { accountId, apiToken, from } = this.cloudflare();

    const response = await fetch(`${EXTERNAL_APIS.cloudflareApiBaseUrl}${SEND_PATH(accountId)}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        to: message.to,
        /*
          The object form, because Cloudflare's field is `address` where Plunk's is
          `email` — and because the string form's handling of `Name <addr>` is not
          documented, while this is. The sender's domain must be onboarded for Email
          Sending on the account that owns the token.
        */
        from: { address: from.email, ...(from.name ? { name: from.name } : {}) },
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    /* Cloudflare's standard envelope carries its own success flag and an errors
       array, so the HTTP status is not on its own proof of anything. A body that
       will not parse counts as a refusal rather than a pass. */
    const payload = (await response.json().catch(() => null)) as CloudflareResponse | null;

    if (!response.ok || payload?.success !== true) {
      throw new Error(
        `Cloudflare refused the message (${describeFailure(response.status, payload)}).`,
      );
    }

    assertDelivered(message.to, payload);
  }
}

/**
 * A permanent bounce arrives inside a successful response, so nothing above this
 * point would notice it.
 *
 * Every recipient bouncing is a failed send and throws: for a magic link that is
 * exactly the case where the route must not go on to say "check your inbox". Some
 * recipients bouncing is not, because the message did reach the others — that is a
 * warning, and the addresses are named so a stale entry in the notification
 * recipients list can actually be found and fixed.
 *
 * `queued` counts as accepted. Cloudflare has taken responsibility for the message
 * at that point and retries on its own.
 */
function assertDelivered(recipients: string[], payload: CloudflareResponse): void {
  const bounced = payload.result?.permanent_bounces ?? [];
  if (bounced.length === 0) return;

  if (bounced.length >= recipients.length) {
    throw new Error(`Cloudflare permanently bounced every recipient: ${bounced.join(', ')}.`);
  }

  console.warn(`[mail] Cloudflare permanently bounced ${bounced.join(', ')}`);
}

/**
 * Everything Cloudflare told us about the refusal, and nothing else — the API token
 * is never part of this string, and neither is the message body.
 *
 * The codes are worth reading rather than glossing: `not_entitled` and
 * `sending_disabled` mean the account or zone was never set up for sending,
 * `bad_token_type` means the token is the wrong kind, and `forbidden` means it
 * lacks the Email Sending: Edit permission. All four are configuration, not
 * outages, and all four are reported here verbatim.
 */
function describeFailure(status: number, payload: CloudflareResponse | null): string {
  const errors = payload?.errors
    ?.map((error) => [error.code, error.message].filter(Boolean).join(' '))
    .filter(Boolean)
    .join('; ');

  return [`HTTP ${status}`, errors].filter(Boolean).join(' · ');
}
