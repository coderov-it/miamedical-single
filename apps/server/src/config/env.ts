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
  /**
   * How long a customer stays signed in, and how stale a session may get before
   * an authenticated request pushes its expiry back out.
   *
   * Longer than the back office and sliding, unlike it: an operator asked to sign
   * in weekly is fine, a customer who rents twice a year and meets a login form
   * instead of their order history is a support call. The refresh threshold is
   * what keeps the slide to one UPDATE per customer per day rather than one per
   * request.
   */
  CUSTOMER_SESSION_TTL_DAYS: v.pipe(
    v.optional(v.string(), '30'),
    v.transform(Number),
    v.number(),
    v.integer(),
    v.minValue(1),
    v.maxValue(365),
  ),
  CUSTOMER_SESSION_REFRESH_HOURS: v.pipe(
    v.optional(v.string(), '24'),
    v.transform(Number),
    v.number(),
    v.integer(),
    v.minValue(1),
    v.maxValue(8760),
  ),
  /**
   * Set when the admin is served from a different subdomain than the API. Shared
   * by both session cookies — `.example.it` makes `example.it` and
   * `api.example.it` same-site, which is what keeps `AUTH_COOKIE_SAMESITE=lax`
   * workable for the storefront too.
   */
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
   * Absolute origin of the storefront. Not optional like the credential groups
   * below: every account email carries a link back to a page, and a relative link
   * in an inbox goes nowhere. Astro reads the same variable.
   */
  PUBLIC_SITE_URL: v.pipe(
    v.optional(v.string(), 'http://localhost:4321'),
    v.transform((value) => value.replace(/\/+$/, '')),
  ),
  /** Origin of the admin SPA, so internal alert emails can deep-link into it. */
  PUBLIC_ADMIN_URL: v.pipe(
    v.optional(v.string(), 'http://localhost:5173'),
    v.transform((value) => value.replace(/\/+$/, '')),
  ),

  /**
   * Mail delivery. Exactly one transport is live, and this picks it.
   *
   * `console` renders the message to the log instead of sending it, which is the
   * only way to click an activation link in local development — the link IS the
   * feature, so a transport that swallows it makes the flow untestable. Anything
   * but `console` in production.
   *
   * `plunk`, `cloudflare` and `ses` are interchangeable to every caller; which one
   * is live is an operational choice, not a code one. Every provider group is
   * optional the same way R2 is: the server boots without them and the adapter
   * fails on first send naming what is missing, so a misconfigured mail provider
   * never keeps the rest of the API down. The guards below close the gap that
   * leaves, by refusing to start production with the chosen provider unconfigured.
   */
  MAIL_TRANSPORT: v.optional(v.picklist(['console', 'plunk', 'cloudflare', 'ses']), 'console'),
  /*
    Shared by both providers, and each of them requires the domain to be verified
    on their side before it will send.

    A no-reply mailbox, and visibly one: nothing receives there, and no Reply-To is
    ever sent (see infra/mail/port.ts). Customers are given WhatsApp and the
    free-phone number in the message body instead.
  */
  MAIL_FROM_ADDRESS: v.optional(v.string()),

  /** Plunk. A secret key, `sk_…`, from the project's API settings. */
  PLUNK_API_KEY: v.optional(v.string()),

  /*
    Cloudflare Email Sending. The token needs the "Email Sending: Edit" permission
    and the sending domain must be onboarded on this same account.

    Kept separate from R2_ACCOUNT_ID even though in practice both hold the same
    Cloudflare account: tying mail delivery to the storage config would mean one
    could not be moved without the other.
  */
  CLOUDFLARE_ACCOUNT_ID: v.optional(v.string()),
  CLOUDFLARE_EMAIL_API_TOKEN: v.optional(v.string()),

  /*
    AWS SES. Omit the two access keys to fall back on the SDK's default credential
    chain, so an instance role works without putting secrets in the environment.
  */
  AWS_SES_REGION: v.optional(v.string()),
  AWS_SES_ACCESS_KEY_ID: v.optional(v.string()),
  AWS_SES_SECRET_ACCESS_KEY: v.optional(v.string()),
});

const parsed = v.safeParse(EnvSchema, process.env);

if (!parsed.success) {
  const issues = parsed.issues
    .map((issue) => `  - ${v.getDotPath(issue) ?? '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.output;

/*
  Mail failures are the quietest kind. The console transport writes activation and
  magic links to the log instead of sending them: in development that is the point,
  in production it means every customer silently never receives the link that lets
  them in, with no error anywhere to show it. A provider selected but left
  unconfigured is the same failure one step later — the adapter throws on first
  send, and order placement is built to log that and keep the order, so nothing
  louder than a log line ever happens.

  Both are cheap to catch at boot, where a refusal to start is unmissable.
*/
if (env.NODE_ENV === 'production') {
  if (env.MAIL_TRANSPORT === 'console') {
    throw new Error(
      'MAIL_TRANSPORT must be "plunk", "cloudflare" or "ses" in production; "console" only logs the email.',
    );
  }
  if (!env.MAIL_FROM_ADDRESS) {
    throw new Error('MAIL_FROM_ADDRESS is required in production.');
  }
  if (env.MAIL_TRANSPORT === 'plunk' && !env.PLUNK_API_KEY) {
    throw new Error('PLUNK_API_KEY is required when MAIL_TRANSPORT is "plunk".');
  }
  if (
    env.MAIL_TRANSPORT === 'cloudflare' &&
    (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_EMAIL_API_TOKEN)
  ) {
    throw new Error(
      'CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_EMAIL_API_TOKEN are required when MAIL_TRANSPORT is "cloudflare".',
    );
  }
  if (env.MAIL_TRANSPORT === 'ses' && !env.AWS_SES_REGION) {
    throw new Error('AWS_SES_REGION is required when MAIL_TRANSPORT is "ses".');
  }
}

export type Env = typeof env;
