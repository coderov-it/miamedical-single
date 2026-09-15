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

  /**
   * The site's own policies, one page each. Not `/terms`: that is the pool of
   * rental and warranty conditions a PRODUCT links to.
   */
  privacyPolicy: '/legal/privacy-policy',

  /**
   * The notification inbox — what the back office has to say to YOU. Reached
   * from the sidebar and from the bell in the topbar.
   *
   * Not to be confused with `settings`, which is where alert-EMAIL recipients
   * are chosen. Those two both used to be called "Notifications" and sat one
   * above the other in the sidebar, which read as one feature with two pages.
   */
  notifications: '/notifications',

  /** Operator-editable platform settings, one section per decision. */
  settings: '/settings',

  /** Back-office accounts and what each of them may reach. */
  adminUsers: '/access',

  /**
   * Your own account. Reached by clicking your name in the sidebar footer and
   * deliberately absent from `nav.ts` — it is not a section of the back office,
   * it is the operator looking at themselves.
   */
  profile: '/profile',

  login: '/login',
} as const;

export const routePatterns = {
  productDetail: '/products/:id',
  orderDetail: '/orders/:id',
  contractDetail: '/contracts/:id',
  blogDetail: '/blog/:id',
} as const;
