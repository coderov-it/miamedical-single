import { PERMISSION_LIST, effectivePermissions } from '@mia/permissions';

import type { SessionUserDto } from './dto.ts';
import type { AdminUserRow } from './types.ts';

const ALL_CODES: readonly number[] = PERMISSION_LIST.map((definition) => definition.code);

export function toSessionUser(
  row: Pick<AdminUserRow, 'id' | 'email' | 'fullName' | 'isSuperuser' | 'permissions'>,
): SessionUserDto {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    permissions: effectivePermissions(row, ALL_CODES),
    isSuperuser: row.isSuperuser,
  };
}
