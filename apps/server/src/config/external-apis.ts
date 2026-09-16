/**
 * Every third-party HTTP host this server calls, in one place.
 *
 * A base URL is not configuration in the environment sense: it is not a secret,
 * and it does not differ between our own environments. What it does do is move
 * when a provider versions or rehosts its API, and a hostname buried inside an
 * adapter is the one that gets missed. Change it here and the adapter follows.
 *
 * Paths stay with their adapter. A path is part of the call's contract — which
 * fields go with it, what comes back — so lifting it out of the adapter would
 * split one request across two files and buy nothing.
 *
 * AWS is deliberately absent: the SES and S3 SDKs build their own endpoints from
 * the configured region, so there is no URL here for us to hold. R2 is the
 * exception only because Cloudflare's endpoint is account-scoped and has to be
 * assembled by hand.
 */
export const EXTERNAL_APIS = {
  /**
   * Plunk, transactional email.
   *
   * This is Plunk's current host. The older `api.useplunk.com` answers with a
   * different envelope (`emails` at the top level rather than under `data`), so
   * pointing back at it means revisiting `infra/mail/plunk.ts` too, not just
   * this line.
   */
  plunkBaseUrl: 'https://next-api.useplunk.com',

  /**
   * Cloudflare's REST API, version pinned in the path as Cloudflare pins it.
   *
   * Shared by anything account-scoped we call there — today only Email Sending.
   * R2 is not one of them: its host is per-account and S3-shaped, so it is
   * assembled by the adapter that needs it — `r2Endpoint` in `@mia/media`.
   */
  cloudflareApiBaseUrl: 'https://api.cloudflare.com/client/v4',

  /**
   * DeepL, automatic translation. This is the free-tier host; a Pro subscription
   * is served from `https://api.deepl.com` instead. Which one an account has is
   * fixed for that account, so switching is this line rather than an environment
   * variable nobody would remember to set.
   */
  deeplBaseUrl: 'https://api-free.deepl.com',

  /**
   * Firebase Cloud Messaging, HTTP v1 — the only push endpoint we call.
   *
   * The version lives in the path rather than here, because v1 replaced a
   * decommissioned legacy endpoint with a different auth model entirely (OAuth2
   * against a service account, not a static server key). A future v2 would be
   * the same kind of change, so pinning the version next to the call keeps that
   * visible in `infra/push/fcm.ts` rather than making it look like a hostname
   * swap.
   *
   * Google's OAuth token endpoint is deliberately not here: it is an identity
   * host rather than a product API, shared with anything else that ever mints a
   * Google token, and it sits beside the JWT assembly it belongs to.
   */
  fcmBaseUrl: 'https://fcm.googleapis.com',
} as const;
