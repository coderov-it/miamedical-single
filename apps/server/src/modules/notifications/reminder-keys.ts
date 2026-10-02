/**
 * The identity of each sweep reminder — its `dedupe_key`. A reminder is about a
 * DATE, so the date is in the key: when an extension moves the end date (or an
 * operator moves the start), the reminder for the new date is a new row instead
 * of colliding with the old one. Worked example in docs/code/notifications-live.md,
 * "The sweep".
 *
 * `emitToAdmins` appends `:<adminUserId>` to an admin key.
 */

/** `rental.ending_soon:customer:<orderId>:2026-10-08:3d` */
export function endingSoonKey(
  audience: 'customer' | 'admin',
  orderId: string,
  endsOn: string,
  daysLeft: number,
): string {
  return `rental.ending_soon:${audience}:${orderId}:${endsOn}:${daysLeft}d`;
}

/** `order.upcoming:<orderId>:2026-10-10` */
export function upcomingKey(orderId: string, startsOn: string): string {
  return `order.upcoming:${orderId}:${startsOn}`;
}

/** `rental.extend_offer:<orderId>:2026-10-08` */
export function extendOfferKey(orderId: string, endsOn: string): string {
  return `rental.extend_offer:${orderId}:${endsOn}`;
}
