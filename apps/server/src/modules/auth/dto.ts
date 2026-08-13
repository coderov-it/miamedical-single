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
