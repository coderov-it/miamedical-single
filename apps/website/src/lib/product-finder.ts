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
import {
  categorySlugs,
  findProductType,
  productTypeImage,
  type ProductTypeId,
} from './product-types.ts';
import { routePath } from './routes.ts';

/**
 * The six questions the live site asks, which are the first six product types.
 *
 * The catalogue's strip carries two more — daily living and second-hand — and
 * they stay out of here on purpose: this flow is three questions ported from the
 * live site, and neither is an answer to "what does the person need to do".
 */
const FINDER_ACTIVITIES = ['move', 'walk', 'bed', 'transfer', 'therapy', 'stairs'] as const;

export type FinderActivity = (typeof FINDER_ACTIVITIES)[number];
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
 * `categories` IS NOT WRITTEN HERE ANY MORE. An activity is one of the
 * catalogue's product types, so the category sets live once in
 * `product-types.ts` and this flow reads them — the shortlist for "spostarsi"
 * and the listing behind the "Muoversi" tile can no longer answer differently.
 *
 * `byPlace` is the second question's narrowing, and only mobility has one:
 * indoors means a manual chair and outdoors means a powered one, which is
 * exactly the split the `move` type already draws between its two groups. Every
 * other activity ignores the answer, exactly as the live site does — the
 * question is asked of everyone because the flow is three questions, and
 * dropping it for five of six activities would make the step bar lie about how
 * far along the customer is.
 */
interface ActivityRule {
  id: FinderActivity;
  categories: readonly string[];
  byPlace?: Partial<Record<FinderPlace, readonly string[]>>;
}

const groupCategories = (typeId: ProductTypeId, groupId: string): readonly string[] =>
  findProductType(typeId)?.groups.find((group) => group.id === groupId)?.categories ?? [];

const PLACE_NARROWING: Partial<Record<FinderActivity, ActivityRule['byPlace']>> = {
  move: {
    home: groupCategories('move', 'wheelchairs'),
    outdoors: groupCategories('move', 'powered-wheelchairs'),
  },
};

export const ACTIVITY_RULES: readonly ActivityRule[] = FINDER_ACTIVITIES.map((id) => {
  const categories = findProductType(id)?.categories ?? [];
  const byPlace = PLACE_NARROWING[id];
  return byPlace ? { id, categories, byPlace } : { id, categories };
});

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
 * The image beside an activity — the same picture its tile wears in the
 * catalogue's type strip, because it is the same set of categories.
 */
export function activityImage(
  products: ProductSummary[],
  categories: Category[],
  activity: FinderActivity,
): string | null {
  const type = findProductType(activity);
  return type ? productTypeImage(type, categories, products) : null;
}
