import * as v from 'valibot';

/**
 * The public profile-deletion flow — `modules/account-deletion` on the server,
 * `/delete-profile/` on the storefront.
 *
 * `identifier` is an email OR a customer id. The schema only bounds it; which
 * of the two it is gets decided by the service, since a string that fails both
 * must still get the same blind answer as one that matches nobody.
 */
export const AccountIdentifierSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, 'Enter your email or user ID.'),
  v.maxLength(254),
);

export const DeletionCodeSchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^\d{6}$/, 'Enter the 6-digit code.'),
);

export const RequestAccountDeletionSchema = v.strictObject({
  identifier: AccountIdentifierSchema,
});

export const VerifyAccountDeletionSchema = v.strictObject({
  identifier: AccountIdentifierSchema,
  code: DeletionCodeSchema,
});

/** `acknowledged` is the checkbox — the server refuses without it, not just the page. */
export const ConfirmAccountDeletionSchema = v.strictObject({
  identifier: AccountIdentifierSchema,
  code: DeletionCodeSchema,
  acknowledged: v.literal(true, 'Confirm that the deletion is permanent.'),
});

export type RequestAccountDeletionInput = v.InferOutput<typeof RequestAccountDeletionSchema>;
export type VerifyAccountDeletionInput = v.InferOutput<typeof VerifyAccountDeletionSchema>;
export type ConfirmAccountDeletionInput = v.InferOutput<typeof ConfirmAccountDeletionSchema>;
