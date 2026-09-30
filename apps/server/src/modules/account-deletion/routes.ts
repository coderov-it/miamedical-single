import {
  ConfirmAccountDeletionSchema,
  RequestAccountDeletionSchema,
  VerifyAccountDeletionSchema,
} from '@mia/validators';
import type { Context } from 'hono';
import { Hono } from 'hono';

import { clearCustomerSessionCookie } from '../../shared/auth/customer-session.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { clientIp, rateLimit } from '../../shared/http/rate-limit.ts';
import { validate } from '../../shared/http/validate.ts';
import * as service from './service.ts';

/**
 * Public profile deletion, mounted at /api/customer/account-deletion. No
 * session: the whole point is that somebody without the app can use it. The
 * emailed code is the authorisation — see service.ts.
 */

const MINUTE = 60 * 1000;

/** Keys a limiter on the account being asked about, not on the caller. */
function byIdentifier(prefix: string) {
  return async (c: Context<AppEnv>) => {
    const body = (await c.req.raw
      .clone()
      .json()
      .catch(() => null)) as { identifier?: unknown } | null;
    const identifier =
      typeof body?.identifier === 'string' ? body.identifier.trim().toLowerCase() : '';
    return `${prefix}:${identifier || clientIp(c)}`;
  };
}

/* Mailing a code: per caller, and per inbox so nobody can flood someone else's. */
const requestByIp = rateLimit({ limit: 5, windowMs: 15 * MINUTE });
const requestByIdentifier = rateLimit({
  limit: 5,
  windowMs: 60 * MINUTE,
  key: byIdentifier('delete-mail'),
});

/*
 * Guessing a code. ONE limiter instance shared by verify and confirm, keyed on
 * the account: 5 wrong guesses per 15 minutes against a 1-in-a-million code
 * that dies in 15 minutes. Only failures count, so a customer who types it
 * right first time never meets the limit.
 */
const guessesByIp = rateLimit({ limit: 20, windowMs: 15 * MINUTE, countFailuresOnly: true });
const guessesByIdentifier = rateLimit({
  limit: 5,
  windowMs: 15 * MINUTE,
  countFailuresOnly: true,
  key: byIdentifier('delete-code'),
});

/** Same words whether or not the identifier matched anybody. */
const CODE_SENT = { message: 'Se il profilo esiste, abbiamo inviato un codice alla sua email.' };

export const accountDeletionRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  POST /api/customer/account-deletion/request (public)
  Emails a 6-digit deletion code to the account matching an email or user id.
  -------------------------------------------------------------------------- **/
  .post(
    '/request',
    requestByIp,
    requestByIdentifier,
    validate('json', RequestAccountDeletionSchema),
    async (c) => {
      await service.requestCode(c.get('db'), c.req.valid('json'), clientIp(c));
      return c.json({ data: CODE_SENT });
    },
  )

  /** --------------------------------------------------------------------------
  POST /api/customer/account-deletion/verify (public)
  Checks a deletion code without spending it.
  -------------------------------------------------------------------------- **/
  .post(
    '/verify',
    guessesByIp,
    guessesByIdentifier,
    validate('json', VerifyAccountDeletionSchema),
    async (c) => {
      await service.verifyCode(c.get('db'), c.req.valid('json'));
      return c.json({ data: { ok: true } });
    },
  )

  /** --------------------------------------------------------------------------
  POST /api/customer/account-deletion/confirm (public)
  Spends the code and permanently erases the profile.
  -------------------------------------------------------------------------- **/
  .post(
    '/confirm',
    guessesByIp,
    guessesByIdentifier,
    validate('json', ConfirmAccountDeletionSchema),
    async (c) => {
      await service.confirmDeletion(c.get('db'), c.req.valid('json'));
      // The session row is already gone; this just tidies the browser.
      clearCustomerSessionCookie(c);
      return c.json({ data: { deleted: true } });
    },
  );
