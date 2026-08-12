import type { AddressSuggestionDto } from './dto.ts';
import type { HereAutocompleteItem } from './types.ts';

/**
 * A HERE item → a suggestion the checkout can act on, or `null`.
 *
 * The filter is the point. A suggestion is only useful if picking it FILLS THE
 * FORM, and the form needs a street and a CAP; HERE happily returns whole cities
 * and provinces for a partial query, and those would look like valid picks that
 * leave the customer with an empty address. So anything without both is dropped
 * rather than shown.
 */
export function toSuggestion(item: HereAutocompleteItem, index: number): AddressSuggestionDto | null {
  const address = item.address;
  if (!address) return null;

  const street = address.street?.trim() ?? '';
  const postalCode = address.postalCode?.trim() ?? '';
  const city = address.city?.trim() ?? '';
  if (!street || !postalCode || !city) return null;

  /* Italy's CAP is five digits. HERE returns the local format per country, and the
     `in=countryCode:ITA` filter is not a guarantee about the shape of what comes
     back — this is what the checkout's own field will accept. */
  if (!/^\d{5}$/.test(postalCode)) return null;

  const houseNumber = address.houseNumber?.trim() || null;
  const provinceCode = address.stateCode?.trim() || null;

  return {
    // HERE's id is stable per result but not guaranteed present; the index keeps
    // the list keyable either way. It is never stored.
    id: item.id ?? `suggestion-${index}`,
    label: label(street, houseNumber, postalCode, city, provinceCode),
    street,
    houseNumber,
    postalCode,
    city,
    provinceCode,
  };
}

/**
 * `Via Ostiense 44, 00154 Roma RM` — composed rather than taken from HERE's own
 * `label`, which appends ", Italia" to every row in an Italian-only checkout and
 * puts the house number where an Italian address does not.
 */
function label(
  street: string,
  houseNumber: string | null,
  postalCode: string,
  city: string,
  provinceCode: string | null,
): string {
  const line = houseNumber ? `${street} ${houseNumber}` : street;
  const town = provinceCode ? `${city} ${provinceCode}` : city;
  return `${line}, ${postalCode} ${town}`;
}
