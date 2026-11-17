import type { Database } from '@mia/db';
import type { LanguageCode } from '@mia/validators/language';

import type { SessionCustomer } from '../../shared/http/context.ts';
import { notFound } from '../../shared/http/errors.ts';
import { rememberLanguage, requestLanguage } from './language.ts';
import * as repo from './repo.ts';
import * as service from './service.ts';
import type { CustomerAccountRow } from './types.ts';

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
  /** What the order email is written in — see `language.ts`. */
  language: LanguageCode;
}

export interface OrderCustomerInput {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  /** The checkout page's language. */
  language?: LanguageCode;
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
  if (session) return resolveForSession(db, session, customer);

  const existing = await repo.findByEmail(db, customer.email);

  const account = existing
    ? await fillBlankProfile(db, existing, customer)
    : await repo.createOrGetByEmail(db, {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
      });

  const isBrandNew = existing === undefined;
  // Anyone can check out under any address, so this only fills a blank.
  await rememberLanguage(db, account.id, customer.language, false);

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
    language: requestLanguage(customer.language, account.language),
  };
}

export interface ManualOrderCustomerInput {
  email: string;
  /** Empty strings are fine: an account made by the sign-in page has no name either. */
  firstName: string;
  lastName: string;
  phone: string | null;
  language?: LanguageCode;
}

export interface ResolvedManualAccount {
  customerAccountId: string;
  /** `confirmed` only when the agent picked an existing account. */
  customerLinkStatus: 'unverified' | 'confirmed';
  email: string;
  language: LanguageCode;
}

/**
 * The account behind an order an agent creates. No customer session exists and no
 * activation mail is planned: the order link email is the only mail, and it carries
 * the "Didn't ask for this order?" token that needs this account id.
 *
 * ```
 * agent picked account Anna Rossi          → her account, link `confirmed` (the agent vouches)
 * agent typed rossi@x.it, account exists   → that account, link `unverified`
 * agent typed new@x.it, no account         → new account with empty names, `unverified`
 * ```
 */
export async function resolveForManualOrder(
  db: Database,
  customer: ManualOrderCustomerInput,
  pickedAccountId: string | null,
): Promise<ResolvedManualAccount> {
  if (pickedAccountId) {
    const picked = await repo.findById(db, pickedAccountId);
    if (!picked) throw notFound('Customer account');
    return {
      customerAccountId: picked.id,
      customerLinkStatus: 'confirmed',
      email: picked.email,
      language: requestLanguage(customer.language, picked.language),
    };
  }

  const account = await repo.createOrGetByEmail(db, {
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
  });
  // An agent typing a language proves nothing about the customer: fill a blank only.
  await rememberLanguage(db, account.id, customer.language, false);

  return {
    customerAccountId: account.id,
    customerLinkStatus: 'unverified',
    email: account.email,
    language: requestLanguage(customer.language, account.language),
  };
}

/** A session is proof, so the link is `confirmed` and only a confirmation is sent. */
async function resolveForSession(
  db: Database,
  session: SessionCustomer,
  customer: OrderCustomerInput,
): Promise<ResolvedOrderAccount> {
  // Signed in, so the checkout's language is theirs to state.
  await rememberLanguage(db, session.id, customer.language, true);
  const needsRow = !customer.language || !session.firstName || !session.lastName;
  const row = needsRow ? await repo.findById(db, session.id) : undefined;

  const resolved = {
    customerAccountId: session.id,
    customerLinkStatus: 'confirmed',
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    mailPlan: 'confirmation',
    language: requestLanguage(customer.language, row?.language),
  } as const;
  if (session.firstName && session.lastName) return resolved;

  // Signed in through the sign-in page and never filled the profile.
  if (!row) return resolved;
  const filled = await fillBlankProfile(db, row, customer);
  return { ...resolved, firstName: filled.firstName, lastName: filled.lastName };
}

/**
 * An account made by the sign-in page has no name — nobody was asked for one. Its
 * first checkout is the first time we learn it, so the blanks are filled from the
 * form. Only blanks: a name the account holder chose is never overwritten by
 * whatever somebody typed into a checkout.
 */
async function fillBlankProfile(
  db: Database,
  account: CustomerAccountRow,
  customer: OrderCustomerInput,
): Promise<CustomerAccountRow> {
  const patch = {
    ...(account.firstName ? {} : { firstName: customer.firstName }),
    ...(account.lastName ? {} : { lastName: customer.lastName }),
    ...(account.phone || !customer.phone ? {} : { phone: customer.phone }),
  };
  if (Object.keys(patch).length === 0) return account;

  await repo.updateProfile(db, account.id, patch);
  return { ...account, ...patch };
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
