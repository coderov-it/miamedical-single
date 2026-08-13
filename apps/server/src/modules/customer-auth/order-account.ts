import type { Database } from '@mia/db';

import type { SessionCustomer } from '../../shared/http/context.ts';
import * as repo from './repo.ts';
import * as service from './service.ts';

/**
 * Turning a checkout into an account, and deciding how much that link is worth.
 *
 * Called by `modules/orders/service.place`. It lives in customer-auth rather than
 * in orders because everything it decides is an identity question, and it is kept
 * in its own file so the dependency runs one way only: orders → customer-auth, with
 * customer-auth knowing nothing about orders.
 *
 * A worked walk of both branches is in docs/code/customer-accounts.md.
 */

/**
 * Which of the three order emails to send, decided here but MINTED LATER.
 *
 * The plan deliberately carries no token. An activation link has to reference the
 * order it arrived with — clicking it is how that order's link gets confirmed — and
 * this runs before the order is inserted, so there is no id yet to bind to. Tokens
 * are issued in `modules/orders/service.ts` once the row exists.
 */
export type MailPlan =
  | 'newAccount'
  | 'activateReminder'
  | 'confirmation'
  /** An unactivated account that was already mailed minutes ago. */
  | 'none';

export interface ResolvedOrderAccount {
  customerAccountId: string;
  customerLinkStatus: 'unverified' | 'confirmed';
  /** Address the mail goes to — the account's, which is the verified one. */
  email: string;
  firstName: string;
  lastName: string;
  mailPlan: MailPlan;
}

export interface OrderCustomerInput {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

/**
 * Resolves the account an order belongs to.
 *
 * Signed in → their account, `confirmed`, because a session is proof and nothing
 * further needs vouching for. The email typed into the form is still snapshotted
 * onto the order as that order's contact detail; it is not treated as an identity
 * claim, and no second account is created from it.
 *
 * Not signed in → find or create by email and mark the link `unverified`. Checkout
 * takes whatever address it is given, so a match is a claim until the person who
 * owns the inbox says otherwise.
 */
export async function resolveForOrder(
  db: Database,
  customer: OrderCustomerInput,
  session: SessionCustomer | null,
  ipAddress: string | null,
): Promise<ResolvedOrderAccount> {
  if (session) {
    return {
      customerAccountId: session.id,
      customerLinkStatus: 'confirmed',
      email: session.email,
      firstName: session.firstName,
      lastName: session.lastName,
      mailPlan: 'confirmation',
    };
  }

  const existing = await repo.findByEmail(db, customer.email);

  const account =
    existing ??
    (await repo.createOrGetByEmail(db, {
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
    }));

  const isBrandNew = existing === undefined;

  const mailPlan = await planMail(db, account.id, {
    isBrandNew,
    isActivated: account.activatedAt !== null,
  });

  return {
    customerAccountId: account.id,
    customerLinkStatus: 'unverified',
    // The account's own name and address, not the form's: on a repeat order the
    // profile is what the account holder chose, and the checkout fields may not
    // even have been filled in by them.
    email: account.email,
    firstName: account.firstName,
    lastName: account.lastName,
    mailPlan,
  };
}

async function planMail(
  db: Database,
  customerAccountId: string,
  input: { isBrandNew: boolean; isActivated: boolean },
): Promise<MailPlan> {
  if (input.isActivated) return 'confirmation';

  /*
    Unactivated. Sending another activation link is the right move — except when
    one is still sitting fresh in their inbox, which is what three orders in an
    afternoon would otherwise produce. In that case the order is still recorded
    and still linked; only the duplicate email is skipped.
  */
  if (!input.isBrandNew && (await service.hasFreshActivationToken(db, customerAccountId))) {
    return 'none';
  }

  return input.isBrandNew ? 'newAccount' : 'activateReminder';
}

/**
 * The two one-shot tokens an order email carries, both bound to the order.
 *
 * Issued after the order row exists, which is the whole reason this is separate
 * from `resolveForOrder`: the activation link must reference the order it arrived
 * with, so that clicking it confirms that order's account link in the same step.
 * Asking the customer to confirm on the next screen, having just proved themselves
 * by following the link, would be asking twice.
 */
export async function issueOrderMailTokens(
  db: Database,
  input: {
    customerAccountId: string;
    orderId: string;
    ipAddress: string | null;
    withActivation: boolean;
  },
): Promise<{ activationToken: string | null; reportToken: string }> {
  const report = await service.issueAuthToken(db, {
    customerAccountId: input.customerAccountId,
    purpose: 'order_report',
    orderId: input.orderId,
    ipAddress: input.ipAddress,
  });

  if (!input.withActivation) return { activationToken: null, reportToken: report.token };

  const activation = await service.issueAuthToken(db, {
    customerAccountId: input.customerAccountId,
    purpose: 'activation',
    orderId: input.orderId,
    ipAddress: input.ipAddress,
  });

  return { activationToken: activation.token, reportToken: report.token };
}
