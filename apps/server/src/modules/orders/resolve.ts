/**
 * A checkout line, resolved against the catalogue and priced.
 *
 * This module is the reason the endpoint can be public. It reads a request of
 * pure CHOICES — a slug, option values, add-on ids, dates, a quantity — and
 * rebuilds the line from the catalogue: every label, every amount, the SKU. The
 * request contributes no money at all, so a crafted body can change what is
 * ordered and never what it costs.
 *
 * It is deliberately STRICT where the storefront's display resolver is lenient.
 * `src/lib/request-config.ts` drops an option it does not recognise, because a
 * summary page that shows one line fewer is better than one showing a choice we
 * cannot honour. Here the same input is a 422: the customer is about to be held
 * to this record, and silently ordering something narrower than they asked for is
 * the one outcome worse than failing.
 *
 * Worked examples of both walks: docs/code/orders-placement.md.
 */

import type { PlaceOrderItemInput } from '@mia/validators';
import { type PriceModifier, addMoney, matchSku, mulMoney, priceRequest } from '@mia/pricing';

import { httpError } from '../../shared/http/errors.ts';
import type {
  PublicAddonDto,
  PublicProductDetailDto,
  PublicQuestionDto,
  PublicVariantGroupDto,
} from '../products/dto.ts';
import { booleanLabel } from '../products/mapper.ts';

/** The wire values of a `boolean` intake answer, as the buy box writes them. */
const BOOLEAN_VALUES = new Set(['yes', 'no']);

/** How far out of today a rental period may sit. Loose on purpose — see `assertPeriod`. */
const MAX_PAST_DAYS = 1;
const MAX_FUTURE_DAYS = 730;
const DAY_MS = 86_400_000;

export interface ResolvedSelection {
  key: string;
  label: string;
  value: string;
  /** The choice's price effect, per rental unit on a rental product. */
  amount: string;
}

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
  /** This add-on's contribution to the line, before the line quantity. */
  total: string;
}

/**
 * The `order_items.configuration` snapshot: what the customer configured, at the
 * labels they saw, with the amounts it was priced at.
 *
 * Labels are frozen here rather than read live through the SKU, for the same
 * reason `productTitle` is a column: a rental agreement has to keep saying what
 * it said, even after the operator renames the option.
 */
export interface OrderItemConfiguration {
  productId: string;
  productSlug: string;
  pricingMode: 'fixed' | 'rental';
  rentalUnit: 'hour' | 'day' | null;
  /** `units` is what the line was priced on — days for a `day` product. */
  rental: { startDate: string; endDate: string | null; units: number } | null;
  rentalPackage: {
    code: string;
    name: string;
    label: string;
    price: string;
    duration: number;
    unit: 'hour' | 'day';
  } | null;
  /** The configured rate, per rental unit. Mirrors `order_items.unit_price`. */
  unitRate: string;
  selections: ResolvedSelection[];
  answers: ResolvedAnswer[];
  addons: ResolvedAddon[];
}

export interface ResolvedLine {
  productId: string;
  productTitle: string;
  skuId: string | null;
  sku: string;
  skuLabel: string;
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
 * A rental period has to establish a DURATION, or the line has no total — only a
 * per-unit rate. A package supplies one on its own; otherwise both dates are
 * required. This is the rule that keeps `orders.total` a figure someone can be
 * held to, rather than a rate wearing a total's clothes.
 */
function assertPeriod(
  input: PlaceOrderItemInput,
  product: PublicProductDetailDto,
  hasPackage: boolean,
  field: string,
): void {
  if (product.pricing.mode !== 'rental') return;

  if (!input.startDate) {
    reject('A rental needs a start date.', `${field}.startDate`);
  }

  if (!hasPackage && !input.endDate) {
    reject('A rental needs a return date.', `${field}.endDate`);
  }

  if (input.endDate && input.endDate < input.startDate) {
    reject('The return date cannot come before the start date.', `${field}.endDate`);
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
}

/**
 * One variant group's chosen values, as labels and amounts.
 *
 * Numeric groups price at `value × priceModifierPerUnit`, which is why they never
 * join the SKU matrix: the matrix has one row per combination, and a number has
 * no finite set of them.
 */
function resolveGroup(
  group: PublicVariantGroupDto,
  raw: readonly string[],
  field: string,
): ResolvedSelection[] {
  const values = raw.map((value) => value.trim()).filter((value) => value.length > 0);

  if (values.length === 0) {
    if (group.isRequired) reject(`"${group.label}" is required.`, `${field}.${group.key}`);
    return [];
  }

  if (values.length > 1 && group.valueType !== 'multi_select') {
    reject(`"${group.label}" takes one value.`, `${field}.${group.key}`);
  }

  if (group.options.length > 0) {
    return values.map((value) => {
      const option = group.options.find((candidate) => candidate.value === value);
      if (!option) {
        reject(`"${value}" is not an option for "${group.label}".`, `${field}.${group.key}`);
      }
      return {
        key: group.key,
        label: group.label,
        value: option.label,
        amount: option.priceModifier.amount,
      };
    });
  }

  const [first] = values;
  if (first === undefined) return [];

  if (group.valueType === 'number' || group.valueType === 'number_range') {
    const numeric = Number(first);
    if (!Number.isFinite(numeric)) {
      reject(`"${group.label}" takes a number.`, `${field}.${group.key}`);
    }
    if (group.min !== null && numeric < group.min) {
      reject(`"${group.label}" cannot be below ${group.min}.`, `${field}.${group.key}`);
    }
    if (group.max !== null && numeric > group.max) {
      reject(`"${group.label}" cannot be above ${group.max}.`, `${field}.${group.key}`);
    }
    return [
      {
        key: group.key,
        label: group.label,
        value: group.unit ? `${first} ${group.unit}` : first,
        amount: group.priceModifierPerUnit
          ? mulMoney(group.priceModifierPerUnit.amount, first)
          : '0.00',
      },
    ];
  }

  return [{ key: group.key, label: group.label, value: first, amount: '0.00' }];
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

/**
 * The add-ons on this line: everything the customer asked for, plus every add-on
 * the product marks required — those are part of the rental whether or not the
 * form remembered to send them.
 */
function resolveAddons(
  product: PublicProductDetailDto,
  requested: readonly string[],
  field: string,
): PublicAddonDto[] {
  for (const id of requested) {
    if (!product.addons.some((addon) => addon.id === id)) {
      reject('That extra is not offered with this product.', `${field}.addonIds`);
    }
  }

  /* What was asked for, and nothing else. Add-ons used to be able to mark
     themselves required and fold themselves into every line unasked; an extra the
     customer cannot decline is part of the product's price, not an extra. */
  return product.addons.filter((addon) => requested.includes(addon.id));
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
  /* An unknown group or question key is rejected rather than skipped: it means
     the form and the catalogue disagree, and guessing which one is right is not
     this module's call. */
  for (const key of Object.keys(input.variants)) {
    if (!product.variants.some((group) => group.key === key)) {
      reject(`"${key}" is not a choice on this product.`, `${field}.variants.${key}`);
    }
  }
  for (const key of Object.keys(input.answers)) {
    if (!product.questions.some((question) => question.key === key)) {
      reject(`"${key}" is not a question on this product.`, `${field}.answers.${key}`);
    }
  }

  const selections: ResolvedSelection[] = [];
  const modifiers: PriceModifier[] = [];
  /** `{ groupKey: [optionValue] }` for the sku-affecting groups only. */
  const skuSelection: Record<string, string[]> = {};

  for (const group of product.variants) {
    const raw = input.variants[group.key] ?? [];
    const resolved = resolveGroup(group, raw, `${field}.variants`);
    selections.push(...resolved);

    for (const entry of resolved) {
      modifiers.push({ amount: entry.amount, affectsSku: group.affectsSku });
    }

    if (group.affectsSku && raw.length > 0) {
      skuSelection[group.key] = raw.map((value) => value.trim());
    }
  }

  const answers: ResolvedAnswer[] = [];
  for (const question of product.questions) {
    answers.push(
      ...resolveQuestion(question, input.answers[question.key] ?? [], `${field}.answers`),
    );
  }

  const addons = resolveAddons(product, input.addonIds, field);

  const rentalPackage =
    input.rentalPackageCode === undefined || input.rentalPackageCode === ''
      ? null
      : (product.rentalPackages.find((entry) => entry.code === input.rentalPackageCode) ??
        reject('That rental package is no longer offered.', `${field}.rentalPackageCode`));

  if (rentalPackage && product.pricing.mode !== 'rental') {
    reject('This product is not rented, so it has no packages.', `${field}.rentalPackageCode`);
  }

  assertPeriod(input, product, rentalPackage !== null, field);

  const matched = matchSku(product.skus, skuSelection);

  const priced = priceRequest({
    mode: product.pricing.mode,
    rentalUnit: product.pricing.rentalUnit,
    basePrice: product.pricing.price,
    skuPrice: matched?.price.amount ?? null,
    modifiers,
    rentalPackage,
    startDate: input.startDate ?? '',
    endDate: input.endDate ?? '',
    quantity: input.quantity,
    addons: addons.map((addon) => ({ mode: addon.pricing.mode, price: addon.pricing.price })),
  });

  /* Unreachable via the checkout — `assertPeriod` has already insisted on a
     duration — but asserted rather than assumed, because it is the invariant the
     whole "no open-period orders" decision rests on. */
  if (priced.openPeriod) {
    reject('This rental has no duration, so it has no total.', `${field}.endDate`);
  }

  /* The add-on amounts as priced, read back off the lines so this snapshot and
     the line total cannot disagree about what an extra cost. */
  const resolvedAddons: ResolvedAddon[] = addons.map((addon, index) => {
    const line = priced.lines.find((entry) => entry.kind === 'addon' && entry.index === index);
    return {
      id: addon.id,
      name: addon.name,
      mode: addon.pricing.mode,
      unitPrice: addon.pricing.price,
      total: line?.kind === 'addon' ? line.amount : '0.00',
    };
  });

  const skuLabel = selections.map((entry) => entry.value).join(' · ');

  return {
    productId: product.id,
    productTitle: product.title,
    skuId: matched?.id ?? null,
    // No SKU matched — an unconfigured product, or a partial selection. The base
    // SKU still names what was ordered, which is what this column is for.
    sku: matched?.sku ?? product.baseSku,
    skuLabel,
    quantity: input.quantity,
    unitPrice: priced.unitRate,
    total: priced.total,
    currency: product.pricing.currency,
    configuration: {
      productId: product.id,
      productSlug: product.slug,
      pricingMode: product.pricing.mode,
      rentalUnit: product.pricing.rentalUnit,
      rental:
        product.pricing.mode === 'rental' && input.startDate
          ? {
              startDate: input.startDate,
              endDate: input.endDate ?? null,
              units: priced.units ?? 0,
            }
          : null,
      rentalPackage,
      unitRate: priced.unitRate,
      selections,
      answers,
      addons: resolvedAddons,
    },
  };
}

/** Sum of the resolved line totals — the order subtotal. */
export function sumLines(lines: readonly ResolvedLine[]): string {
  return addMoney('0.00', ...lines.map((line) => line.total));
}
