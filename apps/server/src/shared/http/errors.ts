import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** Throw from anywhere in a handler; the error middleware renders the JSON body. */
export function httpError(
  status: ContentfulStatusCode,
  message: string,
  code?: string,
  extra?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  return new HTTPException(status, {
    res: Response.json(
      { error: { code: code ?? statusCode(status), message, ...extra } },
      { status, ...(headers ? { headers } : {}) },
    ),
  });
}

export const notFound = (what = 'Resource') => httpError(404, `${what} not found.`, 'not_found');
export const unauthorized = () => httpError(401, 'Authentication required.', 'unauthorized');
export const forbidden = (message = 'You do not have access to this.') =>
  httpError(403, message, 'forbidden');
export const conflict = (message: string) => httpError(409, message, 'conflict');
export const tooManyRequests = (retryAfterSeconds: number) =>
  httpError(
    429,
    'Too many attempts. Try again shortly.',
    'rate_limited',
    { retryAfter: retryAfterSeconds },
    { 'Retry-After': String(retryAfterSeconds) },
  );

function statusCode(status: number): string {
  if (status === 400) return 'bad_request';
  if (status === 422) return 'unprocessable_entity';
  if (status >= 500) return 'internal_error';
  return 'error';
}
