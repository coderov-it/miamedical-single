import { createHash, randomBytes } from 'node:crypto';

import type { ContractStatus } from '@mia/validators';

/** A signing link lives this long; resend or mint a new link after that. */
const TOKEN_EXPIRY_DAYS = 30;

/** Tokens are stored as their SHA-256 — a leaked table signs nothing. */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  return { raw, hash: hashToken(raw) };
}

export function tokenExpiry(): Date {
  return new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

export type SigningRefusal = 'signed' | 'voided' | 'used' | 'expired';

/**
 * Why a token may not sign, or null when it may. The contract's state comes
 * first: a link to a signed contract says "already signed", which is the fact
 * the customer needs, rather than "link used".
 */
export function signingRefusal(
  token: { consumedAt: Date | null; expiresAt: Date },
  status: ContractStatus,
  now: Date,
): SigningRefusal | null {
  if (status === 'signed') return 'signed';
  if (status === 'voided') return 'voided';
  if (token.consumedAt) return 'used';
  if (token.expiresAt <= now) return 'expired';
  return null;
}
