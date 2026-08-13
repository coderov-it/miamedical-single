/**
 * The static permission catalog.
 *
 * A permission **is** its number. `users.permissions` stores `int[]`, and every
 * runtime check compares integers — the `key` and `label` exist so a human can
 * read and assign permissions in the admin UI, never so code can decode one.
 *
 * Rules for editing this file:
 *
 * 1. **A code is permanent.** Never renumber a permission and never reuse a
 *    retired code — rows in the database already hold the old number.
 * 2. **One block of 100 per capability area.** Within a block:
 *    `+0` read · `+1` update · `+2` create · `+3` delete · `+10…` area-specific.
 * 3. Retiring a permission means deleting the entry and leaving its code unused
 *    forever. Stale codes on existing users are dropped by
 *    `normalizePermissions`, so no cleanup migration is required.
 *
 * | Block | Area                        |
 * | ----- | --------------------------- |
 * | 1000  | General / dashboard         |
 * | 1100  | Orders                      |
 * | 1200  | Products                    |
 * | 1300  | Categories                  |
 * | 1400  | Media                       |
 * | 1500  | Customers                   |
 * | 1600  | Settings                    |
 * | 1700  | Access control (admin users)|
 * | 1800  | Content (terms documents)   |
 * | 1900  | Attributes (preset library) |
 * | 2000  | Delivery zones              |
 */

export interface PermissionDefinition {
  /** Stored in the database and compared at runtime. Immutable once shipped. */
  readonly code: number;
  /** Stable machine-readable name. Display and tooling only. */
  readonly key: string;
  /** Human label for the admin UI. */
  readonly label: string;
  /** UI grouping. */
  readonly group: PermissionGroup;
}

export const PERMISSION_GROUPS = [
  'General',
  'Orders',
  'Products',
  'Categories',
  'Media',
  'Customers',
  'Settings',
  'Access',
  'Content',
  'Attributes',
  'Delivery',
] as const;

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

export const PERMISSION_DEFINITIONS = {
  // --- 1000 · general ------------------------------------------------------
  DASHBOARD_READ: { code: 1000, key: 'dashboard:read', label: 'View dashboard', group: 'General' },

  // --- 1100 · orders -------------------------------------------------------
  ORDER_READ: { code: 1100, key: 'order:read', label: 'View orders', group: 'Orders' },
  ORDER_UPDATE: { code: 1101, key: 'order:update', label: 'Update orders', group: 'Orders' },
  ORDER_CREATE: { code: 1102, key: 'order:create', label: 'Create orders', group: 'Orders' },
  ORDER_DELETE: { code: 1103, key: 'order:delete', label: 'Delete orders', group: 'Orders' },
  ORDER_FULFIL: { code: 1110, key: 'order:fulfil', label: 'Fulfil orders', group: 'Orders' },
  ORDER_REFUND: { code: 1111, key: 'order:refund', label: 'Refund orders', group: 'Orders' },
  ORDER_EXPORT: { code: 1112, key: 'order:export', label: 'Export orders', group: 'Orders' },
  ORDER_DISPUTE_READ: {
    code: 1113,
    key: 'order:dispute:read',
    label: 'View disputed orders',
    group: 'Orders',
  },
  ORDER_DISPUTE_UPDATE: {
    code: 1114,
    key: 'order:dispute:update',
    label: 'Resolve disputed orders',
    group: 'Orders',
  },

  // --- 1200 · products -----------------------------------------------------
  PRODUCT_READ: { code: 1200, key: 'product:read', label: 'View products', group: 'Products' },
  PRODUCT_UPDATE: {
    code: 1201,
    key: 'product:update',
    label: 'Update products',
    group: 'Products',
  },
  PRODUCT_CREATE: {
    code: 1202,
    key: 'product:create',
    label: 'Create products',
    group: 'Products',
  },
  PRODUCT_DELETE: {
    code: 1203,
    key: 'product:delete',
    label: 'Delete products',
    group: 'Products',
  },
  PRODUCT_PUBLISH: {
    code: 1210,
    key: 'product:publish',
    label: 'Publish and archive products',
    group: 'Products',
  },
  PRODUCT_PRICE: {
    code: 1211,
    key: 'product:price',
    label: 'Change product pricing',
    group: 'Products',
  },
  PRODUCT_STOCK: {
    code: 1212,
    key: 'product:stock',
    label: 'Adjust stock levels',
    group: 'Products',
  },

  // --- 1300 · categories ---------------------------------------------------
  CATEGORY_READ: {
    code: 1300,
    key: 'category:read',
    label: 'View categories',
    group: 'Categories',
  },
  CATEGORY_UPDATE: {
    code: 1301,
    key: 'category:update',
    label: 'Update categories',
    group: 'Categories',
  },
  CATEGORY_CREATE: {
    code: 1302,
    key: 'category:create',
    label: 'Create categories',
    group: 'Categories',
  },
  CATEGORY_DELETE: {
    code: 1303,
    key: 'category:delete',
    label: 'Delete categories',
    group: 'Categories',
  },

  // --- 1400 · media --------------------------------------------------------
  MEDIA_READ: { code: 1400, key: 'media:read', label: 'View media library', group: 'Media' },
  MEDIA_UPLOAD: { code: 1402, key: 'media:upload', label: 'Upload media', group: 'Media' },
  MEDIA_DELETE: { code: 1403, key: 'media:delete', label: 'Delete media', group: 'Media' },

  // --- 1500 · customers ----------------------------------------------------
  CUSTOMER_READ: {
    code: 1500,
    key: 'customer:read',
    label: 'View customer details',
    group: 'Customers',
  },
  CUSTOMER_UPDATE: {
    code: 1501,
    key: 'customer:update',
    label: 'Update customer details',
    group: 'Customers',
  },
  CUSTOMER_EXPORT: {
    code: 1512,
    key: 'customer:export',
    label: 'Export customer data',
    group: 'Customers',
  },

  // --- 1600 · settings -----------------------------------------------------
  SETTING_READ: { code: 1600, key: 'setting:read', label: 'View settings', group: 'Settings' },
  SETTING_UPDATE: {
    code: 1601,
    key: 'setting:update',
    label: 'Update settings',
    group: 'Settings',
  },

  // --- 1700 · access control ----------------------------------------------
  ADMIN_READ: { code: 1700, key: 'admin:read', label: 'View admin users', group: 'Access' },
  ADMIN_UPDATE: { code: 1701, key: 'admin:update', label: 'Update admin users', group: 'Access' },
  ADMIN_CREATE: { code: 1702, key: 'admin:create', label: 'Create admin users', group: 'Access' },
  ADMIN_DELETE: { code: 1703, key: 'admin:delete', label: 'Delete admin users', group: 'Access' },
  ADMIN_PERMISSION_ASSIGN: {
    code: 1710,
    key: 'admin:permission_assign',
    label: 'Assign permissions to admin users',
    group: 'Access',
  },

  // --- 1800 · content (terms documents) ------------------------------------
  TERMS_READ: { code: 1800, key: 'terms:read', label: 'View terms documents', group: 'Content' },
  TERMS_UPDATE: {
    code: 1801,
    key: 'terms:update',
    label: 'Update terms documents',
    group: 'Content',
  },
  TERMS_CREATE: {
    code: 1802,
    key: 'terms:create',
    label: 'Create terms documents',
    group: 'Content',
  },
  TERMS_DELETE: {
    code: 1803,
    key: 'terms:delete',
    label: 'Delete terms documents',
    group: 'Content',
  },
  TERMS_PUBLISH: {
    code: 1810,
    key: 'terms:publish',
    label: 'Publish and archive terms documents',
    group: 'Content',
  },

  // --- 1900 · attributes (variant preset library) ---------------------------
  ATTRIBUTE_READ: {
    code: 1900,
    key: 'attribute:read',
    label: 'View attribute presets',
    group: 'Attributes',
  },
  ATTRIBUTE_UPDATE: {
    code: 1901,
    key: 'attribute:update',
    label: 'Update attribute presets',
    group: 'Attributes',
  },
  ATTRIBUTE_CREATE: {
    code: 1902,
    key: 'attribute:create',
    label: 'Create attribute presets',
    group: 'Attributes',
  },
  ATTRIBUTE_DELETE: {
    code: 1903,
    key: 'attribute:delete',
    label: 'Delete attribute presets',
    group: 'Attributes',
  },

  // --- 2000 · delivery zones ----------------------------------------------
  // The price tree is money the customer is charged, so writing it is separated
  // from reading it: an operator who checks coverage need not be able to reprice.
  DELIVERY_ZONE_READ: {
    code: 2000,
    key: 'delivery_zone:read',
    label: 'View delivery zones',
    group: 'Delivery',
  },
  DELIVERY_ZONE_UPDATE: {
    code: 2001,
    key: 'delivery_zone:update',
    label: 'Update delivery zones',
    group: 'Delivery',
  },
  DELIVERY_ZONE_CREATE: {
    code: 2002,
    key: 'delivery_zone:create',
    label: 'Create delivery zones',
    group: 'Delivery',
  },
  DELIVERY_ZONE_DELETE: {
    code: 2003,
    key: 'delivery_zone:delete',
    label: 'Delete delivery zones',
    group: 'Delivery',
  },
} as const satisfies Record<string, PermissionDefinition>;

export type PermissionName = keyof typeof PERMISSION_DEFINITIONS;
export type PermissionCode = (typeof PERMISSION_DEFINITIONS)[PermissionName]['code'];
export type PermissionKey = (typeof PERMISSION_DEFINITIONS)[PermissionName]['key'];

/**
 * The codes, as literal types: `P.ORDER_UPDATE === 1101`.
 *
 * This is what call sites use — `requirePermission(P.ORDER_UPDATE)` reads like
 * a string permission but compiles down to the integer that is compared.
 */
export const P = Object.fromEntries(
  Object.entries(PERMISSION_DEFINITIONS).map(([name, definition]) => [name, definition.code]),
) as { readonly [K in PermissionName]: (typeof PERMISSION_DEFINITIONS)[K]['code'] };

export const PERMISSION_LIST: readonly PermissionDefinition[] =
  Object.values(PERMISSION_DEFINITIONS);

const BY_CODE: ReadonlyMap<number, PermissionDefinition> = new Map(
  PERMISSION_LIST.map((definition) => [definition.code, definition]),
);

// A duplicated code or key would silently grant the wrong capability, so the
// catalog validates itself once at import rather than failing in production.
if (
  BY_CODE.size !== PERMISSION_LIST.length ||
  new Set(PERMISSION_LIST.map((d) => d.key)).size !== PERMISSION_LIST.length
) {
  throw new Error('Permission catalog contains duplicate codes or keys.');
}

/** Definition for a stored code, or `undefined` if the code was retired. */
export function permissionByCode(code: number): PermissionDefinition | undefined {
  return BY_CODE.get(code);
}

export function isPermissionCode(code: number): code is PermissionCode {
  return BY_CODE.has(code);
}

/**
 * Cleans a list coming from a client or an old database row: drops unknown and
 * retired codes, removes duplicates, sorts. Always run this before persisting.
 */
export function normalizePermissions(codes: readonly number[]): number[] {
  return [...new Set(codes.filter(isPermissionCode))].sort((a, b) => a - b);
}

/** Catalog grouped for the permission picker, in a stable display order. */
export function permissionsByGroup(): Array<{
  group: PermissionGroup;
  permissions: PermissionDefinition[];
}> {
  return PERMISSION_GROUPS.map((group) => ({
    group,
    permissions: PERMISSION_LIST.filter((definition) => definition.group === group),
  })).filter((entry) => entry.permissions.length > 0);
}
