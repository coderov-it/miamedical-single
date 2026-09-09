/**
 * Network contracts for authentication. Note what is absent: the password hash,
 * `isActive`, and every timestamp the admin UI has no use for.
 */

export interface SessionUserDto {
  id: string;
  email: string;
  fullName: string | null;
  /**
   * Effective permission codes. A superuser is expanded to the full catalog here
   * so the UI can run the same `can(code)` check for everyone.
   */
  permissions: number[];
  /** Holds every code, including ones added to the catalog later. */
  isSuperuser: boolean;
}

/**
 * Your own account, as the profile screen shows it. Deliberately not the same
 * shape as `SessionUserDto`: that one is the session bootstrap — identity plus
 * effective permissions, fetched on every page load — and adding profile fields
 * to it would ship a phone number to every screen that only wants to know what
 * you may click.
 *
 * `permissions` here are the codes actually stored on the row, not the expanded
 * set, because this screen reports what you were granted rather than deciding
 * what you may reach.
 */
export interface ProfileDto {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  isSuperuser: boolean;
  permissions: number[];
  lastLoginAt: string | null;
  createdAt: string;
}
