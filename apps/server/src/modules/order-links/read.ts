/** GET of the link: the summary the page draws, for a live token. */

import type { DatabaseWriter } from '@mia/db';

import { redeem } from './redeem.ts';
import { type OrderLinkSummaryDto, toSummary } from './summary.ts';

export async function readSummary(
  db: DatabaseWriter,
  rawToken: string,
): Promise<OrderLinkSummaryDto> {
  const link = await redeem(db, rawToken);
  return toSummary({ order: link.order, token: link.token, contractStatus: link.contractStatus });
}
