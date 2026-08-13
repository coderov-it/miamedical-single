import { isPermissionCode } from './catalog.ts';

/**
 * Access is decided by permission codes and nothing else. There are no roles,
 * no tiers and no hierarchy: an admin either holds a code or does not.
 *
 * The one attribute that is not a code is `isSuperuser`, which means "every code,
 * including ones that do not exist yet". It exists so that adding a permission to
 * the catalog does not silently strip an all-access operator of the new area —
 * with a plain array, every new code would need backfilling onto existing rows.
 * There must always be at least one superuser, or nobody can grant access again.
 */

/**
 * Whatever the caller knows about the current admin. Deliberately structural —
 * the server passes its session user, the admin UI passes its store — so this
 * package never depends on the database or on HTTP.
 */
export interface PermissionSubject {
  readonly isSuperuser: boolean;
  readonly permissions: readonly number[];
}

type Subject = PermissionSubject | null | undefined;

export function isSuperuser(subject: Subject): boolean {
  return subject?.isSuperuser === true;
}

/**
 * The single check every guard funnels through. Integer comparison only — the
 * `order:update` string is never involved at runtime.
 */
export function can(subject: Subject, code: number): boolean {
  if (!subject) return false;
  if (subject.isSuperuser) return true;
  return subject.permissions.includes(code);
}

/** True only when the subject holds every listed permission. */
export function canAll(subject: Subject, codes: readonly number[]): boolean {
  if (!subject) return false;
  if (subject.isSuperuser) return true;
  return codes.every((code) => subject.permissions.includes(code));
}

/** True when the subject holds at least one of the listed permissions. */
export function canAny(subject: Subject, codes: readonly number[]): boolean {
  if (!subject) return false;
  if (subject.isSuperuser) return true;
  return codes.some((code) => subject.permissions.includes(code));
}

/**
 * The codes a subject effectively holds, for display. A superuser holds
 * everything, which is why this is derived rather than read from the column.
 */
export function effectivePermissions(subject: Subject, all: readonly number[]): number[] {
  if (!subject) return [];
  if (subject.isSuperuser) return [...all];
  return subject.permissions.filter(isPermissionCode);
}
