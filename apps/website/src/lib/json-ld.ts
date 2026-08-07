/**
 * Serializes JSON-LD safely inside an HTML script element.
 *
 * JSON.stringify alone leaves `<` intact, so a CMS string containing
 * `</script>` would terminate the element. Escaping the HTML-significant
 * characters preserves the JSON value while preventing that parser break-out.
 * U+2028/U+2029 are legal in JSON but not in JavaScript string literals.
 */
export function serializeJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}
