/**
 * Network contracts for authentication. Note what is absent: the password hash,
 * `isActive`, and every timestamp the admin UI has no use for.
 */

export interface SessionUserDto {
  id: string;
  email: string;
  fullName: string | null;
  role: 'customer' | 'staff' | 'admin' | 'super_admin';
  /**
   * Effective permission codes. A super admin is expanded to the full catalog
   * here so the UI can run the same `can(code)` check for everyone.
   */
  permissions: number[];
  /** Set when the role bypasses permission checks entirely. */
  isSuperAdmin: boolean;
}
