import type { Database } from '@mia/db';
import type { ContractLanguage, MagicLinkVariant } from '@mia/templates';
import * as templates from '@mia/templates';

import { mailSender } from '../../infra/mail/index.ts';
import type { MailMessage } from '../../infra/mail/index.ts';
import { getNotificationRecipients } from '../settings/service.ts';
import * as links from './links.ts';
import { errorText, recordMailFailure } from './mail-failure.ts';
import type { MailKind, MailResult, OrderTrail } from './mail-failure.ts';

export type { MailResult, OrderTrail } from './mail-failure.ts';

/**
 * Sending policy for EMAIL. Not a routed module — other modules call these.
 *
 * This file was `service.ts` until the in-app feed arrived. The module now means
 * "a thing somebody is told" rather than "a message we post", and mail is one of
 * its two channels — `write.ts` is the other. Nothing about the policy below
 * changed with the rename; the feed deliberately has the opposite one, and
 * `write.ts` says why.
 *
 * The division of labour: `@mia/templates` decides what a message says, `links.ts`
 * where it points, `infra/mail` how it travels, and this file whether a failure to
 * send is worth failing the caller over.
 *
 * For customer mail the answer is almost always no. An order is a recorded fact
 * the moment its transaction commits; losing it because SES was unreachable would
 * turn a delivery problem into a data problem. So the order and dispute paths call
 * `sendQuietly`, which logs and never throws — it returns a `MailResult`, and
 * with an order trail writes the failure on that order's timeline.
 *
 * Authentication mail is the exception — see `sendOrThrow`.
 */

/**
 * Never throws. Awaited by callers so the request does not outlive the send; the
 * result says whether it went, and with a `trail` a failure is also written on
 * that order's timeline (`mail-failure.ts`).
 */
async function sendQuietly(
  message: MailMessage,
  label: { kind: MailKind; context: string },
  trail?: OrderTrail,
): Promise<MailResult> {
  try {
    await mailSender.send(message);
    return { sent: true };
  } catch (error) {
    console.error(`[notifications] ${label.context} failed to send:`, error);
    const text = errorText(error);
    if (trail) {
      await recordMailFailure(trail, label.kind, {
        to: message.to,
        context: label.context,
        error: text,
      });
    }
    return { sent: false, error: text };
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
  trail?: OrderTrail,
): Promise<MailResult> {
  return sendQuietly(
    templates.orderPlacedNewAccount({
      to: input.email,
      recipient: { firstName: input.firstName, lastName: input.lastName },
      order: input.order,
      activationUrl: links.activationUrl(input.activationToken),
      reportUrl: links.reportOrderUrl(input.reportToken),
    }),
    { kind: 'order_placed_new_account', context: `order ${input.order.number} (new account)` },
    trail,
  );
}

/** Ordered before, still never activated. */
export function sendOrderPlacedActivateReminder(
  input: OrderMailContext & { activationToken: string },
  trail?: OrderTrail,
): Promise<MailResult> {
  return sendQuietly(
    templates.orderPlacedActivateReminder({
      to: input.email,
      recipient: { firstName: input.firstName, lastName: input.lastName },
      order: input.order,
      activationUrl: links.activationUrl(input.activationToken),
      reportUrl: links.reportOrderUrl(input.reportToken),
    }),
    {
      kind: 'order_placed_activate_reminder',
      context: `order ${input.order.number} (activation reminder)`,
    },
    trail,
  );
}

/** Account already theirs — a plain confirmation, still with the report link. */
export function sendOrderPlacedConfirmation(
  input: OrderMailContext,
  trail?: OrderTrail,
): Promise<MailResult> {
  return sendQuietly(
    templates.orderPlacedConfirmation({
      to: input.email,
      recipient: { firstName: input.firstName, lastName: input.lastName },
      order: input.order,
      ordersUrl: links.accountOrdersUrl(),
      reportUrl: links.reportOrderUrl(input.reportToken),
    }),
    { kind: 'order_placed_confirmation', context: `order ${input.order.number} (confirmation)` },
    trail,
  );
}

export function sendContractReady(
  input: {
    email: string;
    customerName: string;
    contractNumber: string;
    orderNumber: string | null;
    signingToken: string;
    language: ContractLanguage;
  },
  trail?: OrderTrail,
): Promise<MailResult> {
  return sendQuietly(
    templates.contractReady({
      to: input.email,
      customerName: input.customerName,
      contractNumber: input.contractNumber,
      orderNumber: input.orderNumber,
      signingUrl: links.contractSigningUrl(input.signingToken),
      language: input.language,
    }),
    { kind: 'contract_ready', context: `contract ${input.contractNumber} ready` },
    trail,
  );
}

export function sendContractSigned(
  input: {
    email: string;
    customerName: string;
    contractNumber: string;
    orderNumber: string | null;
    language: ContractLanguage;
  },
  trail?: OrderTrail,
): Promise<MailResult> {
  return sendQuietly(
    templates.contractSigned({
      to: input.email,
      customerName: input.customerName,
      contractNumber: input.contractNumber,
      orderNumber: input.orderNumber,
      language: input.language,
    }),
    { kind: 'contract_signed', context: `contract ${input.contractNumber} signed` },
    trail,
  );
}

export function sendMagicLink(input: {
  email: string;
  token: string;
  variant: MagicLinkVariant;
}): Promise<void> {
  return sendOrThrow(
    templates.magicLink({
      to: input.email,
      url: links.magicLinkUrl(input.token),
      variant: input.variant,
    }),
  );
}

export function sendPasswordReset(input: { email: string; token: string }): Promise<void> {
  return sendOrThrow(
    templates.passwordReset({ to: input.email, url: links.passwordResetUrl(input.token) }),
  );
}

/** Thrown on failure: the page is about to ask for a code that must have arrived. */
export function sendAccountDeletionCode(input: { email: string; code: string }): Promise<void> {
  return sendOrThrow(templates.accountDeletionCode({ to: input.email, code: input.code }));
}

export function sendRentalReminder(
  input: {
    email: string;
    customerName: string;
    orderNumber: string;
    productTitle: string;
    rentalEndDate: string;
    extendUrl?: string;
  },
  trail?: OrderTrail,
): Promise<MailResult> {
  return sendQuietly(
    templates.rentalReminder({
      to: input.email,
      customerName: input.customerName,
      orderNumber: input.orderNumber,
      productTitle: input.productTitle,
      rentalEndDate: input.rentalEndDate,
      ...(input.extendUrl ? { extendUrl: input.extendUrl } : {}),
    }),
    { kind: 'rental_reminder', context: `rental reminder for order ${input.orderNumber}` },
    trail,
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
    /** The disputed order — a failed alert is written on its timeline. */
    orderId: string;
    order: templates.OrderRef;
    orderEmail: string;
    reportedPhone: string;
    message: string;
  },
): Promise<MailResult> {
  const { emails } = await getNotificationRecipients(db);

  if (emails.length === 0) {
    console.warn(
      `[notifications] dispute ${input.disputeId} raised but no notification recipients are configured; nothing emailed.`,
    );
    return { sent: false, error: 'no notification recipients configured' };
  }

  return sendQuietly(
    templates.adminDisputeAlert({
      to: emails,
      order: input.order,
      orderEmail: input.orderEmail,
      reportedPhone: input.reportedPhone,
      message: input.message,
      adminUrl: links.adminDisputeUrl(input.disputeId),
    }),
    { kind: 'dispute_alert', context: `dispute ${input.disputeId}` },
    { db, orderId: input.orderId },
  );
}
