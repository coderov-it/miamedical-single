/**
 * Outbound email port. Feature code depends on `MailSender`; the concrete
 * transport (`PlunkMailSender`, `CloudflareMailSender`, `SesMailSender`,
 * `ConsoleMailSender`) is chosen once in ./index.ts and imported as a singleton.
 *
 * Never feature policy — what an email says, who receives it and when it is worth
 * sending are decisions for `modules/notifications`, not for a transport.
 */

export interface MailMessage {
  to: string[];
  subject: string;
  /**
   * Both bodies are always supplied: some clients render neither the other.
   *
   * What a transport does with `text` differs, and that is the transport's
   * business rather than the caller's. SES and Cloudflare ship it verbatim as the
   * alternative part, the console transport prints it because the links are
   * readable in it, and Plunk accepts only one body field and derives its own text
   * part from the HTML — so on that provider these bytes are not the ones sent.
   */
  html: string;
  text: string;
}

/*
  There is deliberately no `replyTo`. The From address is a no-reply mailbox that
  accepts nothing, and the customer-facing templates carry a WhatsApp button and the
  free-phone number instead — so a reply is never the route we ask anyone to take.
  Adding the header back would point replies at a mailbox somebody has to watch.
*/

export interface MailSender {
  /**
   * Rejects when the message could not be handed to the provider. Callers decide
   * whether that is fatal — order placement, for one, deliberately logs and
   * carries on rather than losing a recorded order to a mail outage.
   */
  send(message: MailMessage): Promise<void>;
}
