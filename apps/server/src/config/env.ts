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

  /**
   * Cloudflare R2 (S3 API). Optional as a group so the server boots without
   * credentials in local dev — the storage adapter fails lazily, on first use,
   * naming what is missing. Upload size/mime limits are NOT env: they live in
   * `MEDIA_PROFILES` (`@mia/validators`), shared with the admin uploader.
   */
  R2_ACCOUNT_ID: v.optional(v.string()),
  R2_ACCESS_KEY_ID: v.optional(v.string()),
  R2_SECRET_ACCESS_KEY: v.optional(v.string()),
  R2_BUCKET: v.optional(v.string()),
  /**
   * WebP encoding quality for server-side image conversion. 92 is visually
   * lossless for product photography; drop it only if storage cost bites.
   */
  MEDIA_WEBP_QUALITY: v.pipe(
    v.optional(v.string(), '92'),
    v.transform(Number),
    v.number(),
    v.integer(),
    v.minValue(1),
    v.maxValue(100),
  ),
  /** Staging uploads older than this are swept as orphans. */
  MEDIA_STAGING_TTL_HOURS: v.pipe(
    v.optional(v.string(), '24'),
    v.transform(Number),
    v.number(),
    v.integer(),
    v.minValue(1),
    v.maxValue(720),
  ),
  DEFAULT_CURRENCY: v.pipe(v.optional(v.string(), 'EUR'), v.length(3), v.toUpperCase()),

  /**
   * HERE Geocoding & Search, for the checkout's address suggestions.
   *
   * Optional, like the R2 group: the server boots without it and the endpoint
   * answers 503 naming what is missing, because a shop that cannot complete an
   * address can still take an order — the customer types it. The key is read only
   * here and used only server-side; it is never sent to the browser, which is the
   * whole reason the suggestion endpoint is ours rather than a direct call.
   */
  HERE_API_KEY: v.optional(v.string()),
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
