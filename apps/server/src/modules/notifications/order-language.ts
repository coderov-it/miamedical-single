import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import { customerAccounts, orders } from '@mia/db/schema';
import type { LanguageCode } from '@mia/validators/language';

import { readerLanguage } from '../push/language.ts';

/**
 * The language to write to an order's customer in, for mail nobody asked for at
 * that moment — rental reminders, extend offers. The account's stated language,
 * else Italian; a guest order without an account gets Italian.
 */
export async function orderReaderLanguage(db: Database, orderId: string): Promise<LanguageCode> {
  const [row] = await db
    .select({ language: customerAccounts.language })
    .from(orders)
    .leftJoin(customerAccounts, eq(orders.customerAccountId, customerAccounts.id))
    .where(eq(orders.id, orderId))
    .limit(1);
  return readerLanguage(row?.language);
}
