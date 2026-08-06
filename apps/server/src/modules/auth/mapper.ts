import { PERMISSION_LIST, effectivePermissions, isSuperAdmin } from '@mia/permissions';

import type { SessionUserDto } from './dto.ts';
import type { UserRow } from './types.ts';

const ALL_CODES: readonly number[] = PERMISSION_LIST.map((definition) => definition.code);

export function toSessionUser(
  row: Pick<UserRow, 'id' | 'email' | 'fullName' | 'role' | 'permissions'>,
): SessionUserDto {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    permissions: effectivePermissions(row, ALL_CODES),
    isSuperAdmin: isSuperAdmin(row),
  };
}
