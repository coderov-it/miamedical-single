import type { Database } from '@mia/db';
import type { PermissionSubject } from '@mia/permissions';

/**
 * The authenticated back-office caller, resolved once per request by
 * `withSession`. Implements `PermissionSubject`, so it can be handed straight to
 * `can()`.
 *
 * No role: access is decided by `permissions` alone, with `isSuperuser` meaning
 * "every code". See `@mia/permissions`.
 */
export interface SessionUser extends PermissionSubject {
  id: string;
  email: string;
  fullName: string | null;
  /** True grants every code, including ones added to the catalog later. */
  isSuperuser: boolean;
  /** Codes from `@mia/permissions`. Ignored when `isSuperuser` is set. */
  permissions: number[];
}

/**
 * The authenticated storefront caller, resolved by `withCustomerSession`.
 *
 * Deliberately not a `SessionUser` with an empty permission set: a customer holds
 * no codes at all, and making them one type would mean every guard had to
 * remember which kind it was holding. Two context slots, two guards, no overlap.
 */
export interface SessionCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Null until they redeem an emailed link — see `modules/customer-auth`. */
  activatedAt: Date | null;
  /** Whether a password has been set; magic-link-only accounts have none. */
  hasPassword: boolean;
}

/** Shared Hono generics. Every router is typed with this so `c.get()` is safe. */
export interface AppEnv {
  Variables: {
    db: Database;
    requestId: string;
    user: SessionUser | null;
    customer: SessionCustomer | null;
  };
}
