/** The one email an order sends at placement — see `placement.ts`. */

import type { Database } from '@mia/db';

import { type ResolvedOrderAccount, issueOrderMailTokens } from '../customer-auth/order-account.ts';
import * as notifications from '../notifications/mail.ts';

/**
 * The one email an order sends, in whichever of its three forms applies.
 *
 * Every form carries a fresh `order_report` token, so "I did not place this order"
 * is reachable from any of them — an already-activated account is exactly the case
 * where somebody else ordering under that address matters most.
 */
export async function sendPlacementMail(
  db: Database,
  input: {
    account: ResolvedOrderAccount;
    orderId: string;
    order: { number: string; total: string; currency: string };
    ipAddress: string | null;
  },
): Promise<void> {
  const { account, order } = input;
  if (account.mailPlan === 'none') return;

  const needsActivation =
    account.mailPlan === 'newAccount' || account.mailPlan === 'activateReminder';

  /*
    Both tokens reference this order. That is what lets the activation link double
    as the confirmation of the account link: following it proves the customer reads
    the inbox the order was placed under, which is exactly the claim `unverified`
    was recording.
  */
  const { activationToken, reportToken } = await issueOrderMailTokens(db, {
    customerAccountId: account.customerAccountId,
    orderId: input.orderId,
    ipAddress: input.ipAddress,
    withActivation: needsActivation,
  });

  const common = {
    email: account.email,
    firstName: account.firstName,
    lastName: account.lastName,
    order,
    reportToken,
  };
  // A failed send is written on this order's timeline (notifications/mail-failure.ts).
  const trail = { db, orderId: input.orderId };

  switch (account.mailPlan) {
    case 'newAccount':
      // `needsActivation` guarantees the token; the check keeps the type honest.
      if (activationToken) {
        await notifications.sendOrderPlacedNewAccount({ ...common, activationToken }, trail);
      }
      return;
    case 'activateReminder':
      if (activationToken) {
        await notifications.sendOrderPlacedActivateReminder({ ...common, activationToken }, trail);
      }
      return;
    case 'confirmation':
      await notifications.sendOrderPlacedConfirmation(common, trail);
      return;
  }
}
