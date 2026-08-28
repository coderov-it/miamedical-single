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
  terms: '/terms',

  orders: '/orders',
  orderDetail: (id: string) => `/orders/${id}`,
  /** The queue with a detail drawer open — deep-linkable and refresh-safe. */
  ordersWithDrawer: (id: string) => `/orders?order=${id}`,

  rentals: '/rentals',
  payments: '/payments',

  contracts: '/contracts',
  contractNew: '/contracts/new',
  contractDetail: (id: string) => `/contracts/${id}`,

  carts: '/carts',
  /** "I did not place this order" reports raised from an order email. */
  orderDisputes: '/order-disputes',
  blog: '/blog',
  blogNew: '/blog/new',
  blogDetail: (id: string) => `/blog/${id}`,
  blogCategories: '/blog/categories',

  /** Operator-editable platform settings. */
  notificationSettings: '/settings/notifications',

  /** Back-office accounts and what each of them may reach. */
  adminUsers: '/access',

  login: '/login',
} as const;

export const routePatterns = {
  productDetail: '/products/:id',
  orderDetail: '/orders/:id',
  contractDetail: '/contracts/:id',
  blogDetail: '/blog/:id',
} as const;
