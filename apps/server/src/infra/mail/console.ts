import type { MailMessage, MailSender } from './port.ts';

/**
 * Development transport: prints the message instead of sending it.
 *
 * This exists so the account flows are testable at all. Activation, magic-link
 * sign-in and the "I did not place this order" report each hinge on clicking a
 * one-shot URL that is only ever delivered by email; with no transport there is
 * no way to obtain one locally, and with a silent transport the flow looks broken
 * for reasons the log does not explain.
 *
 * The plain-text body is what gets printed — the links are readable in it, which
 * the HTML body's markup would bury.
 */
export class ConsoleMailSender implements MailSender {
  async send(message: MailMessage): Promise<void> {
    const lines = [
      '',
      '┌─ mail (console transport — nothing was sent) ─────────────────────────',
      `│ to:      ${message.to.join(', ')}`,
      `│ subject: ${message.subject}`,
      '├───────────────────────────────────────────────────────────────────────',
      ...message.text.split('\n').map((line) => `│ ${line}`),
      '└───────────────────────────────────────────────────────────────────────',
      '',
    ];

    console.log(lines.join('\n'));
  }
}
