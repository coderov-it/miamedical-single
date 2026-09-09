import * as v from 'valibot';

import { EmailSchema, FullNameSchema, PasswordSchema, PhoneSchema } from './common.ts';

export const LoginSchema = v.object({
  email: EmailSchema,
  password: v.pipe(v.string(), v.minLength(1, 'Password is required.')),
});

export const RegisterSchema = v.pipe(
  v.object({
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: v.string(),
    fullName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120)),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === input.confirmPassword,
      'Passwords do not match.',
    ),
    ['confirmPassword'],
  ),
);

/**
 * Changing your own password.
 *
 * `currentPassword` is optional *on the wire* and required by policy for
 * everyone except a superuser — see `modules/auth/service.ts`. It cannot be
 * required here because "is the caller a superuser" is not a question a schema
 * can answer, and a schema that guessed would either lock superusers out of
 * their own account or drop the check for everybody.
 */
export const ChangePasswordSchema = v.pipe(
  v.object({
    currentPassword: v.optional(v.pipe(v.string(), v.minLength(1, 'Enter your current password.'))),
    newPassword: PasswordSchema,
    confirmPassword: v.string(),
  }),
  v.forward(
    v.partialCheck(
      [['newPassword'], ['confirmPassword']],
      (input) => input.newPassword === input.confirmPassword,
      'Passwords do not match.',
    ),
    ['confirmPassword'],
  ),
);

/**
 * Editing your own account details, which every signed-in operator may do —
 * it answers to no permission, because needing one would mean an operator with
 * no grants at all could not correct their own phone number.
 *
 * `email` is in the shape but not everyone's to change: it is the identity you
 * sign in with rather than a preference, so the service accepts a new one only
 * from a superuser and 403s otherwise. Sending your existing address is always
 * fine — the form does it on every save.
 */
export const UpdateProfileSchema = v.object({
  fullName: v.optional(FullNameSchema),
  phone: v.optional(PhoneSchema),
  email: v.optional(EmailSchema),
});

/**
 * A single permission code. Values are validated against the catalog in
 * `@mia/permissions` at the service layer — this only enforces the shape.
 */
export const PermissionCodeSchema = v.pipe(v.number(), v.integer(), v.minValue(1));

export const PermissionCodesSchema = v.pipe(v.array(PermissionCodeSchema), v.maxLength(200));

export type LoginInput = v.InferOutput<typeof LoginSchema>;
export type RegisterInput = v.InferOutput<typeof RegisterSchema>;
export type ChangePasswordInput = v.InferOutput<typeof ChangePasswordSchema>;
export type UpdateProfileInput = v.InferOutput<typeof UpdateProfileSchema>;
