import { api } from '~/lib/api';
import { Resource } from '~/lib/resource.svelte';
import { unwrap } from '~/lib/request';
import type { Categories, LineCards, ProductPage, SaleMode } from './types';

const PER_PAGE = 12;

/**
 * The product browser's query and what it returned. Every filter change goes back
 * to page 1; the search is debounced by the Resource, so typing stays instant and
 * the grid follows a beat later. `highlight` is the card Enter would pick.
 */
export class ProductCatalog {
  query = $state('');
  category = $state('');
  mode = $state<SaleMode>('');
  page = $state(1);
  highlight = $state(0);

  results = new Resource<ProductPage, string>(
    () => JSON.stringify([this.query.trim(), this.category, this.mode, this.page]),
    async (key, signal) => {
      const [q, category, mode, page] = JSON.parse(key) as [string, string, SaleMode, number];
      const res = await api.api.admin.orders.manual.products.$get(
        {
          query: {
            ...(q ? { q } : {}),
            ...(category ? { category } : {}),
            ...(mode ? { mode } : {}),
            sort: q ? 'relevance' : 'best_selling',
            page: String(page),
            perPage: String(PER_PAGE),
          },
        },
        { init: { signal } },
      );
      const json = (await res.json()) as ProductPage;
      this.highlight = 0;
      return json;
    },
    { debounce: 250 },
  );

  categories = new Resource<Categories, string>(
    () => 'categories',
    async (_key, signal) => {
      const res = await api.api.categories.$get({ query: {} }, { init: { signal } });
      return await unwrap<Categories>(res);
    },
  );

  /** Nothing typed or filtered: the grid is the best sellers. */
  isDefault = $derived(!this.query.trim() && !this.category && !this.mode);

  rows = $derived<LineCards>(this.results.data?.data ?? []);
  meta = $derived(this.results.data?.meta);

  setQuery(value: string) {
    this.query = value;
    this.page = 1;
  }

  setCategory(code: string) {
    this.category = this.category === code ? '' : code;
    this.page = 1;
  }

  setMode(mode: SaleMode) {
    this.mode = this.mode === mode ? '' : mode;
    this.page = 1;
  }

  /** Arrow keys walk the cards without leaving the search box. */
  move(by: number) {
    const last = this.rows.length - 1;
    if (last < 0) return;
    this.highlight = Math.min(last, Math.max(0, this.highlight + by));
  }

  highlighted() {
    return this.rows[this.highlight];
  }
}
