/**
 * "Aiutami a scegliere" — the guided selector, ported from the live site.
 *
 * Three one-tap questions (what the person needs to do · where · for how long)
 * narrow the catalogue to a shortlist. Rules are DATA so the merchant's wording
 * and the mapping can be tuned here without touching a template.
 *
 * The whole flow is URL state and plain links: `?activity=…&place=…&duration=…`
 * is one answer per step, every option is an `<a>`, and the browser's own back
 * button walks the flow backwards. No client JavaScript, every state is deep
 * linkable, and the results come from the same cached catalogue read the home
 * page already pays for.
 *
 * Rules, the fallback ladder and the two-taxonomy category table are written up
 * in docs/code/storefront-product-finder.md.
 */
import type { Category, ProductSummary } from './catalog.ts';
import type { SiteLocale } from './i18n.ts';
import { routePath } from './routes.ts';

export type FinderActivity = 'move' | 'walk' | 'bed' | 'transfer' | 'therapy' | 'stairs';
export type FinderPlace = 'home' | 'outdoors' | 'both';
export type FinderDuration = 'weeks' | 'months' | 'long' | 'unsure';

/** The four screens, in order. `results` is the one that is not a question. */
export const FINDER_STEPS = ['activity', 'place', 'duration', 'results'] as const;
export type FinderStep = (typeof FINDER_STEPS)[number];

export interface FinderAnswers {
  activity: FinderActivity | null;
  place: FinderPlace | null;
  duration: FinderDuration | null;
  /** Results screen only: list every match instead of the first page of them. */
  showAll: boolean;
}

/**
 * An activity, and the categories it means.
 *
 * `categories` NAMES CODES FROM BOTH TAXONOMIES ON PURPOSE. The database still
 * carries the eighteen Italian-coded categories the site launched with, while
 * `packages/catalog` has been rebuilt as thirty-four English-coded ones that
 * nothing has synced yet. A code that is not in the catalogue costs nothing —
 * `categorySlugs()` keeps only what the API actually returned — so this table
 * answers correctly today and keeps answering correctly the day the sync runs.
 * Drop the Italian half once that has happened.
 *
 * `byPlace` is the second question's narrowing, and only mobility has one:
 * indoors means a manual chair and outdoors means a powered one. Every other
 * activity ignores the answer, exactly as the live site does — the question is
 * asked of everyone because the flow is three questions, and dropping it for
 * five of six activities would make the step bar lie about how far along the
 * customer is.
 */
interface ActivityRule {
  id: FinderActivity;
  categories: readonly string[];
  byPlace?: Partial<Record<FinderPlace, readonly string[]>>;
}

const WHEELCHAIRS = ['carrozzine', 'wheelchairs-hire', 'wheelchairs-sale'] as const;
const POWERED = [
  'carrozzine-elettriche-e-scooter',
  'electric-wheelchairs-and-scooters-hire',
  'electric-wheelchairs-sale',
  'mobility-scooters-sale',
] as const;

export const ACTIVITY_RULES: readonly ActivityRule[] = [
  {
    id: 'move',
    categories: [...WHEELCHAIRS, ...POWERED, 'ausili-per-la-mobilita'],
    byPlace: { home: WHEELCHAIRS, outdoors: POWERED },
  },
  { id: 'walk', categories: ['deambulatori-e-rollatori', 'walkers-hire', 'walkers-sale'] },
  {
    id: 'bed',
    categories: [
      'letti-ortopedici-ospedalieri',
      'materassi-antidecubito-ad-alto-rischio',
      'hospital-beds-hire',
      'hospital-beds-sale',
      'pressure-relief-mattresses-hire',
      'pressure-relief-mattresses-sale',
      'recliner-armchairs-sale',
    ],
  },
  {
    id: 'transfer',
    categories: [
      'sollevatori',
      'verticalizzatori',
      'patient-lifts-hire',
      'patient-lifts-sale',
      'standing-frames-hire',
      'standing-frames-sale',
    ],
  },
  {
    id: 'therapy',
    categories: [
      'magnetoterapia',
      'kinetec',
      'tens-elettrostimolatore',
      'ultrasuono',
      'cryoterapia',
      'criomagnetoterapia',
      'pressoterapia',
      'elettromedicali',
      'magnetotherapy-hire',
      'magnetotherapy-sale',
      'kinetec-hire',
      'tens-hire',
      'tens-sale',
      'ultrasound-hire',
      'ultrasound-sale',
      'cryotherapy-hire',
      'cryotherapy-sale',
      'cryomagnetotherapy-hire',
      'pressotherapy-hire',
      'pressotherapy-sale',
      'electromedical-sale',
    ],
  },
  { id: 'stairs', categories: ['montascale', 'stairlifts-hire', 'stairlifts-sale'] },
];

export const PLACE_IDS: readonly FinderPlace[] = ['home', 'outdoors', 'both'];
export const DURATION_IDS: readonly FinderDuration[] = ['weeks', 'months', 'long', 'unsure'];

/**
 * What a duration means commercially. Weeks and months are a rental question;
 * "long term" and "not sure yet" are not, so both keep the whole catalogue.
 */
const DURATION_MODE: Record<FinderDuration, ProductSummary['pricing']['mode'] | null> = {
  weeks: 'rental',
  months: 'rental',
  long: null,
  unsure: null,
};

/**
 * One answer, ready to render: what it says and where tapping it goes.
 *
 * Built by the page rather than here because the labels are i18n and the URLs
 * depend on the answers already given — this file owns the rules, not the copy.
 */
export interface FinderOption {
  id: string;
  label: string;
  hint: string;
  /** Object-storage path of the photo beside the label, when there is one. */
  imagePath?: string | null;
  href: string;
}

// --- URL state ----------------------------------------------------------------

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.find((candidate) => candidate === value) ?? null;
}

const ACTIVITY_IDS = ACTIVITY_RULES.map((rule) => rule.id);

/** An unknown answer is no answer: the flow reopens that question rather than
    guessing, so a hand-edited or stale URL can never reach a wrong shortlist. */
export function readFinderAnswers(url: URL): FinderAnswers {
  const params = url.searchParams;
  return {
    activity: pick(params.get('activity'), ACTIVITY_IDS),
    place: pick(params.get('place'), PLACE_IDS),
    duration: pick(params.get('duration'), DURATION_IDS),
    showAll: params.get('all') === '1',
  };
}

/**
 * The first question with no answer — which is also the screen to render.
 *
 * Answers are read in order and the first gap wins, so a URL that skips a step
 * (`?activity=move&duration=weeks`) asks the skipped question rather than
 * quietly answering it.
 */
export function currentStep(answers: FinderAnswers): FinderStep {
  if (!answers.activity) return 'activity';
  if (!answers.place) return 'place';
  if (!answers.duration) return 'duration';
  return 'results';
}

/** A finder URL for exactly these answers. Answers past a gap are dropped. */
export function finderPath(locale: SiteLocale, answers: Partial<FinderAnswers>): string {
  const search = new URLSearchParams();
  if (answers.activity) search.set('activity', answers.activity);
  if (answers.activity && answers.place) search.set('place', answers.place);
  if (answers.activity && answers.place && answers.duration) {
    search.set('duration', answers.duration);
    if (answers.showAll) search.set('all', '1');
  }
  const qs = search.toString();
  const base = routePath(locale, 'productFinder');
  return qs ? `${base}?${qs}` : base;
}

/** The URL of the step before this one — what "Indietro" points at. */
export function previousPath(locale: SiteLocale, answers: FinderAnswers): string | null {
  const step = currentStep(answers);
  if (step === 'activity') return null;
  if (step === 'place') return finderPath(locale, {});
  if (step === 'duration') return finderPath(locale, { activity: answers.activity });
  return finderPath(locale, { activity: answers.activity, place: answers.place });
}

// --- matching -----------------------------------------------------------------

/**
 * Group codes resolved to the category slugs a product summary carries.
 *
 * A summary names its category by SLUG, not by code, and the slug is localized —
 * so the codes are translated through the categories the API returned for this
 * same request rather than assumed to be spelled the same.
 */
function categorySlugs(categories: Category[], codes: readonly string[]): Set<string> {
  const wanted = new Set(codes);
  return new Set(
    categories.filter((category) => wanted.has(category.code)).map((category) => category.slug),
  );
}

export interface FinderMatch {
  /** Every product that matched, in catalogue order — in stock first. */
  items: ProductSummary[];
  /** Which narrowing had to be dropped to find anything, if any. */
  relaxed: 'place' | 'duration' | null;
  /** The pricing mode still in force, for the "browse the catalogue" link. */
  mode: ProductSummary['pricing']['mode'] | null;
}

/**
 * The shortlist, with the live site's fallback ladder.
 *
 * Results never come back empty on a technicality: a place-of-use narrowing
 * that leaves nothing is dropped first, then a rental-only filter, in that
 * order, before giving up. What was dropped is reported so the results screen
 * can say so rather than silently showing something the customer did not ask
 * for.
 */
export function matchProducts(
  products: ProductSummary[],
  categories: Category[],
  answers: FinderAnswers,
): FinderMatch {
  const rule = ACTIVITY_RULES.find((candidate) => candidate.id === answers.activity);
  if (!rule) return { items: [], relaxed: null, mode: null };

  const narrowed = answers.place ? rule.byPlace?.[answers.place] : undefined;
  const mode = answers.duration ? DURATION_MODE[answers.duration] : null;

  const run = (codes: readonly string[], withMode: ProductSummary['pricing']['mode'] | null) => {
    const slugs = categorySlugs(categories, codes);
    const matched = products.filter(
      (product) =>
        slugs.has(product.category.slug) &&
        (withMode === null || product.pricing.mode === withMode),
    );
    /* Out of stock stays in the shortlist with its honest "esaurito" card — it
       sells less than an available one, an empty answer sells nothing at all. */
    return [...matched.filter((p) => p.inStock), ...matched.filter((p) => !p.inStock)];
  };

  if (narrowed) {
    const exact = run(narrowed, mode);
    if (exact.length > 0) return { items: exact, relaxed: null, mode };
  }

  const withoutPlace = run(rule.categories, mode);
  if (withoutPlace.length > 0) {
    return { items: withoutPlace, relaxed: narrowed ? 'place' : null, mode };
  }

  const withoutMode = run(rule.categories, null);
  return {
    items: withoutMode,
    relaxed: withoutMode.length > 0 && mode !== null ? 'duration' : null,
    mode: withoutMode.length > 0 ? null : mode,
  };
}

/**
 * The image beside an activity — its leading category's icon.
 *
 * Icons are tried in the order the rule lists its categories, so an activity is
 * pictured by the thing it mostly means: mobility by a wheelchair, not by a
 * scooter. A category with no icon falls back to a product photo from inside
 * the group, which is what the live site does; an activity with neither renders
 * text only rather than an empty well.
 */
export function activityImage(
  products: ProductSummary[],
  categories: Category[],
  activity: FinderActivity,
): string | null {
  const rule = ACTIVITY_RULES.find((candidate) => candidate.id === activity);
  if (!rule) return null;

  const byCode = new Map(categories.map((category) => [category.code, category]));
  for (const code of rule.categories) {
    const icon = byCode.get(code)?.icon;
    if (icon) return icon;
  }

  const slugs = categorySlugs(categories, rule.categories);
  const found = products.find(
    (product) => slugs.has(product.category.slug) && product.thumbnail !== null,
  );
  return found?.thumbnail?.path ?? null;
}
