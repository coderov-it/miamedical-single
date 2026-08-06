import type { Database } from '@mia/db';
import type { PermissionSubject } from '@mia/permissions';

export type UserRole = 'customer' | 'staff' | 'admin' | 'super_admin';

/**
 * The authenticated caller, resolved once per request by `withSession`.
 * Implements `PermissionSubject`, so it can be handed straight to `can()`.
 */
export interface SessionUser extends PermissionSubject {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  /** Codes from `@mia/permissions`. Empty and ignored for `super_admin`. */
  permissions: number[];
}

/** Shared Hono generics. Every router is typed with this so `c.get()` is safe. */
export interface AppEnv {
  Variables: {
    db: Database;
    requestId: string;
    user: SessionUser | null;
  };
}
