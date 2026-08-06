import { vValidator } from '@hono/valibot-validator';
import type { ValidationTargets } from 'hono';
import * as v from 'valibot';

import { httpError } from './errors.ts';

type Schema = v.GenericSchema | v.GenericSchemaAsync;

/**
 * `vValidator` with a shared failure hook, so validation errors use the same
 * `{ error: { code, message, fields } }` envelope as everything else instead of
 * dumping Valibot's internal issue objects to the client.
 */
export function validate<T extends Schema, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) {
  return vValidator(target, schema, (result) => {
    if (result.success) return;

    const fields: Record<string, string> = {};
    for (const issue of result.issues) {
      const path = v.getDotPath(issue) ?? '_';
      fields[path] ??= issue.message;
    }

    throw httpError(422, `Invalid ${target}.`, 'validation_failed', { fields });
  });
}
