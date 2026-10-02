import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { generateToken, hashToken, signingRefusal } from './token.ts';

/**
 * The signing link is spent only by a saved signature, so the refusal reasons
 * are what a customer reads when they open or submit a link that may not sign.
 * The contract's state outranks the token's: a link to a signed contract must
 * say "already signed", never just "link used".
 */
describe('signingRefusal', () => {
  const now = new Date('2026-10-02T10:00:00Z');
  const live = { consumedAt: null, expiresAt: new Date('2026-10-20T00:00:00Z') };

  it('lets an unspent, unexpired token sign from every pre-signature state', () => {
    assert.equal(signingRefusal(live, 'generated', now), null);
    assert.equal(signingRefusal(live, 'sent', now), null);
    assert.equal(signingRefusal(live, 'viewed', now), null);
  });

  it('reports a signed contract as signed, even through a spent token', () => {
    const spent = { ...live, consumedAt: new Date('2026-10-01T09:00:00Z') };
    assert.equal(signingRefusal(spent, 'signed', now), 'signed');
    assert.equal(signingRefusal(live, 'signed', now), 'signed');
  });

  it('reports a voided contract before the state of its token', () => {
    const expired = { ...live, expiresAt: new Date('2026-09-01T00:00:00Z') };
    assert.equal(signingRefusal(expired, 'voided', now), 'voided');
  });

  it('refuses a spent token on a still-open contract', () => {
    const spent = { ...live, consumedAt: new Date('2026-10-01T09:00:00Z') };
    assert.equal(signingRefusal(spent, 'viewed', now), 'used');
  });

  it('treats the expiry instant itself as expired', () => {
    assert.equal(signingRefusal({ consumedAt: null, expiresAt: now }, 'sent', now), 'expired');
  });
});

describe('generateToken', () => {
  it('stores only the hash of what it mails', () => {
    const token = generateToken();
    assert.equal(token.hash, hashToken(token.raw));
    assert.notEqual(token.hash, token.raw);
  });
});
