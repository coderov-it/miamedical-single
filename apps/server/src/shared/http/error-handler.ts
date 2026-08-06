import type { ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { AppEnv } from './context.ts';

export const onError: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof HTTPException) {
    const res = err.getResponse();
    // `httpError()` builds its own JSON body; plain HTTPExceptions do not.
    if (res.headers.get('content-type')?.includes('application/json')) return res;
    return c.json({ error: { code: 'error', message: err.message } }, err.status);
  }

  console.error(`[${c.get('requestId')}] unhandled error`, err);

  const isProd = process.env.NODE_ENV === 'production';
  return c.json(
    {
      error: {
        code: 'internal_error',
        message: isProd ? 'Something went wrong.' : String(err),
        requestId: c.get('requestId'),
      },
    },
    500,
  );
};

export const onNotFound: NotFoundHandler<AppEnv> = (c) =>
  c.json(
    { error: { code: 'not_found', message: `No route for ${c.req.method} ${c.req.path}` } },
    404,
  );
