import * as v from 'valibot';

import { PermissionCodesSchema } from './auth.ts';
import { EmailSchema, PaginationSchema, PasswordSchema, UuidSchema } from './common.ts';

/**
 * Back-office account management. Shared with the admin UI so the form and the
 * endpoint cannot disagree about what a valid operator looks like.
 *
 * Permission codes are validated for *shape* here and against the catalog in
 * the service — `@mia/validators` deliberately does not depend on
 * `@mia/permissions`, so "is 9999 a real permission" is not a question this
 * layer can answer.
 */

export const AdminUserIdParamSchema = v.object({ id: UuidSchema });

const NameSchema = v.pipe(v.string(), v.trim(), v.minLength(2, 'Enter a name.'), v.maxLength(120));

/** Free-form on purpose: an operator's number may be a mobile, a desk or an extension. */
const PhoneSchema = v.pipe(v.string(), v.trim(), v.maxLength(40));

export const AdminUserQuerySchema = v.object({
  ...PaginationSchema.entries,
  /** Matches email or full name. */
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
  status: v.optional(v.picklist(['all', 'active', 'disabled']), 'all'),
});

/**
 * A password is required at creation rather than optional. The column is
 * nullable — an account that cannot sign in is a real state — but an operator
 * creating one by leaving a field blank is a forgotten step, not an intention.
 */
export const CreateAdminUserSchema = v.object({
  email: EmailSchema,
  fullName: NameSchema,
  phone: v.optional(PhoneSchema),
  password: PasswordSchema,
  isSuperuser: v.optional(v.boolean(), false),
  permissions: v.optional(PermissionCodesSchema, []),
});

/**
 * Profile only. Permissions move through their own endpoint because granting
 * access is a different decision from fixing a typo in a name, and it answers
 * to a different permission (`admin:permission_assign`).
 */
export const UpdateAdminUserSchema = v.object({
  email: v.optional(EmailSchema),
  fullName: v.optional(NameSchema),
  phone: v.optional(PhoneSchema),
  isActive: v.optional(v.boolean()),
});

/**
 * The grant surface. Both fields are required — this is a "set the access to
 * exactly this" call, not a patch, so an omitted flag can never be read as
 * "leave superuser alone" by one caller and "clear it" by another.
 */
export const SetAdminPermissionsSchema = v.object({
  isSuperuser: v.boolean(),
  permissions: PermissionCodesSchema,
});

/** Setting someone else's password. Confirmation is the form's job, not the wire's. */
export const SetAdminPasswordSchema = v.object({ password: PasswordSchema });

export type AdminUserQuery = v.InferOutput<typeof AdminUserQuerySchema>;
export type CreateAdminUserInput = v.InferOutput<typeof CreateAdminUserSchema>;
export type UpdateAdminUserInput = v.InferOutput<typeof UpdateAdminUserSchema>;
export type SetAdminPermissionsInput = v.InferOutput<typeof SetAdminPermissionsSchema>;
export type SetAdminPasswordInput = v.InferOutput<typeof SetAdminPasswordSchema>;
