/**
 * Network contracts for storefront accounts. Note what is absent: the password
 * hash, `isActive`, `deletedAt`, and the timestamps the storefront has no use for.
 */

export interface CustomerDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  /**
   * Whether they have ever redeemed an emailed link. The UI uses it to decide
   * whether to nudge; it is not an access decision — an unactivated account
   * cannot hold a session in the first place.
   */
  isActivated: boolean;
  /**
   * Whether a password exists. Drives "set a password" versus "change password",
   * and lets the UI avoid offering a password sign-in that cannot work.
   */
  hasPassword: boolean;
}
