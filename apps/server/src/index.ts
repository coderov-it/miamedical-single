import { serve } from '@hono/node-server';

import { app } from './app.ts';
import { env } from './config/env.ts';

const server = serve({ fetch: app.fetch, port: env.API_PORT, hostname: env.API_HOST }, (info) => {
  console.log(`▲ Server listening on http://${env.API_HOST}:${info.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
