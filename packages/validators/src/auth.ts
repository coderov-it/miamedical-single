import * as v from 'valibot';

import { EmailSchema, PasswordSchema } from './common.ts';

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

export const ChangePasswordSchema = v.pipe(
  v.object({
    currentPassword: v.pipe(v.string(), v.minLength(1, 'Current password is required.')),
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
 * A single permission code. Values are validated against the catalog in
 * `@mia/permissions` at the service layer — this only enforces the shape.
 */
export const PermissionCodeSchema = v.pipe(v.number(), v.integer(), v.minValue(1));

export const PermissionCodesSchema = v.pipe(v.array(PermissionCodeSchema), v.maxLength(200));

export type LoginInput = v.InferOutput<typeof LoginSchema>;
export type RegisterInput = v.InferOutput<typeof RegisterSchema>;
export type ChangePasswordInput = v.InferOutput<typeof ChangePasswordSchema>;
