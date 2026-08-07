/**
 * The one place responses are unwrapped. Every server error travels as
 * `{ error: { code, message, fields? } }` — this turns that envelope into a
 * typed `ApiError` so forms can feed `fields` straight into per-field hints
 * instead of discarding them.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** dot-path → first message, exactly as `validate()` builds it server-side. */
  readonly fields: Record<string, string>;

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
}

/** Unwrap `{ data }` from a typed RPC call, or throw `ApiError`. */
export async function unwrap<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorEnvelope | null;
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'error',
      body?.error?.message ?? `Request failed (${response.status}).`,
      body?.error?.fields ?? {},
    );
  }
  const body = (await response.json()) as { data: T };
  return body.data;
}

/** Variant for endpoints whose envelope carries more than `data`. */
export async function unwrapFull<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorEnvelope | null;
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'error',
      body?.error?.message ?? `Request failed (${response.status}).`,
      body?.error?.fields ?? {},
    );
  }
  return (await response.json()) as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}

export function errorFields(error: unknown): Record<string, string> {
  return error instanceof ApiError ? error.fields : {};
}
