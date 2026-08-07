import { serve } from '@hono/node-server';

import { app } from './app.ts';
import { env } from './config/env.ts';
import { r2FileUploader } from './infra/storage/r2.ts';
import { startStagingSweep } from './modules/media/sweep.ts';

const server = serve({ fetch: app.fetch, port: env.API_PORT, hostname: env.API_HOST }, (info) => {
  console.log(`▲ Server listening on http://${env.API_HOST}:${info.port}`);
});

startStagingSweep(r2FileUploader);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
