/**
 * The customer completing their own details from the link. Docs: docs/code/manual-orders.md.
 *
 * ```
 * private, codice fiscale typed          → saved, missingFields []
 * company without partita IVA            → 422 partitaIva (same rule as the checkout)
 * contract already signed                → 409, the contract states these details and is frozen
 * ```
 * Only the fields the checkout's customer block has; the delivery stays what the agent set.
 */

import type { Database } from '@mia/db';
import type { OrderLinkDetailsInput } from '@mia/validators';

import { forbidden, httpError } from '../../shared/http/errors.ts';
import * as contractsRepo from '../contracts/repo.ts';
import * as ordersRepo from '../orders/repo.ts';
import { readSummary } from './read.ts';
import { redeem } from './redeem.ts';
import type { OrderLinkSummaryDto } from './summary.ts';

/** The values to store: a fiscal field the customer type does not use is cleared, not kept stale. */
export function detailsPatch(input: OrderLinkDetailsInput) {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    customerType: input.customerType,
    codiceFiscale: input.customerType === 'tourist' ? null : (input.codiceFiscale ?? null),
    partitaIva: input.customerType === 'company' ? (input.partitaIva ?? null) : null,
  };
}

export async function saveDetails(
  db: Database,
  rawToken: string,
  input: OrderLinkDetailsInput,
): Promise<OrderLinkSummaryDto> {
  const link = await redeem(db, rawToken);
  if (!link.token.includeDetails) throw forbidden('This link does not include the details form.');

  await db.transaction(async (tx) => {
    await contractsRepo.lockOrder(tx, link.order.id);
    const contract = await contractsRepo.findLatestActiveByOrderId(tx, link.order.id);
    if (contract?.status === 'signed') {
      throw httpError(
        409,
        'The contract is signed, so the details can no longer change.',
        'conflict',
      );
    }
    await ordersRepo.update(tx, link.order.id, detailsPatch(input));
  });

  return readSummary(db, rawToken);
}
