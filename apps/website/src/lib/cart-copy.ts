/**
 * Every word the cart island renders, resolved on the server.
 *
 * Split from `cart.ts`, which prices lines; this file only names things.
 * Callers import it through `cart.ts`, which re-exports it.
 */
import { t } from './labels.ts';

/**
 * Every Italian word the cart island renders, resolved here and handed over as a
 * prop.
 *
 * The island is a `.svelte` file and the project rule is that code holds English
 * identifiers only — so rather than let it call `t()` (which would also pull
 * `@mia/i18n` into the client bundle for a page that needs none of it), the words
 * are resolved on the server and travel as data. The island contains no Italian at
 * all, which is exactly the rule.
 *
 * `{}` slots are filled in the island, so the placeholder names are part of this
 * contract: `removeNamed` must keep `{title}`, `countMany` must keep `{count}`.
 */
export interface CartCopy {
  countOne: string;
  countMany: string;
  heading: string;
  lead: string;
  summary: string;
  subtotal: string;
  deliveryLabel: string;
  deliveryPending: string;
  total: string;
  vatIncluded: string;
  noPackageNote: string;
  goToCheckout: string;
  dueToday: string;
  dueTodayNote: string;
  continueBrowsing: string;
  remove: string;
  removeNamed: string;
  increase: string;
  decrease: string;
  quantityOf: string;
  updated: string;
  loading: string;
  /** The first paint's word, before the store has been read. */
  booting: string;
  offline: string;
  unavailableOne: string;
  unavailableMany: string;
  emptyTitle: string;
  emptyDetail: string;
  goToCatalog: string;
}

export function cartCopy(): CartCopy {
  return {
    countOne: t('cartCountOne'),
    countMany: t('cartCountMany'),
    heading: t('cart'),
    lead: t('cartLead'),
    summary: t('cartSummary'),
    subtotal: t('cartSubtotal'),
    deliveryLabel: t('delivery'),
    deliveryPending: t('cartDeliveryPending'),
    total: t('total'),
    vatIncluded: t('vatIncluded'),
    noPackageNote: t('estimateNoPackage'),
    goToCheckout: t('goToCheckout'),
    dueToday: t('cartDueToday'),
    dueTodayNote: t('cartDueTodayNote'),
    continueBrowsing: t('continueBrowsing'),
    remove: t('remove'),
    removeNamed: t('removeNamed'),
    increase: t('increaseQuantity'),
    decrease: t('decreaseQuantity'),
    quantityOf: t('quantityOf'),
    updated: t('cartUpdated'),
    loading: t('cartLoading'),
    booting: t('cartBooting'),
    offline: t('cartOffline'),
    unavailableOne: t('cartLineUnavailableOne'),
    unavailableMany: t('cartLineUnavailableMany'),
    emptyTitle: t('cartEmpty'),
    emptyDetail: t('cartEmptyDetail'),
    goToCatalog: t('goToCatalog'),
  };
}
