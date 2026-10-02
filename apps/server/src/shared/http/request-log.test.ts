import assert from 'node:assert/strict';
import { test } from 'node:test';

import { redactSecrets } from './request-log.ts';

test('redacts a signing token and keeps the rest of the line', () => {
  assert.equal(
    redactSecrets('--> POST /api/contracts/sign?token=3f9ce1&locale=it 200 12ms'),
    '--> POST /api/contracts/sign?token=[redacted]&locale=it 200 12ms',
  );
});

test('redacts a secret that is not the first parameter', () => {
  assert.equal(
    redactSecrets('<-- GET /reset?lang=en&token=abc'),
    '<-- GET /reset?lang=en&token=[redacted]',
  );
});

test('leaves lines without secrets untouched', () => {
  assert.equal(
    redactSecrets('<-- GET /api/products?page=2&q=token'),
    '<-- GET /api/products?page=2&q=token',
  );
});
