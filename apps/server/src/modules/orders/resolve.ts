/**
 * A checkout line, resolved against the catalogue and priced.
 *
 * This module is the reason the endpoint can be public. It reads a request of
 * pure CHOICES — a slug, answers, add-on ids, dates, a quantity — and rebuilds
 * the line from the catalogue: every label and every amount. The request
 * contributes no money at all, so a crafted body can change what is ordered and
 * never what it costs.
 *
 * It is deliberately STRICT where the storefront's display resolver is lenient.
 * `src/lib/request-config.ts` drops an answer it does not recognise, because a
 * summary page that shows one line fewer is better than one showing a choice we
 * cannot honour. Here the same input is a 422: the customer is about to be held
 * to this record, and silently ordering something narrower than they asked for is
 * the one outcome worse than failing.
 *
 * Worked examples of both walks: docs/code/orders-placement.md.
 */

import type { PlaceOrderItemInput } from '@mia/validators';
import {
  MAX_ADDON_QUANTITY,
  type RentalPeriod,
  addMoney,
  priceRequest,
  resolvePeriod,
} from '@mia/pricing';

import { httpError } from '../../shared/http/errors.ts';
import type {
  PublicAddonDto,
  PublicProductDetailDto,
  PublicQuestionDto,
  PublicRentalPackageDto,
} from '../products/dto.ts';
import { booleanLabel } from '../products/mapper.ts';

/** The wire values of a `boolean` intake answer, as the buy box writes them. */
const BOOLEAN_VALUES = new Set(['yes', 'no']);

/** How far out of today a rental may start. Loose on purpose — see `resolveRental`. */
const MAX_PAST_DAYS = 1;
const MAX_FUTURE_DAYS = 730;
const DAY_MS = 86_400_000;

export interface ResolvedAnswer {
  key: string;
  label: string;
  value: string;
}

export interface ResolvedAddon {
  id: string;
  name: string;
  mode: 'fixed' | 'rental';
  unitPrice: string;
  quantity: number;
  /** This add-on's contribution to the line, before the line quantity. */
  total: string;
}

/**
 * The `order_items.configuration` snapshot: what the customer configured, at the
 * labels they saw, with the amounts it was priced at.
 *
 * Labels are frozen here rather than read live from the catalogue, for the same
 * reason `productTitle` is a column: a rental agreement has to keep saying what
 * it said, even after the operator rewords the question.
 */
export interface OrderItemConfiguration {
  productId: string;
  productSlug: string;
  pricingMode: 'fixed' | 'rental';
  rentalUnit: 'hour' | 'day' | null;
  /**
   * The period as the package placed it. The end is derived, never sent — see
   * `resolvePeriod`. `startTime`/`endTime` are set only on an hour package.
   *
   * `startDate` and `endDate` keep their names because the admin rental calendar
   * reads them straight out of this jsonb (`repo.ts:findCalendarEntries`).
   */
  rental: RentalPeriod | null;
  rentalPackage: {
    code: string;
    name: string;
    label: string;
    price: string;
    duration: number;
    unit: 'hour' | 'day';
  } | null;
  /** The package, or the fixed price. Mirrors `order_items.unit_price`. */
  unitRate: string;
  answers: ResolvedAnswer[];
  addons: ResolvedAddon[];
}

export interface ResolvedLine {
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: string;
  total: string;
  currency: string;
  configuration: OrderItemConfiguration;
}

/** Every rejection here is the customer's request disagreeing with the catalogue. */
function reject(message: string, field: string): never {
  throw httpError(422, message, 'unprocessable_entity', { fields: { [field]: message } });
}

/**
 * The period this line runs for, or `null` on a product that is sold rather than
 * rented.
 *
 * A rental is its package, so the package is what has to be here: it carries the
 * duration, and the duration is what turns a start date into a return date and a
 * price into a total. Everything this refuses is a request that could not have
 * come from the buy box.
 */
function resolveRental(
  input: PlaceOrderItemInput,
  product: PublicProductDetailDto,
  pkg: PublicRentalPackageDto | null,
  field: string,
): RentalPeriod | null {
  if (product.pricing.mode !== 'rental') return null;

  if (!pkg) {
    reject('A rental needs a package — that is what sets its price.', `${field}.rentalPackageCode`);
  }
  if (!input.startDate) {
    reject('A rental needs a start date.', `${field}.startDate`);
  }
  if (pkg.unit === 'hour' && !input.startTime) {
    reject('A rental quoted in hours needs a start time.', `${field}.startTime`);
  }

  /* A loose sanity window, not a booking calendar: availability is settled on the
     phone, so this only refuses dates that cannot have been meant. Yesterday is
     allowed because the shop is in CEST and the server compares in UTC. */
  const start = Date.parse(`${input.startDate}T00:00:00.000Z`);
  const today = Date.now();
  if (start < today - MAX_PAST_DAYS * DAY_MS) {
    reject('That start date is in the past.', `${field}.startDate`);
  }
  if (start > today + MAX_FUTURE_DAYS * DAY_MS) {
    reject('That start date is too far ahead to take online.', `${field}.startDate`);
  }

  const period = resolvePeriod(input.startDate, input.startTime ?? null, pkg);
  if (!period) {
    reject('That start does not make a rental period.', `${field}.startDate`);
  }
  return period;
}

/** One intake answer, as the label the customer read and the value they gave. */
function resolveQuestion(
  question: PublicQuestionDto,
  raw: readonly string[],
  field: string,
): ResolvedAnswer[] {
  const values = raw.map((value) => value.trim()).filter((value) => value.length > 0);
  const at = `${field}.${question.key}`;

  if (values.length === 0) {
    if (question.isRequired) reject(`"${question.prompt}" is required.`, at);
    return [];
  }

  if (values.length > 1 && question.valueType !== 'multi_select') {
    reject(`"${question.prompt}" takes one value.`, at);
  }

  if (question.options.length > 0) {
    return values.map((value) => {
      const option = question.options.find((candidate) => candidate.value === value);
      if (!option) reject(`"${value}" is not an answer to "${question.prompt}".`, at);
      return { key: question.key, label: question.prompt, value: option.label };
    });
  }

  const [first] = values;
  if (first === undefined) return [];

  if (question.valueType === 'boolean') {
    const wire = first.toLowerCase();
    if (!BOOLEAN_VALUES.has(wire)) reject(`"${question.prompt}" takes yes or no.`, at);
    // The word the customer read, not the word the wire carried.
    return [
      { key: question.key, label: question.prompt, value: booleanLabel(wire === 'yes', 'it') },
    ];
  }

  if (question.valueType === 'number') {
    const numeric = Number(first);
    if (!Number.isFinite(numeric)) reject(`"${question.prompt}" takes a number.`, at);
    if (question.min !== null && numeric < question.min) {
      reject(`"${question.prompt}" cannot be below ${question.min}.`, at);
    }
    if (question.max !== null && numeric > question.max) {
      reject(`"${question.prompt}" cannot be above ${question.max}.`, at);
    }
    return [{ key: question.key, label: question.prompt, value: first }];
  }

  if (question.valueType === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(first)) {
    reject(`"${question.prompt}" takes a date as YYYY-MM-DD.`, at);
  }

  if (question.maxLength !== null && first.length > question.maxLength) {
    reject(`"${question.prompt}" is too long.`, at);
  }

  return [{ key: question.key, label: question.prompt, value: first }];
}

/** One requested add-on, matched to the catalogue and held to its own quantity bounds. */
interface RequestedAddon {
  addon: PublicAddonDto;
  quantity: number;
}

/**
 * The add-ons on this line: what the customer asked for, and nothing else.
 *
 * Add-ons used to be able to mark themselves required and fold themselves into
 * every line unasked; an extra the customer cannot decline is part of the
 * product's price, not an extra.
 *
 * A quantity above the add-on's own ceiling is REJECTED rather than clamped —
 * silently charging for two of something the customer asked for three of is the
 * kind of quiet disagreement this whole module exists to prevent.
 */
function resolveAddons(
  product: PublicProductDetailDto,
  requested: readonly { id: string; quantity: number }[],
  field: string,
): RequestedAddon[] {
  const seen = new Set<string>();

  return requested.map((entry) => {
    const addon = product.addons.find((candidate) => candidate.id === entry.id);
    if (!addon) {
      reject('That extra is not offered with this product.', `${field}.addons`);
    }
    if (seen.has(entry.id)) {
      reject('That extra was asked for twice.', `${field}.addons`);
    }
    seen.add(entry.id);

    const ceiling = addon.maxQuantity ?? MAX_ADDON_QUANTITY;
    if (entry.quantity > ceiling) {
      reject(`"${addon.name}" can be taken at most ${ceiling} times.`, `${field}.addons`);
    }

    return { addon, quantity: entry.quantity };
  });
}

/**
 * Resolves and prices one line.
 *
 * `product` is the same `PublicProductDetailDto` the storefront was rendered
 * from, so both sides read one shape — and the pricing rules themselves come from
 * `@mia/pricing`, which is what makes the figure on the confirm screen and the
 * figure in this line the same arithmetic.
 */
export function resolveLine(
  product: PublicProductDetailDto,
  input: PlaceOrderItemInput,
  field: string,
): ResolvedLine {
  /* An unknown question key is rejected rather than skipped: it means the form
     and the catalogue disagree, and guessing which one is right is not this
     module's call. */
  for (const key of Object.keys(input.answers)) {
    if (!product.questions.some((question) => question.key === key)) {
      reject(`"${key}" is not a question on this product.`, `${field}.answers.${key}`);
    }
  }

  const answers: ResolvedAnswer[] = [];
  for (const question of product.questions) {
    answers.push(
      ...resolveQuestion(question, input.answers[question.key] ?? [], `${field}.answers`),
    );
  }

  const addons = resolveAddons(product, input.addons, field);

  const rentalPackage =
    input.rentalPackageCode === undefined || input.rentalPackageCode === ''
      ? null
      : (product.rentalPackages.find((entry) => entry.code === input.rentalPackageCode) ??
        reject('That rental package is no longer offered.', `${field}.rentalPackageCode`));

  if (rentalPackage && product.pricing.mode !== 'rental') {
    reject('This product is not rented, so it has no packages.', `${field}.rentalPackageCode`);
  }

  const rental = resolveRental(input, product, rentalPackage, field);

  /* A point-in-time check, not a reservation: nothing decrements stock and
     nothing knows which dates a unit is already out on. It refuses an order for
     something the shelf says is gone, which is what a stale tab produces — the
     phone call still settles real availability. */
  if (!product.inStock) {
    reject(`"${product.title}" is out of stock.`, `${field}.productSlug`);
  }

  const priced = priceRequest({
    mode: product.pricing.mode,
    basePrice: product.pricing.price,
    rentalPackage,
    quantity: input.quantity,
    addons: addons.map((entry) => ({
      mode: entry.addon.pricing.mode,
      price: entry.addon.pricing.price,
      rentalUnit: entry.addon.pricing.rentalUnit,
      quantity: entry.quantity,
    })),
  });

  /* Unreachable via the checkout — `resolveRental` has already insisted on a
     package — but asserted rather than assumed, because it is the invariant the
     whole "a rental is its package" decision rests on. */
  if (priced.incomplete) {
    reject('This rental has no package, so it has no total.', `${field}.rentalPackageCode`);
  }

  /* The add-on amounts as priced, read back off the lines so this snapshot and
     the line total cannot disagree about what an extra cost. */
  const resolvedAddons: ResolvedAddon[] = addons.map((entry, index) => {
    const line = priced.lines.find((row) => row.kind === 'addon' && row.index === index);
    return {
      id: entry.addon.id,
      name: entry.addon.name,
      mode: entry.addon.pricing.mode,
      unitPrice: entry.addon.pricing.price,
      quantity: entry.quantity,
      total: line?.kind === 'addon' ? line.amount : '0.00',
    };
  });

  return {
    productId: product.id,
    productTitle: product.title,
    quantity: input.quantity,
    unitPrice: priced.unitRate,
    total: priced.total,
    currency: product.pricing.currency,
    configuration: {
      productId: product.id,
      productSlug: product.slug,
      pricingMode: product.pricing.mode,
      rentalUnit: product.pricing.rentalUnit,
      rental,
      rentalPackage,
      unitRate: priced.unitRate,
      answers,
      addons: resolvedAddons,
    },
  };
}

/** Sum of the resolved line totals — the order subtotal. */
export function sumLines(lines: readonly ResolvedLine[]): string {
  return addMoney('0.00', ...lines.map((line) => line.total));
}
