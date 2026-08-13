import { API_BASE } from './api';
import { routes } from './routes';

/**
 * The storefront's side of customer authentication.
 *
 * Deliberately plain functions rather than a store: the account pages are separate
 * documents with their own inline scripts, and there is no shared client-side
 * lifetime for state to live in. Each page loads what it needs on boot.
 *
 * Every call is credentialed and cross-origin — the API is another host — so
 * `credentials: 'include'` is not optional anywhere in this file.
 */

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActivated: boolean;
  hasPassword: boolean;
}

export interface CustomerOrderSummary {
  number: string;
  status: string;
  paymentStatus: string;
  itemCount: number;
  total: string;
  currency: string;
  linkStatus: 'unverified' | 'confirmed';
  placedAt: string;
}

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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as {
    data?: T;
    error?: ApiFailure;
  } | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error ?? { code: 'unknown', message: 'Qualcosa è andato storto. Riprova.' },
    );
  }

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

export async function listOrders(): Promise<CustomerOrderSummary[]> {
  const response = await fetch(`${API_BASE}/api/customer/orders?page=1&perPage=50`, {
    credentials: 'include',
  });
  if (!response.ok) throw new ApiError(response.status, { code: 'unknown', message: 'Errore' });
  const payload = (await response.json()) as { data: CustomerOrderSummary[] };
  return payload.data;
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
 */
export function safeNext(raw: string | null, fallback: string = routes.account): string {
  if (!raw) return fallback;
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : fallback;
}

/** Reads `?token=` once, for the pages an emailed link lands on. */
export function tokenFromQuery(): string | null {
  return new URLSearchParams(window.location.search).get('token');
}

export function formatMoney(amount: string, currency = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(Number(amount));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(new Date(iso));
}

/** Italian labels for the states an order can be in. Data is Italian; code is not. */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'In lavorazione',
  paid: 'Pagato',
  fulfilled: 'Completato',
  cancelled: 'Annullato',
  refunded: 'Rimborsato',
};
