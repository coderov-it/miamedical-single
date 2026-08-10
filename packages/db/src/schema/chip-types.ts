import type { Localized } from './i18n.ts';

/**
 * Chips: the two-to-five short claims a product shows on its card and at the
 * top of its detail page ("Portata 170 kg", "Telecomando incluso").
 *
 * They are marketing copy, not data. Before this column the storefront faked
 * them from the first three `is_comparable` specs, which read well only when a
 * category happened to define the right specs in the right order — a spec
 * exists to be filtered and compared, and the two jobs pull the text in
 * opposite directions ("Materiale struttura: Acciaio verniciato" is a correct
 * spec and a terrible chip).
 *
 * Raw jsonb, deliberately: chips are never searched, never filtered, never
 * shared between products and never joined, so a table (or an index, or a
 * `tsvector` contribution) would buy nothing. The chip text is display-only —
 * `product_translations.search_vector` keeps ignoring it.
 *
 * Cardinality and the 20-character ceiling live in valibot
 * (`ProductChipsSchema`), the same division media and rental packages use: a
 * CHECK cannot police a jsonb array's element shape, and the admin has to
 * report the limit per field anyway. The cap is a presentation rule — the card
 * gives chips one cropped line, so a long chip costs its neighbours their
 * place.
 */
export type ProductChip = Localized;

/** Cardinality lives in valibot (`ProductChipsSchema`), as it does for media. */
export const EMPTY_PRODUCT_CHIPS: ProductChip[] = [];
