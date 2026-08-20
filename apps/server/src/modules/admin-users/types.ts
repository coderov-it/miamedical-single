import type { PermissionSubject } from '@mia/permissions';
import type { adminUsers } from '@mia/db/schema';

/**
 * Back-office account administration — the write side of what `modules/auth`
 * only ever reads. Both touch `admin_users`; this one is the module that may
 * change who exists and what they hold.
 */
export type AdminUserRow = typeof adminUsers.$inferSelect;

export interface AdminUserListFilters {
  page: number;
  perPage: number;
  /** Matched against email and full name. */
  q?: string | undefined;
  status: 'all' | 'active' | 'disabled';
}

/**
 * The operator performing the change. Every policy in `service.ts` is a
 * statement about the relationship between this and the target row — "not
 * yourself", "not more than you hold" — which is why it is passed explicitly
 * rather than read from a request the service cannot see.
 */
export interface Actor extends PermissionSubject {
  readonly id: string;
}
