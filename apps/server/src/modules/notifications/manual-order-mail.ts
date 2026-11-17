import type { EmailMessage, ManualOrderLinkSteps } from '@mia/templates';
import { manualOrderLink } from '@mia/templates';
import type { LanguageCode } from '@mia/validators/language';

/**
 * The message an agent's "Send by email" produces for a manual order, built apart from
 * the send so a test can read it without a transport. `mail.ts` `sendManualOrderLink`
 * sends it. The report link (`links.reportOrderUrl`, built by `mail.ts`) carries an `order_report` token bound to this order's
 * account (issued by `order-links/service.ts`), which `order-disputes/service.create`
 * consumes. Docs: docs/code/manual-orders.md.
 */
export interface ManualOrderLinkMail {
  email: string;
  /** Empty when the agent created the account from an email alone. */
  firstName: string;
  lastName: string;
  orderNumber: string;
  total: string;
  currency: string;
  /** The order-level discount amount; "0.00" when none. */
  discount: string;
  steps: ManualOrderLinkSteps;
  includeDetails: boolean;
  url: string;
  expiresAt: string;
  /** The "didn't ask for this order" page, with the `order_report` token in it. */
  reportUrl: string;
  language: LanguageCode;
}

export function buildManualOrderLinkMessage(input: ManualOrderLinkMail): EmailMessage {
  return manualOrderLink({
    to: input.email,
    recipient: { firstName: input.firstName, lastName: input.lastName },
    order: { number: input.orderNumber, total: input.total, currency: input.currency },
    discount: input.discount,
    steps: input.steps,
    includeDetails: input.includeDetails,
    url: input.url,
    reportUrl: input.reportUrl,
    expiresAt: input.expiresAt,
    language: input.language,
  });
}
