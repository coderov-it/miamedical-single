import { Hono } from 'hono';

import { currentUser, requireAuth } from '../../shared/auth/guards.ts';
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from '../../shared/auth/session.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { clientIp, rateLimit } from '../../shared/http/rate-limit.ts';
import { validate } from '../../shared/http/validate.ts';
import { toProfileDto, toSessionUser } from './mapper.ts';
import * as service from './service.ts';
import { ChangePasswordSchema, LoginSchema, UpdateProfileSchema } from './validators.ts';

/** Credential endpoints are the one place worth throttling before validation. */
const loginRateLimit = rateLimit({
  limit: 10,
  windowMs: 15 * 60 * 1000,
  countFailuresOnly: true,
});

export const authRoutes = new Hono<AppEnv>()
  .post('/login', loginRateLimit, validate('json', LoginSchema), async (c) => {
    const { user, token, expiresAt } = await service.login(c.get('db'), c.req.valid('json'), {
      ipAddress: clientIp(c),
      userAgent: c.req.header('user-agent') ?? null,
    });

    setSessionCookie(c, token, expiresAt);

    return c.json({ data: toSessionUser(user) });
  })

  .post('/logout', async (c) => {
    await service.logout(c.get('db'), readSessionCookie(c));
    clearSessionCookie(c);

    return c.json({ data: { ok: true } });
  })

  /** The admin UI calls this on boot; a 401 is its signal to show the login form. */
  .get('/me', requireAuth, async (c) => {
    return c.json({ data: toSessionUser(currentUser(c)) });
  })

  .post('/password', requireAuth, validate('json', ChangePasswordSchema), async (c) => {
    await service.changePassword(c.get('db'), currentUser(c).id, c.req.valid('json'));
    // Every session was revoked, including this one.
    clearSessionCookie(c);

    return c.json({ data: { ok: true } });
  })

  /**
   * Your own account. Behind `requireAuth` and nothing more: an operator who
   * holds no permission at all still owns their name, their phone number and
   * their password, and `/api/admin/users` — which does answer to `admin:*` —
   * refuses a self-target for exactly that reason.
   */
  .get('/profile', requireAuth, async (c) => {
    const row = await service.getProfile(c.get('db'), currentUser(c).id);
    return c.json({ data: toProfileDto(row) });
  })

  .patch('/profile', requireAuth, validate('json', UpdateProfileSchema), async (c) => {
    const row = await service.updateProfile(c.get('db'), currentUser(c).id, c.req.valid('json'));
    return c.json({ data: toProfileDto(row) });
  });
