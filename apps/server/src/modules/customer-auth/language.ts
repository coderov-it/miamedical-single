import type { Database, DatabaseWriter } from '@mia/db';
import type { LanguageCode } from '@mia/validators/language';

import { hashToken } from '../../shared/auth/customer-session.ts';
import { readerLanguage } from '../push/language.ts';
import * as repo from './repo.ts';

/**
 * Which language a customer is written to in, and when we learn it.
 *
 * The storefront sends the language of the page each request came from. What
 * that language is allowed to change depends on whether the request proves who
 * is asking — a stranger can type anybody's address into a sign-in form, but
 * only the inbox owner can click its link:
 *
 * ```text
 *  request                                  email in        account.language
 *  sign-in link / reset / register,          page language   filled only if empty
 *    guest checkout                (anyone)
 *  password sign-in, link clicked,           page language   set to page language
 *    signed-in checkout            (proven)
 *  profile setting, language switcher        —               set to the choice
 *  later mail (reminders, offers)            account.language, else 'it'
 * ```
 *
 * So the language a customer last used while signed in is the one they hear
 * from us in, and the profile shows and changes that same value.
 */

/** The email for a request: the page it came from, else what the account stated. */
export function requestLanguage(
  pageLanguage: LanguageCode | undefined,
  accountLanguage: unknown,
): LanguageCode {
  return pageLanguage ?? readerLanguage(accountLanguage);
}

/** Records a page language. `proven` — signed in or link clicked — overwrites. */
export async function rememberLanguage(
  db: DatabaseWriter,
  accountId: string,
  pageLanguage: LanguageCode | undefined,
  proven: boolean,
): Promise<void> {
  if (!pageLanguage) return;
  if (proven) {
    await repo.setLanguage(db, accountId, pageLanguage);
    return;
  }
  await repo.fillLanguage(db, accountId, pageLanguage);
}

/**
 * The language to open an emailed link's page in, without spending the link.
 * Null for a spent, expired or unknown link, and for an account that never
 * stated a language — either way the page stays in the language it was opened in.
 */
export async function tokenLanguage(db: Database, token: string): Promise<LanguageCode | null> {
  const row = await repo.findLanguageByLiveToken(db, await hashToken(token), [
    'activation',
    'magic_link',
    'password_reset',
    'order_report',
  ]);
  return row?.language ?? null;
}
