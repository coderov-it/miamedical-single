import { vValidator } from '@hono/valibot-validator';
import type { ValidationTargets } from 'hono';
import * as v from 'valibot';

import { httpError } from './errors.ts';

type Schema = v.GenericSchema | v.GenericSchemaAsync;

/**
 * `vValidator` with a shared failure hook, so validation errors use the same
 * `{ error: { code, message, fields } }` envelope as everything else instead of
 * dumping Valibot's internal issue objects to the client.
 *
 * It also refuses a NUL byte in any string, at any depth. Postgres cannot store
 * one in a text column, so `?q=%00` used to pass every schema and come back from
 * the query as a 500 — with the SQL in the message, in development.
 */
export function validate<T extends Schema, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) {
  return vValidator(target, schema, (result) => {
    if (result.success) {
      const path = nulBytePath(result.output);
      if (!path) return;
      throw httpError(422, `Invalid ${target}.`, 'validation_failed', {
        fields: { [path]: 'Contains a character that is not allowed.' },
      });
    }

    const fields: Record<string, string> = {};
    for (const issue of result.issues) {
      const path = v.getDotPath(issue) ?? '_';
      fields[path] ??= issue.message;
    }

    throw httpError(422, `Invalid ${target}.`, 'validation_failed', { fields });
  });
}

/** Dot path of the first string holding a NUL byte, or null when there is none. */
function nulBytePath(value: unknown, path = ''): string | null {
  if (typeof value === 'string') return value.includes('\0') ? path || '_' : null;
  if (value === null || typeof value !== 'object') return null;
  for (const [key, item] of Object.entries(value)) {
    const hit = nulBytePath(item, path ? `${path}.${key}` : key);
    if (hit) return hit;
  }
  return null;
}
