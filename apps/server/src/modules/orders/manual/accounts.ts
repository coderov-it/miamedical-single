/**
 * Customer-account search for the new-order form. Docs: docs/code/manual-orders.md.
 *
 * ```
 * q "rossi@"  → accounts whose email contains it first, then name/phone matches
 * each hit    → prefill from that account's latest order (type, codice fiscale,
 *               partita IVA, delivery address), decision 4
 * ```
 */

import type { Database } from '@mia/db';
import { and, desc, ilike, inArray, isNull, or, sql } from '@mia/db';
import { customerAccounts, orders } from '@mia/db/schema';

export interface CustomerAccountMatch {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  prefill: {
    customerType: 'private' | 'company' | 'tourist' | null;
    codiceFiscale: string | null;
    partitaIva: string | null;
    address: string;
  } | null;
}

const MAX_RESULTS = 10;

/** `%` and `_` typed by the agent are text, not wildcards. */
const likeTerm = (q: string): string => `%${q.replace(/[\\%_]/g, '\\$&')}%`;

export async function searchAccounts(db: Database, q: string): Promise<CustomerAccountMatch[]> {
  const term = likeTerm(q);
  const emailMatch = ilike(customerAccounts.email, term);
  const accounts = await db
    .select()
    .from(customerAccounts)
    .where(
      and(
        isNull(customerAccounts.deletedAt),
        or(
          emailMatch,
          ilike(customerAccounts.phone, term),
          sql`(${customerAccounts.firstName} || ' ' || ${customerAccounts.lastName}) ILIKE ${term}`,
        ),
      ),
    )
    .orderBy(sql`(${emailMatch}) DESC`, customerAccounts.email)
    .limit(MAX_RESULTS);
  if (accounts.length === 0) return [];

  const latest = await db
    .selectDistinctOn([orders.customerAccountId], {
      accountId: orders.customerAccountId,
      customerType: orders.customerType,
      codiceFiscale: orders.codiceFiscale,
      partitaIva: orders.partitaIva,
      shippingAddress: orders.shippingAddress,
    })
    .from(orders)
    .where(
      inArray(
        orders.customerAccountId,
        accounts.map((account) => account.id),
      ),
    )
    .orderBy(orders.customerAccountId, desc(orders.placedAt));
  const byAccount = new Map(latest.map((row) => [row.accountId, row]));

  return accounts.map((account) => {
    const last = byAccount.get(account.id);
    const line1 = last?.shippingAddress?.['line1'];
    return {
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      phone: account.phone,
      prefill: last
        ? {
            customerType: last.customerType,
            codiceFiscale: last.codiceFiscale,
            partitaIva: last.partitaIva,
            address: typeof line1 === 'string' ? line1 : '',
          }
        : null,
    };
  });
}
