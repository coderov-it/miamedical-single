import { request } from './customer-session.ts';

/**
 * The three calls behind `/delete-profile/`. Server half and the reasoning:
 * apps/server/src/modules/account-deletion. Own module rather than more lines
 * in customer-session.ts, which is already past its size budget.
 *
 * `identifier` is whatever the customer typed — email or user id — and rides
 * along on every step, because no step hands back a session to replace it.
 */

const BASE = '/api/customer/account-deletion';

function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return request<T>(`${BASE}${path}`, { method: 'POST', body: JSON.stringify(body) });
}

/** Answers the same whether or not the identifier matches a profile. */
export function requestDeletionCode(identifier: string): Promise<{ message: string }> {
  return post('/request', { identifier });
}

/** Rejects with `invalid_code` when wrong or expired. Spends nothing. */
export function verifyDeletionCode(identifier: string, code: string): Promise<{ ok: boolean }> {
  return post('/verify', { identifier, code });
}

export function confirmDeletion(identifier: string, code: string): Promise<{ deleted: boolean }> {
  return post('/confirm', { identifier, code, acknowledged: true });
}
