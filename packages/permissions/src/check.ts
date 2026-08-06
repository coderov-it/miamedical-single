import { isPermissionCode } from './catalog.ts';

/**
 * The one role that is never checked against the catalog: a super admin passes
 * every permission test by definition, and its `permissions` array is ignored.
 * There must always be at least one, or nobody can grant permissions again.
 */
export const SUPER_ADMIN_ROLE = 'super_admin';

/**
 * Whatever the caller knows about the current user. Deliberately structural —
 * the server passes its session user, the admin UI passes its store — so this
 * package never depends on the database or on HTTP.
 */
export interface PermissionSubject {
  readonly role: string;
  readonly permissions: readonly number[];
}

type Subject = PermissionSubject | null | undefined;

export function isSuperAdmin(subject: Subject): boolean {
  return subject?.role === SUPER_ADMIN_ROLE;
}

/**
 * The single check every guard funnels through. Integer comparison only — the
 * `order:update` string is never involved at runtime.
 */
export function can(subject: Subject, code: number): boolean {
  if (!subject) return false;
  if (subject.role === SUPER_ADMIN_ROLE) return true;
  return subject.permissions.includes(code);
}

/** True only when the subject holds every listed permission. */
export function canAll(subject: Subject, codes: readonly number[]): boolean {
  if (!subject) return false;
  if (subject.role === SUPER_ADMIN_ROLE) return true;
  return codes.every((code) => subject.permissions.includes(code));
}

/** True when the subject holds at least one of the listed permissions. */
export function canAny(subject: Subject, codes: readonly number[]): boolean {
  if (!subject) return false;
  if (subject.role === SUPER_ADMIN_ROLE) return true;
  return codes.some((code) => subject.permissions.includes(code));
}

/**
 * The codes a subject effectively holds, for display. A super admin holds
 * everything, which is why this is derived rather than read from the column.
 */
export function effectivePermissions(subject: Subject, all: readonly number[]): number[] {
  if (!subject) return [];
  if (subject.role === SUPER_ADMIN_ROLE) return [...all];
  return subject.permissions.filter(isPermissionCode);
}
