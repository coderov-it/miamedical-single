import { serve } from '@hono/node-server';

import { app } from './app.ts';
import { env } from './config/env.ts';
import { logFeatureSummary } from './config/features.ts';
import { r2FileUploader } from './infra/media.ts';
import { startStagingSweep } from './modules/media/sweep.ts';

const server = serve({ fetch: app.fetch, port: env.API_PORT, hostname: env.API_HOST }, (info) => {
  console.log(`▲ Server listening on http://${env.API_HOST}:${info.port}`);
  /* After the listening line, so the two are read together: what is running, and
     what it is running with. Optional features are silent when off by design. */
  logFeatureSummary();
});

startStagingSweep(r2FileUploader);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
