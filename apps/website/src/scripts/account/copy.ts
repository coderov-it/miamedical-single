/**
 * The browser half of `lib/account-page.ts`: reads the copy blob the page
 * server-rendered, so a client-rendered order list speaks the page's language.
 *
 * It never falls back to a literal. A missing blob means the page forgot to
 * render `<AccountCopy>`, and an Italian default would hide that on the Italian
 * storefront and surface it only in English — the failure this whole pass
 * exists to end.
 */
export interface AccountCopyData {
  /** Keyed by the short message name — `copy.text.retry`, never the full key. */
  text: Record<string, string>;
  /* Spelled out rather than indexed: a route is navigation, and a typo that
     resolves to `undefined` would send the reader to "undefined". */
  routes: {
    home: string;
    login: string;
    account: string;
    accountOrders: string;
    catalog: string;
    /** `{number}` stands in for the order number — fill it with `fill()`. */
    orderDetail: string;
  };
  status: Record<string, string>;
}

export function readAccountCopy(): AccountCopyData {
  const node = document.querySelector('[data-account-copy]');
  if (!node?.textContent) throw new Error('Missing <AccountCopy> on this page');
  return JSON.parse(node.textContent) as AccountCopyData;
}

/** Fills `{slot}` markers, the same shape `translate()` uses on the server. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole,
  );
}
