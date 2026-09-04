/**
 * What the product costs: the rental packages or the outright price, and the
 * add-ons either may carry — both as tables, because a price list is read by
 * scanning a column.
 *
 * The `≈ per unit` column is the only computed figure on the whole page, and it
 * exists for one job — catching a mistyped package. Seven days at 30,00 € is
 * 4,29 € a day and 15 days at 35,00 € is 2,33 €, so a 15-day package priced at
 * 350,00 € stands out at a glance in a way a column of totals does not. It is a
 * review aid and nothing more: `lib/money.ts` is emphatic that no total is ever
 * derived from an authored amount, and this number is printed into an HTML file
 * and never written anywhere.
 */
import type {
  FixedAddon,
  ProductInput,
  RentalAddon,
  RentalPackageInput,
  SpecMap,
} from '../../lib/types.ts';
import type { AssetResolver } from './assets.ts';
import { escape, localized, money } from './html.ts';

const perUnit = (item: RentalPackageInput): string =>
  item.duration > 0 ? money(item.price / item.duration) : '—';

/** The headline strip that sits above the table: mode, unit, marketing rate. */
export function priceHeadline(product: ProductInput<SpecMap>): string {
  if (product.pricingMode === 'fixed') {
    return `<div class="headline">
      <span class="badge">fixed</span>
      <span class="headline-price">${money(product.basePrice)}</span>
      <span class="headline-note">bought outright</span>
    </div>`;
  }
  const rate = product.marketingRate;
  const cheapest = Math.min(...product.packages.map((item) => item.price));
  return `<div class="headline">
    <span class="badge">rental</span>
    <span class="headline-price">${money(cheapest)}</span>
    <span class="headline-note">cheapest of ${product.packages.length.toString()} packages · billed per ${escape(product.rentalUnit)}${
      rate === undefined ? '' : ` · marketing rate ${money(rate)}`
    }</span>
  </div>`;
}

export function packagesTable(product: ProductInput<SpecMap>): string {
  if (product.pricingMode !== 'rental') return '';
  const body = product.packages
    .map(
      (item) => `<tr>
        <td>${localized(item.name)}</td>
        <td><code>${escape(item.code)}</code></td>
        <td class="num">${item.duration.toString()} ${escape(item.unit)}</td>
        <td class="num price">${money(item.price)}</td>
        <td class="num muted">${perUnit(item)}</td>
      </tr>`,
    )
    .join('');

  return `<table class="packages">
    <thead><tr><th>Package</th><th>Code</th><th>Duration</th><th>Price</th><th>≈ per unit</th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

function addonRow(item: FixedAddon | RentalAddon, resolve: AssetResolver): string {
  const icon = item.icon ? resolve(item.icon) : null;
  const iconCell = icon?.exists
    ? `<img class="addon-icon" src="${icon.href}" alt="" loading="lazy">`
    : icon
      ? `<span class="bad">icon missing: ${escape(icon.ref)}</span>`
      : '';

  const price =
    item.pricingMode === 'rental'
      ? `${money(item.price)} <span class="muted">/ ${escape(item.rentalUnit)}</span>`
      : money(item.price);

  const quantity =
    item.maxQuantity === 1
      ? 'tick'
      : `${(item.minQuantity ?? 0).toString()}–${item.maxQuantity?.toString() ?? '∞'}`;

  return `<tr>
    <td>${iconCell}${localized(item.name)}${item.description ? `<span class="help">${localized(item.description)}</span>` : ''}</td>
    <td><code>${escape(item.pricingMode)}</code></td>
    <td class="num"><span class="flag">${escape(quantity)}</span></td>
    <td class="num price">${price}</td>
  </tr>`;
}

export function addonsTable(product: ProductInput<SpecMap>, resolve: AssetResolver): string {
  const list = product.addons ?? [];
  if (list.length === 0) return '';
  return `<table class="addons">
    <thead><tr><th>Add-on</th><th>Mode</th><th>Qty</th><th>Price</th></tr></thead>
    <tbody>${list.map((item) => addonRow(item, resolve)).join('')}</tbody>
  </table>`;
}

/** Chips are the two-to-five claims the card and the hero repeat. */
export function renderChips(product: ProductInput<SpecMap>): string {
  const chips = product.chips ?? [];
  if (chips.length === 0) return '';
  return `<ul class="chips">${chips.map((chip) => `<li>${localized(chip)}</li>`).join('')}</ul>`;
}
