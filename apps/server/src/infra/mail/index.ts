import { type Env, env } from '../../config/env.ts';
import { CloudflareMailSender } from './cloudflare.ts';
import { ConsoleMailSender } from './console.ts';
import { PlunkMailSender } from './plunk.ts';
import type { MailSender } from './port.ts';
import { SesMailSender } from './ses.ts';

/**
 * The one place a transport is chosen. Feature code imports `mailSender` and
 * never learns which one it got.
 *
 * Exactly one provider is live per environment, and there is no fallback from one
 * to the other on failure. A send that fails throws and the caller decides —
 * order placement logs it and keeps the order. Retrying a failed magic link
 * through a second provider would risk two copies of a single-use link when the
 * first provider had in fact accepted the message and only the reply was lost.
 *
 * A `Record` over the union rather than a ternary or a switch: adding a transport
 * to `MAIL_TRANSPORT` without wiring it here is then a type error, not a runtime
 * surprise. `config/env.ts` refuses to boot production on the console transport,
 * so this cannot quietly become a no-op in front of real customers.
 */
const TRANSPORTS: Record<Env['MAIL_TRANSPORT'], () => MailSender> = {
  cloudflare: () => new CloudflareMailSender(),
  console: () => new ConsoleMailSender(),
  plunk: () => new PlunkMailSender(),
  ses: () => new SesMailSender(),
};

export const mailSender: MailSender = TRANSPORTS[env.MAIL_TRANSPORT]();

export type { MailMessage, MailSender } from './port.ts';
