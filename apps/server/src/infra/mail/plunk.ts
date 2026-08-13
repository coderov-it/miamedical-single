import { env } from '../../config/env.ts';
import { EXTERNAL_APIS } from '../../config/external-apis.ts';
import { type FromAddress, parseFromAddress } from './from-address.ts';
import type { MailMessage, MailSender } from './port.ts';

/**
 * Plunk, over its transactional endpoint.
 *
 * `fetch` and no SDK: the whole provider is one POST with three fields, so a
 * dependency would buy nothing and add a version to track. Construction is lazy
 * for the same reason as SES and R2 — the server boots without credentials and
 * only the first send fails, naming what is missing.
 *
 * Two of Plunk's traits are worth knowing before reading the body below; both are
 * the provider's, not ours, and neither can be configured away. See
 * `docs/code/notifications-and-mail.md`.
 *
 * 1. It takes ONE body field, and it is the HTML one. Our `message.text` is not
 *    sent; Plunk derives its own plain-text alternative from the markup. The text
 *    body still earns its place — it is what the console transport prints and what
 *    SES sends verbatim — but on this transport it is not the bytes that ship.
 * 2. It creates or updates a contact for every recipient, and that cannot be
 *    disabled. What we do control is `subscribed`, which we never send: the
 *    contact is therefore left unsubscribed, so nobody who merely placed an order
 *    can be swept into a marketing campaign on a consent they never gave.
 */

const SEND_PATH = '/v1/send';

/**
 * `fetch` has no default timeout, and order placement awaits this send inside the
 * try/catch that protects a recorded order. Without a ceiling a hung provider
 * would hold the checkout response open for as long as the socket lived.
 */
const TIMEOUT_MS = 10_000;

interface PlunkFailure {
  code?: string;
  message?: string;
  requestId?: string;
  errors?: { field?: string; message?: string }[];
}

interface PlunkResponse {
  success?: boolean;
  error?: PlunkFailure;
}

export class PlunkMailSender implements MailSender {
  private config: { apiKey: string; from: FromAddress } | undefined;

  private plunk(): { apiKey: string; from: FromAddress } {
    if (!this.config) {
      const { PLUNK_API_KEY, MAIL_FROM_ADDRESS } = env;

      if (!PLUNK_API_KEY || !MAIL_FROM_ADDRESS) {
        throw new Error('Mail is not configured. Set PLUNK_API_KEY and MAIL_FROM_ADDRESS.');
      }

      this.config = { apiKey: PLUNK_API_KEY, from: parseFromAddress(MAIL_FROM_ADDRESS) };
    }

    return this.config;
  }

  async send(message: MailMessage): Promise<void> {
    const { apiKey, from } = this.plunk();

    const response = await fetch(`${EXTERNAL_APIS.plunkBaseUrl}${SEND_PATH}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: message.to,
        /* Required, and the domain has to be verified in Plunk first, exactly as
           it does in SES. No `reply`: see the note in port.ts. */
        from,
        subject: message.subject,
        body: message.html,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    /* Plunk carries its own success flag, so an HTTP 200 is not on its own proof
       the message was accepted. Both are checked, and a body that will not parse
       counts as a refusal rather than a pass. */
    const payload = (await response.json().catch(() => null)) as PlunkResponse | null;

    if (!response.ok || payload?.success !== true) {
      throw new Error(`Plunk refused the message (${describeFailure(response.status, payload)}).`);
    }
  }
}

/**
 * Everything Plunk told us about the refusal, and nothing else — the API key is
 * never part of this string, and neither is the message body.
 */
function describeFailure(status: number, payload: PlunkResponse | null): string {
  const error = payload?.error;
  const fields = error?.errors
    ?.map((issue) => [issue.field, issue.message].filter(Boolean).join(': '))
    .filter(Boolean)
    .join('; ');

  return [`HTTP ${status}`, error?.code, error?.message, fields, error?.requestId]
    .filter(Boolean)
    .join(' · ');
}
