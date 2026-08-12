import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';

import { env } from './config/env.ts';
import { db } from './infra/db/client.ts';
import { addressPublicRoutes } from './modules/address/routes.ts';
import { attributeAdminRoutes } from './modules/attributes/routes.ts';
import { authRoutes } from './modules/auth/routes.ts';
import { categoryAdminRoutes, categoryPublicRoutes } from './modules/categories/routes.ts';
import { deliveryPublicRoutes, deliveryZoneAdminRoutes } from './modules/delivery/routes.ts';
import { healthRoutes } from './modules/health/routes.ts';
import { mediaRoutes } from './modules/media/routes.ts';
import { cartAdminRoutes, orderAdminRoutes, orderPublicRoutes } from './modules/orders/routes.ts';
import { productAdminRoutes, productPublicRoutes } from './modules/products/routes.ts';
import { termsAdminRoutes, termsPublicRoutes } from './modules/terms/routes.ts';
import { withSession } from './shared/auth/session.ts';
import type { AppEnv } from './shared/http/context.ts';
import { onError, onNotFound } from './shared/http/error-handler.ts';

const app = new Hono<AppEnv>();

app.use('*', requestId());
app.use('*', secureHeaders());
app.use('*', logger());
app.use('*', async (c, next) => {
  c.set('db', db);
  await next();
});

app.use(
  '/api/*',
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);
app.use('/api/*', csrf({ origin: env.CORS_ORIGINS }));
app.use('/api/*', withSession);

/**
 * Module mounting. Chained `.route()` calls preserve the literal route types,
 * which is what makes the `hc<AppType>` RPC client on the frontends fully typed.
 */
const routes = app
  .route('/health', healthRoutes)
  .route('/api/auth', authRoutes)
  .route('/api/products', productPublicRoutes)
  .route('/api/categories', categoryPublicRoutes)
  .route('/api/terms', termsPublicRoutes)
  .route('/api/delivery', deliveryPublicRoutes)
  .route('/api/address', addressPublicRoutes)
  .route('/api/orders', orderPublicRoutes)
  .route('/api/media', mediaRoutes)
  .route('/api/admin/products', productAdminRoutes)
  .route('/api/admin/categories', categoryAdminRoutes)
  .route('/api/admin/terms', termsAdminRoutes)
  .route('/api/admin/attributes', attributeAdminRoutes)
  .route('/api/admin/orders', orderAdminRoutes)
  .route('/api/admin/carts', cartAdminRoutes)
  .route('/api/admin/delivery-zones', deliveryZoneAdminRoutes);

app.onError(onError);
app.notFound(onNotFound);

export type AppType = typeof routes;
export { app };
