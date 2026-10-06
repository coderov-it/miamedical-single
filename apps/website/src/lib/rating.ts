/**
 * A review score as the reader's language writes it — always one decimal:
 *
 *   formatRating(4.9, 'it-IT')  → "4,9"
 *   formatRating(4.9, 'en-GB')  → "4.9"
 *   formatRating(5,   'de-DE')  → "5,0"
 *
 * The score is kept as a number and formatted at render; a preformatted "4,9"
 * printed the Italian decimal comma on every locale (PUB-003).
 */
export function formatRating(value: number, tag: string): string {
  return new Intl.NumberFormat(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}
