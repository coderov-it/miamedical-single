import type { InferResponseType } from 'hono/client';

import { documentLocale } from '../scripts/locale.ts';
import type { api } from './api.ts';
import { API_BASE } from './api-base.ts';

/**
 * The storefront's side of customer authentication.
 *
 * Deliberately plain functions rather than a store: the account pages are separate
 * documents with their own inline scripts, and there is no shared client-side
 * lifetime for state to live in. Each page loads what it needs on boot.
 *
 * Every call is credentialed and cross-origin — the API is another host — so
 * `credentials: 'include'` is not optional anywhere in this file.
 *
 * ── Types are INFERRED, transport is raw `fetch` ────────────────────────────
 * The shapes below are read off the server's own router through
 * `InferResponseType`, the same way `lib/catalog.ts` reads the product
 * endpoints. `import type { api }` erases completely, so this costs the
 * browser nothing and the Hono client stays out of the bundle — see
 * `lib/api-base.ts` for why that matters here specifically.
 *
 * They used to be hand-written. Two of them happened to match; the third, an
 * inline `OrderDetail` in the order-detail page, had drifted and was missing
 * `paymentStatus`, `linkStatus`, `taxTotal` and `discountTotal`, declared four
 * optional address fields where the server sends eight required-or-null, and
 * dropped five of the six delivery fields. Nothing could have caught that,
 * because nothing connected the copy to the original.
 */

/** `GET /api/customer/auth/me` — also what login and token redemption answer. */
export type Customer = InferResponseType<typeof api.api.customer.auth.me.$get, 200>['data'];

type OrderListResponse = InferResponseType<typeof api.api.customer.orders.$get, 200>;

/** One row of `GET /api/customer/orders`. */
export type CustomerOrderSummary = OrderListResponse['data'][number];

/** `{ page, perPage, total }` — the envelope `listOrders` used to discard. */
export type OrderListMeta = OrderListResponse['meta'];

/** `GET /api/customer/orders/:number` — narrower than the admin's on purpose. */
export type CustomerOrderDetail = InferResponseType<
  (typeof api.api.customer.orders)[':number']['$get'],
  200
>['data'];

/** The `{ error: { code, message, fields? } }` envelope the API answers with. */
export interface ApiFailure {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string>;

  constructor(status: number, failure: ApiFailure) {
    super(failure.message);
    this.status = status;
    this.code = failure.code;
    this.fields = failure.fields ?? {};
  }
}

/**
 * The whole `{ data, meta? }` envelope, for the endpoints whose `meta` matters.
 * `request()` below is this with the envelope unwrapped — one fetch, one error
 * path, two shapes. Mirrors the admin's `unwrap` / `unwrapFull` pair.
 */
async function requestEnvelope<T>(path: string, init: RequestInit = {}): Promise<T | undefined> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (response.status === 204) return undefined;

  const payload = (await response.json().catch(() => null)) as (T & { error?: ApiFailure }) | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error ?? { code: 'unknown', message: 'Qualcosa è andato storto. Riprova.' },
    );
  }

  return payload ?? undefined;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const payload = await requestEnvelope<{ data?: T }>(path, init);
  return payload?.data as T;
}

/** `null` rather than throwing on 401 — being signed out is a normal state. */
export async function loadCustomer(): Promise<Customer | null> {
  try {
    return await request<Customer>('/api/customer/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export function login(email: string, password: string): Promise<Customer> {
  return request<Customer>('/api/customer/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<void> {
  return request<void>('/api/customer/auth/logout', { method: 'POST' });
}

/** Both of these answer identically whether or not the address is known. */
export function requestMagicLink(email: string): Promise<{ message: string }> {
  return request('/api/customer/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return request('/api/customer/auth/password-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Redeems an activation, magic-link or reset token. A password is optional — an
 * account may stay magic-link only, which is a supported end state, not a
 * half-finished one.
 */
export function redeemToken(token: string, password?: string): Promise<Customer> {
  return request<Customer>('/api/customer/auth/token/redeem', {
    method: 'POST',
    body: JSON.stringify(password ? { token, password, confirmPassword: password } : { token }),
  });
}

export function setPassword(input: {
  currentPassword?: string;
  newPassword: string;
}): Promise<{ ok: boolean }> {
  return request('/api/customer/auth/password', {
    method: 'POST',
    body: JSON.stringify({
      ...(input.currentPassword ? { currentPassword: input.currentPassword } : {}),
      newPassword: input.newPassword,
      confirmPassword: input.newPassword,
    }),
  });
}

export function updateProfile(input: {
  firstName: string;
  lastName: string;
  phone: string;
}): Promise<Customer> {
  return request<Customer>('/api/customer/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/**
 * The customer's orders, newest first.
 *
 * `meta` is returned rather than discarded. Nothing paginates yet — fifty is
 * far beyond any real customer's order count — but a caller can now see that
 * it has been truncated instead of silently showing fifty of sixty. Adding a
 * pager is a component change from here, with no plumbing.
 *
 * It also goes through `requestEnvelope` like everything else in this file.
 * It used to hand-roll its own fetch, which meant every failure — a 500, an
 * expired session, a dropped connection — arrived as the literal string
 * 'Errore', throwing away the message the API had already localised.
 */
export async function listOrders(
  page = 1,
  perPage = 50,
): Promise<{ rows: CustomerOrderSummary[]; meta: OrderListMeta }> {
  const query = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  const payload = await requestEnvelope<{ data: CustomerOrderSummary[]; meta: OrderListMeta }>(
    `/api/customer/orders?${query}`,
  );
  return { rows: payload?.data ?? [], meta: payload?.meta ?? { page, perPage, total: 0 } };
}

/** One order, by the number the customer was given. 404s when it is not theirs. */
export function getOrder(number: string): Promise<CustomerOrderDetail> {
  return request<CustomerOrderDetail>(`/api/customer/orders/${encodeURIComponent(number)}`);
}

export function confirmOrder(number: string): Promise<{ ok: boolean }> {
  return request(`/api/customer/orders/${encodeURIComponent(number)}/confirm`, {
    method: 'POST',
  });
}

export function rejectOrder(number: string): Promise<{ ok: boolean }> {
  return request(`/api/customer/orders/${encodeURIComponent(number)}/reject`, {
    method: 'POST',
  });
}

export function reportOrder(input: {
  token: string;
  reportedPhone: string;
  message: string;
}): Promise<{ id: string; message: string }> {
  return request('/api/order-disputes', { method: 'POST', body: JSON.stringify(input) });
}

/**
 * Where to go after signing in. Only same-site paths are honoured: an unchecked
 * `next` is an open redirect, and a sign-in page is exactly where one is worth
 * exploiting. Mirrors the guard the admin login uses.
 *
 * `fallback` is REQUIRED. It used to default to `routes.account` — the Italian
 * path — which quietly dropped an English or German reader onto the Italian
 * account page, and cost this module a runtime import of the whole route table
 * (and through it `lib/i18n.ts`) for a default nobody used. Callers pass their
 * own locale's path.
 */
export function safeNext(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : fallback;
}

/** Reads `?token=` once, for the pages an emailed link lands on. */
export function tokenFromQuery(): string | null {
  return new URLSearchParams(window.location.search).get('token');
}

/*
 * Both formatters read the page's own locale rather than a literal `'it-IT'`.
 * The account pages render their lists in the browser, so this is the only
 * place that knows which language the surrounding page is in — see
 * scripts/locale.ts.
 *
 * The order-status labels that used to live here are gone with them: they were
 * Italian-only, and they are now `account.status.*` in the message catalog,
 * shipped to these scripts by `<AccountCopy>` (lib/account-page.ts).
 */
export function formatMoney(amount: string, currency = 'EUR'): string {
  return new Intl.NumberFormat(documentLocale(), { style: 'currency', currency }).format(
    Number(amount),
  );
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(documentLocale(), { dateStyle: 'medium' }).format(new Date(iso));
}
