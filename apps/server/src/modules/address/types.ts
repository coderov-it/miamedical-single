/**
 * The slice of HERE's `/autocomplete` response this module reads.
 *
 * Deliberately partial and deliberately all-optional: it is a third party's shape,
 * it will grow fields we did not ask for, and every one of these can be absent on
 * a real result — a `locality` item has no street, a rural item has no house
 * number. The mapper decides what is usable; this type only says what may appear.
 */
export interface HereAddress {
  label?: string;
  countryCode?: string;
  city?: string;
  district?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  /** Italy's two-letter province, e.g. `RM`. HERE calls it the state code. */
  stateCode?: string;
  county?: string;
  countyCode?: string;
}

export interface HereAutocompleteItem {
  id?: string;
  title?: string;
  /** `houseNumber` | `street` | `locality` | `administrativeArea` | … */
  resultType?: string;
  address?: HereAddress;
}

export interface HereAutocompleteResponse {
  items?: HereAutocompleteItem[];
}
