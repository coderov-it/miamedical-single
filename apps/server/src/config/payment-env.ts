import * as v from 'valibot';

import { env } from './env.ts';

/**
 * The payment gateway's environment variables, parsed apart from `env.ts` so
 * that file stays one screen of shared settings. Same rule: a typo fails at
 * boot naming the variable.
 *
 *   PAYMENT_PROVIDER=none                   → orders are placed unpaid, nobody is charged
 *   PAYMENT_PROVIDER=nexi, NEXI_API_KEY set → checkout sends the customer to Nexi
 *   PAYMENT_PROVIDER=nexi, key unset        → refuse to start
 *   production with PAYMENT_PROVIDER=none   → refuse to start
 *
 * `NEXI_ENVIRONMENT=sandbox` is Nexi's test host, which accepts the public test
 * keys and test cards from developer.nexi.it.
 */
const PaymentEnvSchema = v.object({
  PAYMENT_PROVIDER: v.optional(v.picklist(['none', 'nexi']), 'none'),
  NEXI_API_KEY: v.optional(v.string()),
  NEXI_ENVIRONMENT: v.optional(v.picklist(['sandbox', 'production']), 'sandbox'),
  /**
   * Where the gateway posts its notification. The same variable the website and
   * admin call the API with; Nexi needs it absolute.
   */
  PUBLIC_API_URL: v.pipe(
    v.optional(v.string(), 'http://localhost:8787'),
    v.transform((value) => value.replace(/\/+$/, '')),
  ),
});

const parsed = v.safeParse(PaymentEnvSchema, process.env);

if (!parsed.success) {
  const issues = parsed.issues
    .map((issue) => `  - ${v.getDotPath(issue) ?? '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid payment configuration:\n${issues}`);
}

export const paymentEnv = parsed.output;

if (paymentEnv.PAYMENT_PROVIDER === 'nexi' && !paymentEnv.NEXI_API_KEY) {
  throw new Error('NEXI_API_KEY is required when PAYMENT_PROVIDER is "nexi".');
}
if (env.NODE_ENV === 'production') {
  if (paymentEnv.PAYMENT_PROVIDER === 'none') {
    throw new Error(
      'PAYMENT_PROVIDER must be "nexi" in production; "none" places orders nobody pays for.',
    );
  }
  if (!/^https:\/\//.test(paymentEnv.PUBLIC_API_URL)) {
    throw new Error(
      `PUBLIC_API_URL must be a public https origin in production; got "${paymentEnv.PUBLIC_API_URL}".`,
    );
  }
}
