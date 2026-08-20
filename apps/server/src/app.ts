import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';

import { env } from './config/env.ts';
import { db } from './infra/db/client.ts';
import { adminUserRoutes } from './modules/admin-users/routes.ts';
import { attributeAdminRoutes } from './modules/attributes/routes.ts';
import { authRoutes } from './modules/auth/routes.ts';
import { customerAccountRoutes } from './modules/customer-account/routes.ts';
import { customerAuthRoutes } from './modules/customer-auth/routes.ts';
import { emailPreviewRoutes } from './modules/email-preview/routes.ts';
import {
  orderDisputeAdminRoutes,
  orderDisputePublicRoutes,
} from './modules/order-disputes/routes.ts';
import { blogAdminRoutes, blogPublicRoutes } from './modules/blog/routes.ts';
import { contractAdminRoutes, contractPublicRoutes } from './modules/contracts/routes.ts';
import { settingsAdminRoutes } from './modules/settings/routes.ts';
import { categoryAdminRoutes, categoryPublicRoutes } from './modules/categories/routes.ts';
import { healthRoutes } from './modules/health/routes.ts';
import { mediaRoutes } from './modules/media/routes.ts';
import { cartAdminRoutes, orderAdminRoutes, orderPublicRoutes } from './modules/orders/routes.ts';
import { productAdminRoutes, productPublicRoutes } from './modules/products/routes.ts';
import { termsAdminRoutes, termsPublicRoutes } from './modules/terms/routes.ts';
import { withCustomerSession } from './shared/auth/customer-session.ts';
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
/* Storefront sessions resolve alongside back-office ones. Both middlewares
   short-circuit when their cookie is absent, so an anonymous request still costs
   no query — and a browser holding both cookies is a normal state, not a clash. */
app.use('/api/*', withCustomerSession);

/*
  Mounted on its own, ahead of the chain and outside `/api`, for three reasons: it
  serves HTML to a human rather than JSON to the RPC client, so it has nothing to
  contribute to `AppType`; it needs neither CORS, CSRF nor a session; and it must not
  exist in production, which a conditional cannot express inside a chained expression.
*/
if (env.NODE_ENV !== 'production') {
  app.route('/email-preview', emailPreviewRoutes);
  console.log('[email-preview] template gallery at /email-preview');
}

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
  .route('/api/orders', orderPublicRoutes)
  .route('/api/order-disputes', orderDisputePublicRoutes)
  .route('/api/customer/auth', customerAuthRoutes)
  .route('/api/customer', customerAccountRoutes)
  .route('/api/media', mediaRoutes)
  .route('/api/admin/products', productAdminRoutes)
  .route('/api/admin/categories', categoryAdminRoutes)
  .route('/api/admin/terms', termsAdminRoutes)
  .route('/api/admin/attributes', attributeAdminRoutes)
  .route('/api/admin/orders', orderAdminRoutes)
  .route('/api/admin/carts', cartAdminRoutes)
  .route('/api/admin/order-disputes', orderDisputeAdminRoutes)
  .route('/api/admin/settings', settingsAdminRoutes)
  .route('/api/admin/contracts', contractAdminRoutes)
  .route('/api/admin/blog', blogAdminRoutes)
  .route('/api/admin/users', adminUserRoutes)
  .route('/api/contracts', contractPublicRoutes)
  .route('/api/blog', blogPublicRoutes);

app.onError(onError);
app.notFound(onNotFound);

export type AppType = typeof routes;
export { app };
