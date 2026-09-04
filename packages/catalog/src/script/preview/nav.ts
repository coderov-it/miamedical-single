/**
 * The two floating controls: the category rail at top left, the language toggle
 * at top right.
 *
 * The rail is a category picker plus a button that opens the outline — the full
 * product titles of the selected category, each free to wrap onto as many lines
 * as it needs. Truncating them with an ellipsis would defeat the point: half of
 * these titles differ only in their last two words (`… ad autospinta - SLIM` vs
 * `… di transito – SLIM`), so a clipped list is a list you cannot navigate.
 *
 * Every category's outline is rendered up front and hidden; picking a category
 * swaps which one is shown. That keeps navigation instant and keeps the file
 * one file — there is no fetch to make from a `file://` page.
 */
import type { CategoryEntry } from './category.ts';
import { escape, localized } from './html.ts';

function outline(entry: CategoryEntry): string {
  const products = entry.products
    .map(
      (product) => `<li>
        <a href="#/${escape(product.route)}" data-route="${escape(product.route)}">
          <span class="outline-title">${localized(product.title)}</span>
          <span class="outline-meta"><code>${escape(product.code)}</code><span class="flag status-${escape(product.status)}">${escape(product.status)}</span></span>
        </a>
      </li>`,
    )
    .join('');

  return `<div class="outline-panel" data-outline-for="${escape(entry.code)}" hidden>
    <a class="outline-overview" href="#/${escape(entry.route)}" data-route="${escape(entry.route)}">
      Category overview — ${localized(entry.name)}
    </a>
    <ol class="outline-list">${products}</ol>
    <a class="outline-overview" href="#/terms" data-route="terms">Terms documents</a>
  </div>`;
}

/** Top left: pick a category, then open the outline of its products. */
export function renderRail(entries: readonly CategoryEntry[]): string {
  const options = entries
    .map(
      (entry) =>
        `<option value="${escape(entry.code)}">${escape(entry.name.it)} — ${entry.products.length.toString()}</option>`,
    )
    .join('');

  return `<div class="chrome chrome-left">
    <div class="rail">
      <select class="rail-select" id="category" name="category" data-category-select aria-label="Category">${options}</select>
      <button type="button" class="rail-button" data-menu-toggle aria-expanded="false" aria-label="Product outline">
        <span class="bars"></span>
      </button>
    </div>
    <div class="outline" data-outline hidden>${entries.map(outline).join('')}</div>
  </div>`;
}

/** Top right: which language every piece of copy on the page shows. */
export function renderLanguageToggle(): string {
  return `<div class="chrome chrome-right">
    <div class="lang" role="group" aria-label="Content language">
      <button type="button" data-lang-set="it" class="on">IT</button>
      <button type="button" data-lang-set="en">EN</button>
    </div>
  </div>`;
}
