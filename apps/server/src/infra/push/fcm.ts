import { createSign } from 'node:crypto';

import { env } from '../../config/env.ts';
import { EXTERNAL_APIS } from '../../config/external-apis.ts';
import type { PushAlert, PushMessage, PushResult, PushSender } from './port.ts';

/**
 * Firebase Cloud Messaging, HTTP v1. One POST, no SDK — the same shape as
 * `infra/mail/plunk.ts`.
 *
 * Both platforms go through here. Android is FCM natively; iOS is APNs, which
 * Firebase relays to once an APNs `.p8` key is uploaded to the project. That
 * relay is why this file has no Apple credentials in it and why there is one
 * sender rather than two.
 *
 * The legacy `fcm.googleapis.com/fcm/send` endpoint with a server key is gone —
 * Google decommissioned it. v1 authenticates with a short-lived OAuth2 token
 * minted from a service account, which is the only reason there is any crypto
 * here.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const TIMEOUT_MS = 10_000;

/** Re-mint a minute early: a token that expires mid-flight fails the send, not the refresh. */
const EXPIRY_SKEW_MS = 60_000;

interface CachedToken {
  value: string;
  expiresAt: number;
}

interface FcmErrorBody {
  error?: {
    status?: string;
    message?: string;
    details?: { '@type'?: string; errorCode?: string }[];
  };
}

/**
 * The two codes that mean "this token will never work again". Everything else —
 * a quota, a 503, a malformed payload — is either transient or our bug, and in
 * both cases deleting the customer's device row would be the wrong repair.
 *
 * `UNREGISTERED` is the app being uninstalled or the OS retiring the token.
 * `INVALID_ARGUMENT` on a send is almost always a token that was never valid,
 * which is what a truncated or hand-pasted value looks like.
 */
const DEAD_TOKEN_CODES = new Set(['UNREGISTERED', 'INVALID_ARGUMENT']);

export class FcmPushSender implements PushSender {
  /**
   * Process-wide, and deliberately not a per-request mint. A service-account
   * token is good for an hour; minting one per notification would add an RSA
   * signature and a round trip to Google in front of every push, and would be
   * indistinguishable from a working system until the day a burst of orders made
   * the token endpoint the bottleneck.
   */
  #token: CachedToken | null = null;

  /** In-flight mint, so a burst of sends produces one token request rather than N. */
  #minting: Promise<string> | null = null;

  async send(message: PushMessage): Promise<PushResult> {
    const projectId = env.FCM_PROJECT_ID;
    const clientEmail = env.FCM_CLIENT_EMAIL;
    const privateKey = env.FCM_PRIVATE_KEY;

    /* Checked here rather than at boot, following `R2FileUploader` in
       `@mia/media`: a missing push credential disables push and leaves the rest
       of the API serving, and the failure names itself on first send. */
    if (!projectId || !clientEmail || !privateKey) {
      return {
        ok: false,
        deadToken: false,
        reason: 'FCM_PROJECT_ID, FCM_CLIENT_EMAIL and FCM_PRIVATE_KEY must all be set.',
      };
    }

    let accessToken: string;
    try {
      accessToken = await this.#accessToken(clientEmail, privateKey);
    } catch (error) {
      return { ok: false, deadToken: false, reason: `OAuth token mint failed: ${String(error)}` };
    }

    const response = await fetch(
      `${EXTERNAL_APIS.fcmBaseUrl}/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ message: buildPayload(message) }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    if (response.ok) return { ok: true };

    const body = (await response.json().catch(() => ({}))) as FcmErrorBody;
    const code =
      body.error?.details?.find((detail) => detail.errorCode)?.errorCode ??
      body.error?.status ??
      String(response.status);

    return {
      ok: false,
      deadToken: DEAD_TOKEN_CODES.has(code),
      reason: `${code}: ${body.error?.message ?? response.statusText}`,
    };
  }

  async #accessToken(clientEmail: string, privateKey: string): Promise<string> {
    const cached = this.#token;
    if (cached && cached.expiresAt - EXPIRY_SKEW_MS > Date.now()) return cached.value;
    if (this.#minting) return this.#minting;

    this.#minting = this.#mint(clientEmail, privateKey).finally(() => {
      this.#minting = null;
    });
    return this.#minting;
  }

  async #mint(clientEmail: string, privateKey: string): Promise<string> {
    const assertion = signJwt(clientEmail, privateKey);

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const body = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      error_description?: string;
    };

    if (!response.ok || !body.access_token) {
      /* Never interpolate the key or the assertion — this message reaches logs. */
      throw new Error(body.error_description ?? `token endpoint returned ${response.status}`);
    }

    this.#token = {
      value: body.access_token,
      expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
    };
    return body.access_token;
  }
}

/**
 * A signed JWT is all Google's token endpoint wants, and `node:crypto` signs one
 * in ten lines — which is why there is no `google-auth-library` here. The
 * dependency exists to handle credential discovery across GCE metadata, gcloud
 * CLI and workload identity; we have one service account in the environment and
 * need none of that.
 */
function signJwt(clientEmail: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );

  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  /* A private key pasted into a .env arrives with literal backslash-n rather
     than newlines, and PEM parsing fails on it with an error that names neither
     the variable nor the cause. */
  const signature = signer.sign(privateKey.replace(/\\n/g, '\n'), 'base64url');

  return `${header}.${claims}.${signature}`;
}

function base64url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

/**
 * Our shape into FCM's.
 *
 * Localization keys live ONLY in the platform blocks — the common `notification`
 * object has no `*_loc_key` field — and the two platforms spell every one of them
 * differently: Android takes `title_loc_key`/`body_loc_key`/`body_loc_args`,
 * APNs takes `title-loc-key`/`loc-key`/`loc-args`, where the unprefixed pair is
 * the body. Sending the Android spelling to APNs is silently ignored rather than
 * rejected, so a message would arrive blank.
 */
function buildPayload(message: PushMessage) {
  return {
    token: message.token,
    data: message.data,
    android: {
      /* These are not background syncs — every one of them is something the
         customer is waiting on, and normal priority lets Android hold it until
         the device next wakes. */
      priority: 'high',
      notification: androidAlert(message.alert),
    },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: { aps: { sound: 'default', alert: apnsAlert(message.alert) } },
    },
  };
}

function androidAlert(alert: PushAlert) {
  if (alert.kind === 'rendered') return { title: alert.title, body: alert.body };
  return {
    title_loc_key: alert.titleKey,
    body_loc_key: alert.bodyKey,
    body_loc_args: alert.bodyArgs,
  };
}

function apnsAlert(alert: PushAlert) {
  if (alert.kind === 'rendered') return { title: alert.title, body: alert.body };
  return {
    'title-loc-key': alert.titleKey,
    'loc-key': alert.bodyKey,
    'loc-args': alert.bodyArgs,
  };
}
