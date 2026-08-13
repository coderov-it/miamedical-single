import { env } from '../../config/env.ts';
import { ConsoleMailSender } from './console.ts';
import type { MailSender } from './port.ts';
import { SesMailSender } from './ses.ts';

/**
 * The one place a transport is chosen. Feature code imports `mailSender` and
 * never learns which one it got — `config/env.ts` refuses to boot production on
 * the console transport, so this cannot quietly become a no-op in front of real
 * customers.
 */
export const mailSender: MailSender =
  env.MAIL_TRANSPORT === 'ses' ? new SesMailSender() : new ConsoleMailSender();

export type { MailMessage, MailSender } from './port.ts';
