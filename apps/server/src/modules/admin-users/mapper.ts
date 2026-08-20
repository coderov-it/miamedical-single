import type { AdminUserDto } from './dto.ts';
import type { AdminUserRow } from './types.ts';

/** Record → DTO. Pure; the hash is dropped here and nowhere else. */
export function toAdminUserDto(row: AdminUserRow): AdminUserDto {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    phone: row.phone,
    isSuperuser: row.isSuperuser,
    permissions: row.permissions,
    isActive: row.isActive,
    hasPassword: row.passwordHash !== null,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
