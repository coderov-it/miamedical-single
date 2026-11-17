/**
 * Minting the private link an agent sends for a manual order (the public page that redeems
 * it is `routes.ts`). Docs: docs/code/manual-orders.md.
 *
 * ```
 * agent: steps sign_pay, details on, "Send by email"
 *   1. checks            → 422 with `fields` when the steps do not fit the order
 *   2. mint (30 d)       → new token stored hashed, the previous one revoked, `link` event
 *   3. deliver 'email'   → manual-order-link template + report token; 'copy' → URL returned
 * ```
 * The raw token is stored nowhere, so "Copy link" mints a fresh one every time.
 */

import type { Database } from '@mia/db';
import type { SendOrderLinkInput } from '@mia/validators';

import type { SessionUser } from '../../shared/http/context.ts';
import * as customerRepo from '../customer-auth/repo.ts';
import { requestLanguage } from '../customer-auth/language.ts';
import * as contractsRepo from '../contracts/repo.ts';
import * as manualRepo from '../orders/manual/repo.ts';
import { getById } from '../orders/service.ts';
import { completeOrderUrl } from '../notifications/links.ts';
import { issueAuthToken } from '../customer-auth/service.ts';
import { httpError } from '../../shared/http/errors.ts';
import { sendManualOrderLink } from '../notifications/mail.ts';
import * as repo from './repo.ts';
import { generateToken, tokenExpiry } from './token.ts';
import { assertLinkable, linkNote } from './validation.ts';

export interface IssuedLink {
  /** The customer-facing URL; the only time the raw token exists. */
  url: string;
  expiresAt: string;
  delivered: 'email' | 'copy';
  /** `email` only: false when the mail failed (the failure is on the timeline). */
  emailSent: boolean | null;
}

export async function issueLink(
  db: Database,
  orderId: string,
  input: SendOrderLinkInput,
  actor: SessionUser,
): Promise<IssuedLink> {
  const order = await getById(db, orderId);
  const contract = await contractsRepo.findLatestActiveByOrderId(db, orderId);
  assertLinkable(
    {
      ...order,
      hasRental: order.items.some(
        (item) =>
          (item.configuration as Record<string, unknown> | null)?.['pricingMode'] === 'rental',
      ),
      contractStatus: contract?.status ?? null,
    },
    input,
  );

  const account = order.customerAccountId
    ? await customerRepo.findById(db, order.customerAccountId)
    : undefined;
  if (input.deliver === 'email' && !account) {
    throw httpError(409, 'This order has no customer account to email.', 'conflict');
  }

  const token = generateToken();
  const expiresAt = tokenExpiry();
  await db.transaction(async (tx) => {
    await repo.mint(tx, {
      hash: token.hash,
      orderId,
      steps: input.steps,
      includeDetails: input.includeDetails,
      expiresAt,
      createdByAdminUserId: actor.id,
    });
    await manualRepo.insertLinkEvent(tx, {
      orderId,
      steps: input.steps,
      note: linkNote(input),
      actorAdminUserId: actor.id,
    });
  });

  const language = requestLanguage(undefined, account?.language);
  const url = completeOrderUrl(token.raw, language);
  const base = { url, expiresAt: expiresAt.toISOString(), delivered: input.deliver } as const;
  if (input.deliver === 'copy' || !account) return { ...base, emailSent: null };

  const { token: reportToken } = await issueAuthToken(db, {
    customerAccountId: account.id,
    purpose: 'order_report',
    orderId,
  });
  const result = await sendManualOrderLink(
    {
      email: order.email,
      firstName: order.firstName ?? '',
      lastName: order.lastName ?? '',
      orderNumber: order.number,
      total: order.total,
      currency: order.currency,
      discount: order.discountTotal,
      steps: input.steps,
      includeDetails: input.includeDetails,
      url,
      expiresAt: expiresAt.toISOString(),
      reportToken,
      language,
    },
    { db, orderId },
  );
  return { ...base, emailSent: result.sent };
}
