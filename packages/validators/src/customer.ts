import * as v from 'valibot';

import { CustomerPasswordSchema, EmailSchema } from './common.ts';

/**
 * Storefront account contracts, shared by the server and the storefront islands.
 *
 * Passwords use `CustomerPasswordSchema` (6 characters), not the back office's
 * `PasswordSchema` (12). Two policies, deliberately: an operator's password guards
 * the whole shop, a customer's guards that customer's own order list. And nobody
 * is forced to have one at all — magic-link sign-in is a first-class path, not a
 * fallback, so a rule strict enough to fail a form is a rule that costs an account
 * and protects nothing.
 */

/** An opaque emailed token. Length is not asserted: only redemption can judge it. */
export const AuthTokenSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(256));

export const CustomerLoginSchema = v.strictObject({
  email: EmailSchema,
  password: v.pipe(v.string(), v.minLength(1, 'Password is required.')),
});

/**
 * Registering with a password. No name: the profile form or the first checkout
 * supplies it. The password takes effect only when the emailed link is redeemed.
 */
export const RegisterCustomerSchema = v.strictObject({
  email: EmailSchema,
  password: CustomerPasswordSchema,
});

/**
 * Requesting a magic link or a reset. The response never depends on whether the
 * address exists, so these carry no other field to leak one.
 */
export const EmailOnlySchema = v.strictObject({ email: EmailSchema });

/**
 * Redeeming an activation, magic-link or reset token.
 *
 * The password is optional: activation may be used purely to sign in, leaving the
 * account magic-link-only. When it is supplied the confirmation must match, which
 * is a form concern the server checks too rather than trusting the client with.
 */
export const RedeemAuthTokenSchema = v.pipe(
  v.strictObject({
    token: AuthTokenSchema,
    password: v.optional(CustomerPasswordSchema),
    confirmPassword: v.optional(v.string()),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === undefined || input.password === input.confirmPassword,
      'Passwords do not match.',
    ),
    ['confirmPassword'],
  ),
);

/**
 * Setting or changing a password from inside a session.
 *
 * `currentPassword` is optional because an account that has never had one cannot
 * produce it. The service requires it whenever a hash exists — the schema cannot
 * know that, and pretending otherwise would put the rule in two places.
 */
export const SetCustomerPasswordSchema = v.pipe(
  v.strictObject({
    currentPassword: v.optional(v.string()),
    newPassword: CustomerPasswordSchema,
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
 * The profile a customer may edit. Email is absent on purpose: changing it needs a
 * re-verification round trip, and silently trusting a new address would hand over
 * every future magic link.
 */
export const UpdateCustomerProfileSchema = v.strictObject({
  firstName: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
  lastName: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
  phone: v.pipe(v.string(), v.trim(), v.minLength(5), v.maxLength(32)),
});

/**
 * The "I did not place this order" report. The token is the authorisation, so no
 * order id appears here — one cannot be guessed into.
 *
 * The WhatsApp number is asked for again rather than read off the order: the point
 * is to reach the real person, and the number on a fraudulent order is the
 * fraudster's.
 */
export const CreateOrderDisputeSchema = v.strictObject({
  token: AuthTokenSchema,
  reportedPhone: v.pipe(v.string(), v.trim(), v.minLength(5), v.maxLength(32)),
  message: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(2000)),
});

export const OrderDisputeStatusSchema = v.picklist([
  'open',
  'contacted',
  'resolved',
  'confirmed_fraud',
]);

/** What an operator may change on a dispute. */
export const UpdateOrderDisputeSchema = v.strictObject({
  status: OrderDisputeStatusSchema,
  adminNotes: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(2000))),
});

export type CustomerLoginInput = v.InferOutput<typeof CustomerLoginSchema>;
export type RegisterCustomerInput = v.InferOutput<typeof RegisterCustomerSchema>;
export type EmailOnlyInput = v.InferOutput<typeof EmailOnlySchema>;
export type RedeemAuthTokenInput = v.InferOutput<typeof RedeemAuthTokenSchema>;
export type SetCustomerPasswordInput = v.InferOutput<typeof SetCustomerPasswordSchema>;
export type UpdateCustomerProfileInput = v.InferOutput<typeof UpdateCustomerProfileSchema>;
export type CreateOrderDisputeInput = v.InferOutput<typeof CreateOrderDisputeSchema>;
export type UpdateOrderDisputeInput = v.InferOutput<typeof UpdateOrderDisputeSchema>;
