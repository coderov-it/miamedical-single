import { logger } from 'hono/logger';

/**
 * Hono's request logger, minus the secrets that ride in query strings.
 *
 * The stock logger prints the whole URL, and an emailed link carries its bearer
 * secret in `?token=` — a contract signing link, a password reset, an email
 * verification. Anyone who can read the logs could open an unexpired link. The
 * value is replaced, the key stays, so the line still says which kind of link
 * was used:
 *
 *   <-- GET /api/contracts/sign?token=3f9c…e1     →  <-- GET /api/contracts/sign?token=[redacted]
 *   --> POST /api/contracts/sign?token=3f9c…e1 200 →  --> POST /api/contracts/sign?token=[redacted] 200
 *
 * The nginx access logs in `docs/nginx/` drop the query string for the same
 * reason.
 */
const SECRET_QUERY_VALUE = /([?&](?:token|code|secret|signature)=)[^&\s]*/gi;

export function redactSecrets(line: string): string {
  return line.replace(SECRET_QUERY_VALUE, '$1[redacted]');
}

export const requestLogger = logger((line, ...rest) => {
  console.log(redactSecrets(line), ...rest);
});
