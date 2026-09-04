/**
 * What the run says out loud: the summary lines, the failure lists, and the
 * per-object progress of the media pass.
 *
 * Kept apart from `index.ts` so that file stays the plan — flags, order, exit
 * code — and nothing about column widths.
 */
import type { CatalogPlan } from './planned.ts';

/** Long lists are truncated: sixty lines is a report, six hundred is a wall. */
const LIMIT = 60;

export function report(headline: string, lines: readonly string[]): void {
  console.error(`\n${String(lines.length)} ${headline}:\n`);
  for (const line of lines.slice(0, LIMIT)) console.error(`  ${line}`);
  if (lines.length > LIMIT) console.error(`  … and ${String(lines.length - LIMIT)} more`);
}

export function list(headline: string, lines: readonly string[], limit = 20): void {
  if (lines.length === 0) return;
  console.log(`${headline.padEnd(21)}${String(lines.length)}`);
  for (const line of lines.slice(0, limit)) console.log(`  ${line}`);
  if (lines.length > limit) console.log(`  … and ${String(lines.length - limit)} more`);
}

/**
 * A slug is a public URL. One the run had to invent from a title is printed
 * every time, because "it appeared in the database and nobody chose it" is how
 * a catalogue ends up with URLs nobody can change later without a redirect.
 */
export function announceDerivedSlugs(plan: CatalogPlan): void {
  const derived: string[] = [];
  for (const category of plan.categories) {
    for (const [lang, translation] of Object.entries(category.translations)) {
      if (translation.slugDerived) derived.push(`${category.code} (${lang}) → ${translation.slug}`);
    }
  }
  for (const product of plan.products) {
    for (const [lang, translation] of Object.entries(product.translations)) {
      if (translation.slugDerived) derived.push(`${product.code} (${lang}) → ${translation.slug}`);
    }
  }
  list('slugs derived', derived);
}

export function printPlan(plan: CatalogPlan, objects: number): void {
  const sum = (pick: (product: CatalogPlan['products'][number]) => number): number =>
    plan.products.reduce((total, product) => total + pick(product), 0);
  const overCategories = (pick: (category: CatalogPlan['categories'][number]) => number): number =>
    plan.categories.reduce((total, category) => total + pick(category), 0);

  const rows: [string, number][] = [
    ['terms_documents', plan.terms.length],
    [
      'terms_translations',
      plan.terms.reduce((n, document) => n + Object.keys(document.translations).length, 0),
    ],
    ['categories', plan.categories.length],
    ['category_translations', overCategories((c) => Object.keys(c.translations).length)],
    ['category_specs', overCategories((c) => c.specs.length)],
    [
      'category_spec_options',
      overCategories((c) => c.specs.reduce((m, spec) => m + spec.options.length, 0)),
    ],
    ['products', plan.products.length],
    ['product_translations', sum((product) => Object.keys(product.translations).length)],
    ['product_spec_values', sum((product) => product.specValues.length)],
    ['product_addons', sum((product) => product.addons.length)],
    ['product_faqs', sum((product) => product.faqs.length)],
    ['product_questions', sum((product) => product.questions.length)],
    ['product_terms', sum((product) => product.termsIds.length)],
    ['R2 objects', objects],
  ];

  console.log('\nwould write:');
  for (const [label, count] of rows) console.log(`  ${label.padEnd(23)}${String(count)}`);
  console.log('\nDry run — nothing written.');
}

/** `[  12/240] up    products/…/1a2b3c4d-carrozzina.webp   84 kB` */
export function objectLogger(total: number) {
  let seen = 0;
  const width = String(total).length;
  return (verb: 'up' | 'reuse' | 'fail', subject: string, detail?: string): void => {
    seen += 1;
    const counter = `[${String(seen).padStart(width)}/${String(total)}]`;
    const line = `${counter} ${verb.padEnd(5)} ${subject}${detail ? `   ${detail}` : ''}`;
    if (verb === 'fail') console.error(line);
    else console.log(line);
  };
}
