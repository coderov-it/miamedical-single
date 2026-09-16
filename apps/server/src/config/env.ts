import * as v from 'valibot';

const EnvSchema = v.object({
  NODE_ENV: v.optional(v.picklist(['development', 'test', 'production']), 'development'),
  DATABASE_URL: v.pipe(v.string(), v.minLength(1, 'DATABASE_URL is required.')),
  /**
   * Print every generated SQL statement. A debugging switch, not a dev-vs-prod
   * one — see the reasoning in `@mia/db`'s `client.ts`, which reads the same
   * variable so scripts and the server cannot disagree.
   *
   * Declared here so a typo fails at boot naming the variable, rather than
   * reading as `false` and leaving somebody wondering why their logs are quiet.
   */
  DRIZZLE_LOG: v.pipe(
    v.optional(v.picklist(['true', 'false']), 'false'),
    v.transform((value) => value === 'true'),
  ),
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
   * Automatic translation of catalogue copy. Exactly one provider is live, and
   * this picks it — `none` is the default because the feature is optional and
   * the admin hides the action when nothing is configured.
   *
   * `stub` prefixes the source text with a `[fr]`-style marker and translates
   * nothing; it exists so the dialog's confirmation, log and review steps are
   * testable before anyone buys a key. It is refused in production, where that
   * marker would become customer-visible copy.
   *
   * The key is optional like every credential group (R2, mail): the server
   * boots without it, and the guard below is what keeps `deepl` from being
   * selected and unconfigured at once.
   */
  TRANSLATION_PROVIDER: v.optional(v.picklist(['none', 'stub', 'deepl']), 'none'),
  DEEPL_API_KEY: v.optional(v.string()),

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

  /*
    Push notifications, to the mobile app only.

    `console` prints the message rather than sending it, and unlike MAIL_TRANSPORT
    it is NOT refused in production. The asymmetry is deliberate: mail carries
    magic links, so a console transport in production locks every customer out of
    their account, while push carries a nudge about a fact the in-app feed already
    records. A production deployment that has not finished its Firebase setup
    should keep serving, with the state named at boot by `logFeatureSummary()`.
  */
  PUSH_TRANSPORT: v.optional(v.picklist(['console', 'fcm']), 'console'),

  /*
    One Firebase service account, used for both platforms — iOS reaches APNs
    through Firebase's relay, so there are no Apple credentials here.

    All three come out of the service-account JSON downloaded from Firebase
    (project settings → service accounts). Optional as a group, following
    R2FileUploader in `@mia/media`: the server starts without them and the
    adapter fails on first send naming what is missing, so an unfinished push
    setup never keeps the rest of the API down.

    FCM_PRIVATE_KEY is a PEM block. A .env file cannot hold real newlines, so it
    is normally pasted with literal `\n` escapes — `infra/push/fcm.ts` converts
    them back, because PEM parsing otherwise fails with an error that names
    neither the variable nor the cause.
  */
  FCM_PROJECT_ID: v.optional(v.string()),
  FCM_CLIENT_EMAIL: v.optional(v.string()),
  FCM_PRIVATE_KEY: v.optional(v.string()),
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

/*
  Translation, guarded in every environment rather than only production: a
  provider selected without its credential resolves to "enabled but broken",
  which the admin would render as a button that fails on click. Refusing at boot
  keeps that state unreachable. The stub is a production refusal for the same
  reason the console mail transport is — its `[fr]` markers would be customer
  copy — while remaining the way to exercise the flow locally.
*/
if (env.TRANSLATION_PROVIDER === 'deepl' && !env.DEEPL_API_KEY) {
  throw new Error('DEEPL_API_KEY is required when TRANSLATION_PROVIDER is "deepl".');
}
if (env.NODE_ENV === 'production' && env.TRANSLATION_PROVIDER === 'stub') {
  throw new Error(
    'TRANSLATION_PROVIDER must be "none" or "deepl" in production; "stub" only returns placeholder text.',
  );
}

export type Env = typeof env;
