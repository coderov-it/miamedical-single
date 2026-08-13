import type { Database } from '@mia/db';
import * as templates from '@mia/templates';

import { mailSender } from '../../infra/mail/index.ts';
import type { MailMessage } from '../../infra/mail/index.ts';
import { getNotificationRecipients } from '../settings/service.ts';
import * as links from './links.ts';

/**
 * Sending policy. Not a routed module — other modules call these.
 *
 * The division of labour: `@mia/templates` decides what a message says, `links.ts`
 * where it points, `infra/mail` how it travels, and this file whether a failure to
 * send is worth failing the caller over.
 *
 * For customer mail the answer is almost always no. An order is a recorded fact
 * the moment its transaction commits; losing it because SES was unreachable would
 * turn a delivery problem into a data problem. So the order and dispute paths call
 * `sendQuietly`, which logs and swallows.
 *
 * Authentication mail is the exception — see `sendOrThrow`.
 */

/**
 * Fire-and-forget. Awaited by callers so the request does not outlive the send,
 * but a rejection never propagates.
 */
async function sendQuietly(message: MailMessage, context: string): Promise<void> {
  try {
    await mailSender.send(message);
  } catch (error) {
    console.error(`[notifications] ${context} failed to send:`, error);
  }
}

/**
 * For mail the caller's response is a promise about. "Check your inbox" is a lie
 * if the send failed, and unlike an order there is nothing recorded that the
 * customer would lose by being told to try again.
 */
async function sendOrThrow(message: MailMessage): Promise<void> {
  await mailSender.send(message);
}

export interface OrderMailContext {
  email: string;
  firstName: string;
  lastName: string;
  order: templates.OrderRef;
  /** Single-use token bound to this order, for the "I did not order this" page. */
  reportToken: string;
}

/** A brand-new, unclaimed account: confirm the order and invite them to claim it. */
export function sendOrderPlacedNewAccount(
  input: OrderMailContext & { activationToken: string },
): Promise<void> {
  return sendQuietly(
    templates.orderPlacedNewAccount({
      to: input.email,
      recipient: { firstName: input.firstName, lastName: input.lastName },
      order: input.order,
      activationUrl: links.activationUrl(input.activationToken),
      reportUrl: links.reportOrderUrl(input.reportToken),
    }),
    `order ${input.order.number} (new account)`,
  );
}

/** Ordered before, still never activated. */
export function sendOrderPlacedActivateReminder(
  input: OrderMailContext & { activationToken: string },
): Promise<void> {
  return sendQuietly(
    templates.orderPlacedActivateReminder({
      to: input.email,
      recipient: { firstName: input.firstName, lastName: input.lastName },
      order: input.order,
      activationUrl: links.activationUrl(input.activationToken),
      reportUrl: links.reportOrderUrl(input.reportToken),
    }),
    `order ${input.order.number} (activation reminder)`,
  );
}

/** Account already theirs — a plain confirmation, still with the report link. */
export function sendOrderPlacedConfirmation(input: OrderMailContext): Promise<void> {
  return sendQuietly(
    templates.orderPlacedConfirmation({
      to: input.email,
      recipient: { firstName: input.firstName, lastName: input.lastName },
      order: input.order,
      ordersUrl: links.accountOrdersUrl(),
      reportUrl: links.reportOrderUrl(input.reportToken),
    }),
    `order ${input.order.number} (confirmation)`,
  );
}

export function sendMagicLink(input: { email: string; token: string }): Promise<void> {
  return sendOrThrow(
    templates.magicLink({ to: input.email, url: links.magicLinkUrl(input.token) }),
  );
}

export function sendPasswordReset(input: { email: string; token: string }): Promise<void> {
  return sendOrThrow(
    templates.passwordReset({ to: input.email, url: links.passwordResetUrl(input.token) }),
  );
}

/**
 * Alerts whoever the operator listed under Settings → Notifications. An empty list
 * is a configuration state, not an error: warn and move on, because the dispute
 * itself is already stored and visible in the admin panel.
 */
export async function sendDisputeAlert(
  db: Database,
  input: {
    disputeId: string;
    order: templates.OrderRef;
    orderEmail: string;
    reportedPhone: string;
    message: string;
  },
): Promise<void> {
  const { emails } = await getNotificationRecipients(db);

  if (emails.length === 0) {
    console.warn(
      `[notifications] dispute ${input.disputeId} raised but no notification recipients are configured; nothing emailed.`,
    );
    return;
  }

  await sendQuietly(
    templates.adminDisputeAlert({
      to: emails,
      order: input.order,
      orderEmail: input.orderEmail,
      reportedPhone: input.reportedPhone,
      message: input.message,
      adminUrl: links.adminDisputeUrl(input.disputeId),
    }),
    `dispute ${input.disputeId}`,
  );
}
