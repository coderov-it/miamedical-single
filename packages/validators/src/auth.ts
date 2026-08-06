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

export type LoginInput = v.InferOutput<typeof LoginSchema>;
export type RegisterInput = v.InferOutput<typeof RegisterSchema>;
