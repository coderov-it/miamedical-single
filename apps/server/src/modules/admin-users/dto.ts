/**
 * Network contract for a back-office account. Absent, deliberately:
 * `passwordHash` (never leaves the process) and `emailVerifiedAt` (the panel
 * has no verification flow to show).
 */
export interface AdminUserDto {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  /** Holds every code, including ones added to the catalog later. */
  isSuperuser: boolean;
  /**
   * The codes actually stored on the row — **not** expanded the way
   * `SessionUserDto.permissions` is. This screen edits grants, so it has to
   * show what was granted; a superuser's list stays visible underneath the
   * flag so that clearing the flag is not a silent wipe.
   */
  permissions: number[];
  isActive: boolean;
  /** False means the row exists but nobody can sign into it. */
  hasPassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
