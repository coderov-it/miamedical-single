import {
  CustomerLoginSchema,
  EmailOnlySchema,
  RedeemAuthTokenSchema,
  SetCustomerPasswordSchema,
} from '@mia/validators';
import { Hono } from 'hono';

import {
  clearCustomerSessionCookie,
  readCustomerSessionCookie,
  setCustomerSessionCookie,
} from '../../shared/auth/customer-session.ts';
import { currentCustomer, requireCustomer } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { clientIp, rateLimit } from '../../shared/http/rate-limit.ts';
import { validate } from '../../shared/http/validate.ts';
import * as orderLinks from '../customer-account/order-links.ts';
import { toCustomer } from './mapper.ts';
import * as service from './service.ts';

/**
 * Storefront authentication, mounted at /api/customer/auth. Public by definition —
 * this is how a customer comes to have a session at all.
 */

/** Credential endpoints are the one place worth throttling before validation. */
const loginRateLimit = rateLimit({
  limit: 10,
  windowMs: 15 * 60 * 1000,
  countFailuresOnly: true,
});

const emailRateLimitByIp = rateLimit({ limit: 5, windowMs: 15 * 60 * 1000 });

/**
 * Second limiter on the mail-sending routes, keyed on the ADDRESS being mailed
 * rather than the caller.
 *
 * An IP limit alone does not protect the inbox: an attacker rotates addresses far
 * more cheaply than a victim changes their email, so without this we are a way to
 * flood someone else's mailbox. The `mail:` prefix keeps these windows from
 * colliding with the IP-keyed ones in the same process map.
 */
const emailRateLimitByAddress = rateLimit({
  limit: 5,
  windowMs: 60 * 60 * 1000,
  key: async (c) => {
    const body = (await c.req.raw
      .clone()
      .json()
      .catch(() => null)) as { email?: unknown } | null;
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    return `mail:${email || clientIp(c)}`;
  },
});

/**
 * Requesting a link answers identically whether or not the address is known.
 * Anything else turns an unauthenticated endpoint into an enumeration oracle.
 */
const CHECK_YOUR_INBOX = { message: 'Se l’indirizzo è registrato, riceverai un’email tra poco.' };

export const customerAuthRoutes = new Hono<AppEnv>()
  .post('/login', loginRateLimit, validate('json', CustomerLoginSchema), async (c) => {
    const { account, token, expiresAt } = await service.login(c.get('db'), c.req.valid('json'), {
      ipAddress: clientIp(c),
      userAgent: c.req.header('user-agent') ?? null,
    });

    setCustomerSessionCookie(c, token, expiresAt);

    return c.json({ data: toCustomer(account) });
  })

  .post('/logout', async (c) => {
    await service.logout(c.get('db'), readCustomerSessionCookie(c));
    clearCustomerSessionCookie(c);

    return c.json({ data: { ok: true } });
  })

  /** The storefront calls this on boot; a 401 is its signal to show the sign-in form. */
  .get('/me', requireCustomer, async (c) => {
    const customer = currentCustomer(c);
    const row = await service.repo.findById(c.get('db'), customer.id);
    if (!row) {
      // The session resolved a moment ago, so this only happens if the account was
      // erased mid-request. Treat it as signed out rather than as a server fault.
      clearCustomerSessionCookie(c);
      return c.json({ data: null }, 401);
    }

    return c.json({ data: toCustomer(row) });
  })

  .post(
    '/magic-link',
    emailRateLimitByIp,
    emailRateLimitByAddress,
    validate('json', EmailOnlySchema),
    async (c) => {
      await service.requestEmailedLink(
        c.get('db'),
        c.req.valid('json').email,
        'magic_link',
        clientIp(c),
      );
      return c.json({ data: CHECK_YOUR_INBOX });
    },
  )

  .post(
    '/password-reset',
    emailRateLimitByIp,
    emailRateLimitByAddress,
    validate('json', EmailOnlySchema),
    async (c) => {
      await service.requestEmailedLink(
        c.get('db'),
        c.req.valid('json').email,
        'password_reset',
        clientIp(c),
      );
      return c.json({ data: CHECK_YOUR_INBOX });
    },
  )

  /**
   * Redeems an activation, magic-link or reset token: signs them in, and sets a
   * password when one was supplied.
   *
   * When the link came from an order email, clicking it also confirms that order's
   * account link — following the link IS the customer vouching for the match, so
   * asking them again on the next screen would be asking twice.
   */
  .post('/token/redeem', emailRateLimitByIp, validate('json', RedeemAuthTokenSchema), async (c) => {
    const db = c.get('db');
    const { account, token, expiresAt, orderId } = await service.redeemToken(
      db,
      c.req.valid('json'),
      { ipAddress: clientIp(c), userAgent: c.req.header('user-agent') ?? null },
    );

    if (orderId) await orderLinks.confirmLink(db, orderId, account.id);

    setCustomerSessionCookie(c, token, expiresAt);

    return c.json({ data: toCustomer(account) });
  })

  .post('/password', requireCustomer, validate('json', SetCustomerPasswordSchema), async (c) => {
    await service.setPassword(
      c.get('db'),
      currentCustomer(c).id,
      c.req.valid('json'),
      readCustomerSessionCookie(c),
    );
    // Every other session was revoked; this one deliberately survives, so no
    // cookie is cleared here. See the reasoning in service.setPassword.
    return c.json({ data: { ok: true } });
  });
