/**
 * One address suggestion, as the checkout needs it.
 *
 * Three of these fields exist so a pick can FILL A FORM, not so it can be
 * displayed: `street`, `houseNumber` and `postalCode` land in the three inputs the
 * customer would otherwise type. `label` is the only one the customer reads.
 *
 * Note what is absent: no coordinates, no HERE place id beyond the one needed to
 * key a list, no country. The order stores an Italian address the customer
 * confirmed, and nothing downstream has ever needed a latitude — see the
 * "deliberately not modelled" note on distance in docs/code/delivery-pricing.md.
 */
export interface AddressSuggestionDto {
  /** Stable within one response; used as the list key, never stored. */
  id: string;
  /** What the customer reads: `Via Ostiense 44, 00154 Roma RM`. */
  label: string;
  street: string;
  houseNumber: string | null;
  /**
   * Always present. A suggestion without a CAP cannot price a delivery, so the
   * mapper drops it rather than offering a pick that leaves the form incomplete.
   */
  postalCode: string;
  city: string;
  /** `RM`. Shown in the label; not stored, since the CAP is the pricing key. */
  provinceCode: string | null;
}
