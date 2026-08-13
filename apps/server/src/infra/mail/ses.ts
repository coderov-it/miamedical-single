import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

import { env } from '../../config/env.ts';
import type { MailMessage, MailSender } from './port.ts';

/**
 * Amazon SES v2.
 *
 * Construction is lazy so the server boots without credentials — only the first
 * send fails, with a message that says what to configure. Same shape as
 * `R2FileUploader`.
 *
 * The two access keys are optional on purpose. Supplied, they are used; omitted,
 * the SDK falls back on its default credential chain, so an EC2 instance role or
 * a shared profile works without any secret in the environment.
 */
export class SesMailSender implements MailSender {
  private client: SESv2Client | undefined;
  private from: string | undefined;

  private ses(): { client: SESv2Client; from: string } {
    if (!this.client || !this.from) {
      const {
        AWS_SES_REGION,
        AWS_SES_ACCESS_KEY_ID,
        AWS_SES_SECRET_ACCESS_KEY,
        MAIL_FROM_ADDRESS,
      } = env;

      if (!AWS_SES_REGION || !MAIL_FROM_ADDRESS) {
        throw new Error('Mail is not configured. Set AWS_SES_REGION and MAIL_FROM_ADDRESS.');
      }

      this.client = new SESv2Client({
        region: AWS_SES_REGION,
        // Both or neither: half a key pair is a misconfiguration, and silently
        // falling through to the default chain would hide it.
        ...(AWS_SES_ACCESS_KEY_ID && AWS_SES_SECRET_ACCESS_KEY
          ? {
              credentials: {
                accessKeyId: AWS_SES_ACCESS_KEY_ID,
                secretAccessKey: AWS_SES_SECRET_ACCESS_KEY,
              },
            }
          : {}),
      });
      this.from = MAIL_FROM_ADDRESS;
    }

    return { client: this.client, from: this.from };
  }

  async send(message: MailMessage): Promise<void> {
    const { client, from } = this.ses();

    await client.send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: message.to },
        /* No ReplyToAddresses: see the note in port.ts. Replies to the no-reply
           From address are expected to bounce. */
        Content: {
          Simple: {
            Subject: { Data: message.subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: message.html, Charset: 'UTF-8' },
              Text: { Data: message.text, Charset: 'UTF-8' },
            },
          },
        },
      }),
    );
  }
}
