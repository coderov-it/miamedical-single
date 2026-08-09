/**
 * Editorial copy for the home page, transcribed from the approved design.
 *
 * TEMPORARY — this belongs in the back office as page sections plus a governed
 * reviews source. See the "Known gaps" section of
 * docs/code/storefront-design-system.md.
 */
import type { Category, ProductSummary } from './catalog.ts';

/**
 * The four products shown in the hero spotlight and the "I più noleggiati"
 * rail, in a stable order.
 *
 * Editorially featured rentals come first — that flag is the back office's
 * only way to say "show this on the home page". Remaining slots are filled
 * with other rentals so the rail is never half empty on a fresh catalogue.
 */
export function selectHomeFeatured(products: ProductSummary[], limit = 3): ProductSummary[] {
  const rank = (product: ProductSummary) =>
    (product.pricing.mode === 'rental' ? 0 : 2) + (product.isFeatured ? 0 : 1);

  // Rentals first, editorially featured ones ahead of the rest, then sale items
  // to top up — a rail of one card on a young catalogue reads as broken.
  return [...products].sort((a, b) => rank(a) - rank(b)).slice(0, limit);
}

export interface HomeCategoryCard {
  key: string;
  /** Category `code` — the value the catalogue filters on. */
  code: string;
  title: string;
  detail: string;
  /** Object-storage path, already resolved by the caller through `mediaUrl`. */
  imagePath: string | null;
}

/**
 * Category tiles for the home grid.
 *
 * A category has an icon but no imagery of its own, so a category without an
 * icon borrows the thumbnail of one of its products — which is what the design
 * shows. Empty categories are dropped rather than rendered as a dead tile.
 */
export function buildHomeCategories(
  categories: Category[],
  products: ProductSummary[],
  limit = 8,
): HomeCategoryCard[] {
  const counts = new Map<string, number>();
  const firstImage = new Map<string, string>();

  for (const product of products) {
    const slug = product.category.slug;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
    if (product.thumbnail && !firstImage.has(slug)) {
      firstImage.set(slug, product.thumbnail.path);
    }
  }

  return categories
    .filter((category) => (counts.get(category.slug) ?? 0) > 0)
    .sort((a, b) => (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0))
    .slice(0, limit)
    .map((category) => {
      const count = counts.get(category.slug) ?? 0;
      return {
        key: category.id,
        code: category.code,
        title: category.name,
        detail: `${count} ${count === 1 ? 'ausilio' : 'ausili'}`,
        imagePath: category.icon ?? firstImage.get(category.slug) ?? null,
      };
    });
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const HOME_FAQ: FaqItem[] = [
  {
    question: 'Quando e come si paga?',
    answer:
      'Non paghi nulla sul sito. Invii la richiesta, ti chiamiamo per confermare disponibilità e consegna, poi ricevi un link di pagamento sicuro via SMS o email. Il pagamento avviene solo dopo la nostra telefonata.',
  },
  {
    question: 'Serve una cauzione?',
    answer:
      'Per la maggior parte degli ausili no. Solo per alcuni prodotti di valore (per esempio le carrozzine elettriche) è prevista una cauzione, indicata chiaramente sulla scheda prodotto e restituita per intero a fine noleggio.',
  },
  {
    question: 'Quanto costa la consegna?',
    answer:
      'Dipende dalla zona e dal prodotto: te la confermiamo al telefono prima del pagamento, senza sorprese. Per molti prodotti è gratuita per i noleggi da 30 giorni, e per i letti il montaggio in camera è sempre incluso.',
  },
  {
    question: 'I prodotti sono igienizzati?',
    answer:
      'Sì. Ogni ausilio viene sanificato, controllato e certificato dopo ogni noleggio. Lo ricevi igienizzato e pronto all’uso.',
  },
  {
    question: 'Posso prolungare il noleggio?',
    answer: 'Sì, basta una telefonata: prolunghi quando vuoi e paghi solo i giorni in più.',
  },
  {
    question: 'E se il prodotto non va bene?',
    answer:
      'Chiamaci: lo sostituiamo con uno più adatto o lo ritiriamo. Ti aiutiamo anche a scegliere prima di ordinare.',
  },
];

export interface Review {
  /** Display name plus city, as shown in the design. */
  name: string;
  text: string;
  rating: number;
}

/**
 * Aggregate rating shown beside the heading. Sourced from Google on the legacy
 * site. This needs a governed source before launch: a stale aggregate rating in
 * structured data is a Google policy problem, not just an inaccuracy — which is
 * why it is deliberately absent from the page's JSON-LD.
 */
export const REVIEW_AGGREGATE = {
  rating: '4,9',
  countLabel: 'oltre 600 recensioni Google',
} as const;

export const HOME_REVIEWS: Review[] = [
  {
    name: 'Marina C. — Roma',
    text: 'Cortesia, efficienza e puntualità nella consegna. Personale molto gentile e disponibile.',
    rating: 5,
  },
  {
    name: 'Daniele G. — Firenze',
    text: 'Servizio eccellente: ordinato il letto per mio padre, consegnato e montato il giorno dopo.',
    rating: 5,
  },
  {
    name: 'Marcello P. — Roma',
    text: 'I miei complimenti per l’organizzazione e per la qualità dei prodotti offerti.',
    rating: 5,
  },
];
