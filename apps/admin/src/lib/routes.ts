/**
 * Every URL the admin knows about, in one place.
 *
 * The sidebar, the access table, the breadcrumb map and every `href` read from
 * here, so a path is never spelled twice. Detail routes come in two forms: a
 * builder for linking, and a pattern for matching — `routePatterns` is what
 * `route-access.ts` matches against, so a `:param` route can carry a different
 * permission from its list.
 */

export const routes = {
  dashboard: '/',

  products: '/products',
  productNew: '/products/new',
  productDetail: (id: string) => `/products/${id}`,

  categories: '/categories',
  attributes: '/attributes',
  terms: '/terms',

  orders: '/orders',
  orderDetail: (id: string) => `/orders/${id}`,
  /** The queue with a detail drawer open — deep-linkable and refresh-safe. */
  ordersWithDrawer: (id: string) => `/orders?order=${id}`,

  carts: '/carts',
  /** The delivery price tree: country → region → province → comune → comune+CAP. */
  deliveryZones: '/delivery-zones',

  login: '/login',
} as const;

export const routePatterns = {
  productDetail: '/products/:id',
  orderDetail: '/orders/:id',
} as const;
