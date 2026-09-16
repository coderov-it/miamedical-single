import { serve } from '@hono/node-server';

import { app } from './app.ts';
import { env } from './config/env.ts';
import { logFeatureSummary } from './config/features.ts';
import { db } from './infra/db/client.ts';
import { r2FileUploader } from './infra/media.ts';
import { startStagingSweep } from './modules/media/sweep.ts';
import * as notificationHub from './modules/notifications/hub.ts';
import { startNotificationSweep } from './modules/notifications/sweep.ts';
import { startPushSweep } from './modules/push/sweep.ts';

const server = serve({ fetch: app.fetch, port: env.API_PORT, hostname: env.API_HOST }, (info) => {
  console.log(`▲ Server listening on http://${env.API_HOST}:${info.port}`);
  /* After the listening line, so the two are read together: what is running, and
     what it is running with. Optional features are silent when off by design. */
  logFeatureSummary();
});

startStagingSweep(r2FileUploader);

/*
  The live feed's two halves. `hub.start()` opens the one LISTEN connection this
  process holds; the sweep raises the events no transaction ever will. Under pm2
  cluster mode every worker does both, and that is correct — Postgres fans the
  notification out to all of them, and the sweep's dedupe key makes a second
  worker's tick a no-op rather than a duplicate.
*/
const listener = await notificationHub.start(db);
startNotificationSweep(db);
/* The push retry tick. Separate from the sweep above because it is a delivery
   retry rather than a source of events — see modules/push/sweep.ts. */
startPushSweep(db);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    /* Unlisten first: the listener holds a connection outside the pool, and a
       process that exits without releasing it leaves the backend sitting in
       `idle` until Postgres times it out. */
    void listener.unlisten().finally(() => server.close(() => process.exit(0)));
  });
}
