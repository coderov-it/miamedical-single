/**
 * Shared shapes and display helpers for the access screen.
 *
 * The permission catalog is not fetched: it is static and ships in
 * `@mia/permissions`, which is the same module the server's guards compare
 * against. So the picker reads labels and groups locally and only ever sends
 * numbers over the wire.
 */

import { PERMISSION_GROUPS, permissionByCode, type PermissionGroup } from '@mia/permissions';
import type { InferResponseType } from 'hono/client';

import type { api } from '~/lib/api';

export type AdminUserList = InferResponseType<typeof api.api.admin.users.$get, 200>;
export type AdminUser = AdminUserList['data'][number];

/** The groups a set of codes touches, in catalog order. */
export function groupsOf(codes: readonly number[]): PermissionGroup[] {
  const hit = new Set<PermissionGroup>();
  for (const code of codes) {
    const group = permissionByCode(code)?.group;
    if (group) hit.add(group);
  }
  return PERMISSION_GROUPS.filter((group) => hit.has(group));
}

/**
 * "Orders, Products +2" — enough to recognise an account's shape in a table row
 * without printing thirteen group names into a cell.
 */
export function groupSummary(codes: readonly number[], limit = 2): string {
  const groups = groupsOf(codes);
  if (groups.length === 0) return 'No areas';
  const shown = groups.slice(0, limit).join(', ');
  const rest = groups.length - limit;
  return rest > 0 ? `${shown} +${rest}` : shown;
}
