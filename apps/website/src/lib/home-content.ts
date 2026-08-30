/**
 * Editorial copy for the home page, transcribed from the approved blueprint
 * (docs/blueprint/home.html).
 *
 * TEMPORARY — this belongs in the back office as page sections plus a governed
 * reviews source. See the "Known gaps" section of
 * docs/code/storefront-design-system.md.
 */
import { perUnitLabel } from '@mia/i18n';

import { formatMoney } from './api.ts';
import { buildCategoryTiles, type CategoryTile } from './catalog-page.ts';
import type { Category, ProductSummary } from './catalog.ts';
import { localeTag, type SiteLocale } from './i18n.ts';

/**
 * The products shown in the hero showcase (3) and the "I più noleggiati"
 * carousel (8), in a stable order.
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

export interface ProductOffer {
  /** "4,90 €" — already formatted for it-IT. */
  money: string;
  /** "al giorno", or null when the figure is a total rather than a rate. */
  unit: string | null;
}

/**
 * The home page's price line: big rate, small unit ("4,90 € al giorno").
 *
 * On a rental the rate is the back office's MARKETING copy; with none typed it
 * falls back to the cheapest package's total, which is a total, not a rate —
 * so it carries no unit. `null` only when the product has no figure at all.
 */
export function productOffer(
  product: ProductSummary,
  locale: SiteLocale = 'it',
): ProductOffer | null {
  const amount = product.pricing.marketingRate ?? product.pricing.fromPrice;
  if (amount === null) return null;
  const isRate = product.pricing.mode === 'rental' && product.pricing.marketingRate !== null;
  return {
    money: formatMoney(amount, product.pricing.currency, localeTag(locale)),
    unit: isRate ? perUnitLabel(product.pricing.rentalUnit, locale) : null,
  };
}

/**
 * Category tiles for the home grid.
 *
 * The shape and the "da …" line are the catalogue's — one tile model, so the
 * home grid and the catalogue directory can never say different things about
 * the same category. Home adds only its own selection: the busiest categories
 * first, capped at eight, and a product thumbnail standing in for a category
 * that has no icon of its own.
 */
export function buildHomeCategories(
  categories: Category[],
  products: ProductSummary[],
  limit = 8,
  locale: SiteLocale = 'it',
): CategoryTile[] {
  const firstImage = new Map<string, string>();
  for (const product of products) {
    const { slug } = product.category;
    if (product.thumbnail && !firstImage.has(slug)) firstImage.set(slug, product.thumbnail.path);
  }

  return buildCategoryTiles(categories, { locale, imageFallback: firstImage })
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, limit);
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** The home page's six questions, from the approved blueprint. */
export const HOME_FAQ: FaqItem[] = [
  {
    question: 'Come funziona la consegna a domicilio?',
    answer:
      "Consegniamo e montiamo noi, a Roma e Firenze, di solito entro 24–48 ore dall'ordine. Alla fine del noleggio veniamo a ritirare l'ausilio: consegna e ritiro sono già compresi nella tariffa.",
  },
  {
    question: 'Qual è la durata minima del noleggio?',
    answer:
      'Si parte da una settimana. Se ti serve più a lungo basta una telefonata: la proroga si attiva subito, senza firmare nulla di nuovo.',
  },
  {
    question: 'Gli ausili sono sanificati?',
    answer:
      'Sì. Ogni ausilio viene igienizzato, controllato e regolato prima di ogni consegna. Sono tutti dispositivi certificati CE con manutenzione documentata.',
  },
  {
    question: 'Serve la prescrizione del medico?',
    answer:
      'No, per noleggiare non serve alcuna prescrizione. Se hai una pratica ASL in corso ti aiutiamo noi a capire cosa spetta e come muoverti.',
  },
  {
    question: 'Come si paga?',
    answer:
      'Online con carta oppure alla consegna. La tariffa è al giorno e comprende tutto: nessun deposito nascosto, nessun costo che spunta dopo.',
  },
  {
    question: "Posso restituire l'ausilio prima del previsto?",
    answer:
      'Sì: chiamaci e organizziamo il ritiro anticipato. Paghi solo i giorni di noleggio effettivi previsti dal piano scelto.',
  },
];

/** The support page's FAQ — a longer, more operational list than the home one. */
export const SUPPORT_FAQ: FaqItem[] = [
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

/**
 * Aggregate rating, shown in the PDP order panel.
 *
 * The reviews are NOT a single platform's: they are collected from the social
 * profiles below and aggregated by hand, so the label must stay source-neutral.
 * Calling them "recensioni Google" would claim a Google-verified figure the
 * business does not have. This still needs a governed source before launch,
 * which is why it is deliberately absent from the pages' JSON-LD: a stale
 * aggregate rating in structured data is a Google policy problem, not just an
 * inaccuracy.
 */
export const REVIEW_AGGREGATE = {
  rating: '4,9',
  countLabel: 'oltre 600 recensioni',
  sources: ['Google Maps', 'Trustpilot', 'Facebook'],
} as const;

export type TestimonialSource = 'google' | 'trustpilot' | 'facebook';

export interface Testimonial {
  name: string;
  /** Two letters for the avatar disc. */
  initials: string;
  /** Month and year, never a relative date — "Giugno 2026". */
  date: string;
  text: string;
  source: TestimonialSource;
}

/**
 * The home testimonial band, from the approved blueprint. PLACEHOLDER people
 * and figures: swap for the governed reviews source before launch, and keep
 * the count in step with `REVIEW_AGGREGATE` when either becomes real.
 */
export const HOME_TESTIMONIALS = {
  rating: '4,9',
  countLabel: '214 recensioni verificate',
  entries: [
    {
      name: 'Giulia R.',
      initials: 'GR',
      date: 'Giugno 2026',
      text: "L'ho ordinato una sera per mia madre e il pomeriggio seguente era già in camera, montato e regolato. Prima di andare via mi hanno spiegato ogni comando con calma.",
      source: 'google',
    },
    {
      name: 'Franco M.',
      initials: 'FM',
      date: 'Luglio 2026',
      text: 'Ho spostato due volte le date del ritiro e non è mai stato un problema: stessa voce, stessa pazienza. Quando assisti un genitore anziano, questo vale più di qualsiasi sconto.',
      source: 'google',
    },
    {
      name: 'Sara T.',
      initials: 'ST',
      date: 'Luglio 2026',
      text: "Cinque minuti dal telefono, senza registrazioni complicate. Il rollator è arrivato a Firenze il giorno dopo, già regolato per l'altezza di mio padre.",
      source: 'trustpilot',
    },
    {
      name: 'Alessandro B.',
      initials: 'AB',
      date: 'Maggio 2026',
      text: 'Ho confrontato tre servizi prima di scegliere: qui la tariffa è al giorno, con consegna e ritiro compresi, e alla fine non è spuntato nessun costo a sorpresa.',
      source: 'google',
    },
    {
      name: 'Marta C.',
      initials: 'MC',
      date: 'Aprile 2026',
      text: 'La carrozzina è arrivata igienizzata, con le gomme gonfie e i freni registrati: sembrava appena uscita dal negozio. Al ritiro sono stati puntuali al minuto.',
      source: 'facebook',
    },
    {
      name: 'Paolo V.',
      initials: 'PV',
      date: 'Febbraio 2026',
      text: "Dopo l'operazione mi serviva un letto elettrico solo per sei settimane. Consegna, montaggio e ritiro compresi: finito il noleggio se lo sono portati via, ed è finita lì.",
      source: 'trustpilot',
    },
  ] satisfies Testimonial[],
} as const;
