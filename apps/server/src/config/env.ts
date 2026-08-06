import * as v from 'valibot';

const EnvSchema = v.object({
  NODE_ENV: v.optional(v.picklist(['development', 'test', 'production']), 'development'),
  DATABASE_URL: v.pipe(v.string(), v.minLength(1, 'DATABASE_URL is required.')),
  API_PORT: v.pipe(
    v.optional(v.string(), '8787'),
    v.transform(Number),
    v.number(),
    v.integer(),
    v.minValue(1),
    v.maxValue(65535),
  ),
  API_HOST: v.optional(v.string(), '0.0.0.0'),
  CORS_ORIGINS: v.pipe(
    v.optional(v.string(), 'http://localhost:4321,http://localhost:5173'),
    v.transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  ),
  AUTH_SECRET: v.pipe(v.string(), v.minLength(16, 'AUTH_SECRET must be at least 16 characters.')),
});

const parsed = v.safeParse(EnvSchema, process.env);

if (!parsed.success) {
  const issues = parsed.issues
    .map((issue) => `  - ${v.getDotPath(issue) ?? '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.output;
export type Env = typeof env;
