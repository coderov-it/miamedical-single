import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context, MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

import { env } from '../../config/env.ts';
import type { AppEnv } from './context.ts';
import { tooManyRequests } from './errors.ts';

/**
 * Fixed-window limiter held in this process's memory. That is deliberate for
 * now: it protects a single-node deploy against credential stuffing without
 * pulling in Redis. Running more than one instance divides the effective limit
 * by the instance count — move the counter to `infra/cache/` before scaling out.
 */

interface Window {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** Attempts allowed per window. */
  limit: number;
  windowMs: number;
  /** Defaults to the client IP. */
  key?: (c: Context<AppEnv>) => string | Promise<string>;
  /**
   * Refund the attempt when the handler succeeds, so the budget only tracks
   * failures. Without this, an office behind one NAT address would lock itself
   * out by signing in normally.
   */
  countFailuresOnly?: boolean;
}

export function rateLimit(options: RateLimitOptions): MiddlewareHandler<AppEnv> {
  const windows = new Map<string, Window>();

  return createMiddleware<AppEnv>(async (c, next) => {
    const now = Date.now();
    const key = (await options.key?.(c)) ?? clientIp(c);

    // The map only ever holds keys seen within the last window, so sweeping
    // expired entries on each call keeps it bounded without a timer.
    for (const [existing, window] of windows) {
      if (window.resetAt <= now) windows.delete(existing);
    }

    const window = windows.get(key) ?? { count: 0, resetAt: now + options.windowMs };
    window.count += 1;
    windows.set(key, window);

    if (window.count > options.limit) {
      throw tooManyRequests(Math.max(1, Math.ceil((window.resetAt - now) / 1000)));
    }

    await next();

    // A rejected login throws, so this only runs on the success path.
    if (options.countFailuresOnly && c.res.status < 400) {
      window.count = Math.max(0, window.count - 1);
    }
  });
}

/**
 * `X-Forwarded-For` is client-controlled unless a proxy overwrites it, so it is
 * only trusted when the deploy says so — otherwise an attacker could rotate the
 * header and never hit the limit.
 */
export function clientIp(c: Context<AppEnv>): string {
  if (env.TRUST_PROXY) {
    const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
  }

  return getConnInfo(c).remote.address ?? 'unknown';
}
