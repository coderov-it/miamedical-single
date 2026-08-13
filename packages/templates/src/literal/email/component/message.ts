/**
 * What every message function in this folder returns.
 *
 * Deliberately identical in shape to `MailMessage` in the server's `infra/mail/port.ts`
 * and deliberately not imported from it: this package must stay free of the server, so
 * the website can import it to preview a message without pulling in a transport. The
 * two are structurally compatible, which is all a `send(...)` call needs.
 */
export interface EmailMessage {
  to: string[];
  subject: string;
  html: string;
  text: string;
}
