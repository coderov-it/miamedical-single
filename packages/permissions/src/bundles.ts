import { P, isPermissionCode } from './catalog.ts';

/**
 * Named sets of permissions, so access can be granted a whole job at a time
 * instead of one checkbox at a time.
 *
 * A bundle is a **grant-time template, not a role.** Applying one copies its
 * codes into `admin_users.permissions` and is then forgotten: nothing at
 * runtime ever resolves a bundle, `can()` never sees one, and editing the list
 * below does not change what anybody currently holds. That is the whole point —
 * a role would put a second unit of access into a system whose only unit is the
 * integer code, and every guard would have to ask which one it was holding.
 *
 * So the rules for editing this file are much looser than for `catalog.ts`:
 * a bundle may be renamed, re-scoped or deleted freely, because no row anywhere
 * refers to it.
 *
 * Codes are referenced through `P` rather than spelled as literals — a bundle
 * is a set of the catalog's numbers, and this file must break at compile time
 * if one of them is retired.
 */
export interface PermissionBundle {
  /** Stable machine-readable name. Display and tooling only. */
  readonly key: string;
  /** Human label for the admin UI. */
  readonly label: string;
  /** One line naming the job this set is for, shown beside the label. */
  readonly description: string;
  readonly codes: readonly number[];
}

export const PERMISSION_BUNDLES: readonly PermissionBundle[] = [
  {
    key: 'read_only',
    label: 'Read only',
    // Deliberately without `admin:read`: who the operators are, and what each
    // of them can reach, is not part of "let them look around".
    description: 'Look at everything, change nothing.',
    codes: [
      P.DASHBOARD_READ,
      P.ORDER_READ,
      P.ORDER_DISPUTE_READ,
      P.PRODUCT_READ,
      P.CATEGORY_READ,
      P.ATTRIBUTE_READ,
      P.TERMS_READ,
      P.MEDIA_READ,
      P.CUSTOMER_READ,
      P.CONTRACT_READ,
      P.BLOG_READ,
      P.BLOG_CATEGORY_READ,
      P.SETTING_READ,
    ],
  },
  {
    key: 'order_desk',
    label: 'Order desk',
    // Refunds and deletions are absent on purpose: money leaving the business
    // and a vanished order are both decisions, not parts of running the queue.
    description: 'Run the order queue, draw up contracts, answer disputes.',
    codes: [
      P.DASHBOARD_READ,
      P.ORDER_READ,
      P.ORDER_CREATE,
      P.ORDER_UPDATE,
      P.ORDER_FULFIL,
      P.ORDER_EXPORT,
      P.ORDER_DISPUTE_READ,
      P.ORDER_DISPUTE_UPDATE,
      P.CONTRACT_READ,
      P.CONTRACT_CREATE,
      P.CONTRACT_UPDATE,
      P.CUSTOMER_READ,
      P.CUSTOMER_UPDATE,
      P.PRODUCT_READ,
    ],
  },
  {
    key: 'catalog_editor',
    label: 'Catalog editor',
    // No `product:price` and no deletes — what a product costs, and whether it
    // still exists, sit one grant further out than editing its content.
    description: 'Build and publish products, categories and attributes.',
    codes: [
      P.DASHBOARD_READ,
      P.PRODUCT_READ,
      P.PRODUCT_CREATE,
      P.PRODUCT_UPDATE,
      P.PRODUCT_PUBLISH,
      P.PRODUCT_STOCK,
      P.CATEGORY_READ,
      P.CATEGORY_CREATE,
      P.CATEGORY_UPDATE,
      P.ATTRIBUTE_READ,
      P.ATTRIBUTE_CREATE,
      P.ATTRIBUTE_UPDATE,
      P.TERMS_READ,
      P.TERMS_CREATE,
      P.TERMS_UPDATE,
      P.MEDIA_READ,
      P.MEDIA_UPLOAD,
    ],
  },
  {
    key: 'content_editor',
    label: 'Content editor',
    description: 'Write and publish blog posts.',
    codes: [
      P.DASHBOARD_READ,
      P.BLOG_READ,
      P.BLOG_CREATE,
      P.BLOG_UPDATE,
      P.BLOG_PUBLISH,
      P.BLOG_CATEGORY_READ,
      P.BLOG_CATEGORY_MANAGE,
      P.MEDIA_READ,
      P.MEDIA_UPLOAD,
      P.TERMS_READ,
    ],
  },
  {
    key: 'access_manager',
    label: 'Access manager',
    description: 'Create operators and decide what they can reach.',
    codes: [
      P.DASHBOARD_READ,
      P.ADMIN_READ,
      P.ADMIN_CREATE,
      P.ADMIN_UPDATE,
      P.ADMIN_DELETE,
      P.ADMIN_PERMISSION_ASSIGN,
    ],
  },
];

// A typo'd or retired code in a bundle would quietly grant one permission less
// than the label promises, which is the kind of thing nobody notices until an
// operator cannot do their job.
for (const bundle of PERMISSION_BUNDLES) {
  const unknown = bundle.codes.filter((code) => !isPermissionCode(code));
  if (unknown.length > 0) {
    throw new Error(
      `Permission bundle "${bundle.key}" holds unknown codes: ${unknown.join(', ')}.`,
    );
  }
}
if (new Set(PERMISSION_BUNDLES.map((bundle) => bundle.key)).size !== PERMISSION_BUNDLES.length) {
  throw new Error('Permission bundles contain duplicate keys.');
}

/**
 * How much of a bundle a selection already covers. `partial` is what makes a
 * bundle chip honest: "Order desk" being half-held is neither on nor off, and
 * rendering it as off would lose the operator's own edits on the next click.
 */
export function bundleCoverage(
  bundle: PermissionBundle,
  held: readonly number[],
): 'none' | 'partial' | 'full' {
  const set = new Set(held);
  const hits = bundle.codes.filter((code) => set.has(code)).length;
  if (hits === 0) return 'none';
  return hits === bundle.codes.length ? 'full' : 'partial';
}
