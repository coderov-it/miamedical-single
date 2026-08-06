import * as v from 'valibot';

const EnvSchema = v.object({
  NODE_ENV: v.optional(v.picklist(['development', 'test', 'production']), 'development'),
  DATABASE_URL: v.pipe(v.string(), v.minLength(1, 'DATABASE_URL is required.')),
  API_PORT: v.pipe(
    v.optional(v.string(), '8787'),
    v.transform(Number),
    v.number(),
    v.integer(),
    v.minValue(1),
    v.maxValue(65535),
  ),
  API_HOST: v.optional(v.string(), '0.0.0.0'),
  CORS_ORIGINS: v.pipe(
    v.optional(v.string(), 'http://localhost:4321,http://localhost:5173'),
    v.transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  ),
  AUTH_SECRET: v.pipe(v.string(), v.minLength(16, 'AUTH_SECRET must be at least 16 characters.')),

  /** How long a back-office session stays valid without re-authenticating. */
  SESSION_TTL_DAYS: v.pipe(
    v.optional(v.string(), '7'),
    v.transform(Number),
    v.number(),
    v.integer(),
    v.minValue(1),
    v.maxValue(365),
  ),
  /** Set when the admin is served from a different subdomain than the API. */
  AUTH_COOKIE_DOMAIN: v.optional(v.string()),
  /**
   * `lax` is right when the admin and the API share a site. Cross-site setups
   * need `none`, which browsers only honour on a Secure cookie over HTTPS.
   */
  AUTH_COOKIE_SAMESITE: v.optional(v.picklist(['lax', 'strict', 'none']), 'lax'),
  /**
   * Only enable behind a proxy that overwrites `X-Forwarded-For`. When off, the
   * login rate limiter keys on the socket address, which cannot be spoofed.
   */
  TRUST_PROXY: v.pipe(
    v.optional(v.picklist(['true', 'false']), 'false'),
    v.transform((value) => value === 'true'),
  ),
});

const parsed = v.safeParse(EnvSchema, process.env);

if (!parsed.success) {
  const issues = parsed.issues
    .map((issue) => `  - ${v.getDotPath(issue) ?? '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.output;
export type Env = typeof env;
