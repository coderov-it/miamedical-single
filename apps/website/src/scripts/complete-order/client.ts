/**
 * The browser's calls to `/api/order-links`. The token rides in the query, never in a body,
 * and every failure is one `LinkError` the steps read the same way: a status, the server's
 * 410 `reason`, the `fields` of a 409/422 and the 409's `step`. The server's message is
 * English whatever the page's language, so it is never shown, only these facts are.
 */
import { pageLanguage } from '../locale';
import type { DetailsBody, GoneReason, LinkSummary, PaymentStart } from './types.ts';

export class LinkError extends Error {
  constructor(
    readonly status: number,
    readonly reason: GoneReason | null,
    readonly fields: Record<string, string>,
    readonly step: string | null,
  ) {
    super(`order link request failed (${status})`);
  }
}

export interface LinkClient {
  summary: () => Promise<LinkSummary>;
  saveDetails: (body: DetailsBody) => Promise<LinkSummary>;
  previewContract: () => Promise<{ html: string; total: string }>;
  sign: (signatureDataUrl: string, expectedTotal: string) => Promise<void>;
  pay: () => Promise<PaymentStart>;
}

export function createLinkClient(apiBase: string, token: string): LinkClient {
  const query = `?${new URLSearchParams({ token })}`;

  async function call<T>(path: string, method: string, body?: unknown): Promise<T> {
    const response = await fetch(`${apiBase}/api/order-links${path}${query}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw await toError(response);
    return ((await response.json()) as { data: T }).data;
  }

  return {
    summary: () => call('', 'GET'),
    saveDetails: (body) => call('/details', 'PUT', body),
    previewContract: () => call('/contract-preview', 'POST'),
    sign: async (signatureDataUrl, expectedTotal) => {
      await call('/sign', 'POST', { signatureDataUrl, consent: true, expectedTotal });
    },
    pay: () => call('/payment', 'POST', { language: pageLanguage() }),
  };
}

async function toError(response: Response): Promise<LinkError> {
  let error: { reason?: GoneReason; fields?: Record<string, string>; step?: string } = {};
  try {
    error = ((await response.json()) as { error?: typeof error }).error ?? {};
  } catch {
    /* A body that is not JSON carries nothing beyond its status. */
  }
  return new LinkError(
    response.status,
    error.reason ?? null,
    error.fields ?? {},
    error.step ?? null,
  );
}
