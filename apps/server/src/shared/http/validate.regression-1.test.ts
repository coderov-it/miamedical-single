// Regression: SYS-005 — a NUL byte in a validated string reached Postgres and came back as a 500
// Found by /qa on 2026-10-04
// Report: ~/.gstack/projects/coderov-it-miamedical-single/qa-reports/run-20261004T080925Z/

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Hono } from 'hono';
import * as v from 'valibot';

import { validate } from './validate.ts';

const app = new Hono()
  .get('/search', validate('query', v.object({ q: v.optional(v.string()) })), (c) =>
    c.json({ q: c.req.valid('query').q ?? null }),
  )
  .post(
    '/verify',
    validate('json', v.object({ identifier: v.string(), tags: v.array(v.string()) })),
    (c) => c.json({ ok: true }),
  );

describe('validate — NUL bytes', () => {
  it('passes ordinary input through', async () => {
    const res = await app.request('/search?q=carrozzina');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { q: 'carrozzina' });
  });

  it('refuses a NUL byte in a query string with a 422 naming the field', async () => {
    const res = await app.request('/search?q=a%00b');
    assert.equal(res.status, 422);
    const body = (await res.json()) as { error: { code: string; fields: Record<string, string> } };
    assert.equal(body.error.code, 'validation_failed');
    assert.ok(body.error.fields.q);
  });

  it('refuses a NUL byte nested in a JSON body', async () => {
    const res = await app.request('/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier: 'ok@example.com', tags: ['fine', 'x\u0000y'] }),
    });
    assert.equal(res.status, 422);
    const body = (await res.json()) as { error: { fields: Record<string, string> } };
    assert.ok(body.error.fields['tags.1']);
  });
});
