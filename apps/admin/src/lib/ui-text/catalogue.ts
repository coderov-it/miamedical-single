/**
 * The admin's interface copy: `src/i18n/<language>/<namespace>.json`, flattened
 * to `namespace.key` per language. See docs/code/admin-ui-text.md.
 *
 * English is the reference catalogue — the key set, and the fallback for a gap
 * in any other language — because English is what the chrome was written in.
 * The registry's source language (Italian) must still be complete: the parity
 * test fails on a missing Italian key, so the gap never reaches the client.
 */
import type { LanguageCode } from '~/lib/i18n/languages';

import type access from '~/i18n/en/access.json';
import type analytics from '~/i18n/en/analytics.json';
import type auth from '~/i18n/en/auth.json';
import type blog from '~/i18n/en/blog.json';
import type carts from '~/i18n/en/carts.json';
import type categories from '~/i18n/en/categories.json';
import type common from '~/i18n/en/common.json';
import type components from '~/i18n/en/components.json';
import type contracts from '~/i18n/en/contracts.json';
import type dashboard from '~/i18n/en/dashboard.json';
import type disputes from '~/i18n/en/disputes.json';
import type entities from '~/i18n/en/entities.json';
import type legal from '~/i18n/en/legal.json';
import type nav from '~/i18n/en/nav.json';
import type notifications from '~/i18n/en/notifications.json';
import type orders from '~/i18n/en/orders.json';
import type payments from '~/i18n/en/payments.json';
import type permissions from '~/i18n/en/permissions.json';
import type products from '~/i18n/en/products.json';
import type profile from '~/i18n/en/profile.json';
import type rentals from '~/i18n/en/rentals.json';
import type settings from '~/i18n/en/settings.json';
import type shell from '~/i18n/en/shell.json';
import type status from '~/i18n/en/status.json';
import type stock from '~/i18n/en/stock.json';
import type terms from '~/i18n/en/terms.json';

/** Adding a namespace: one JSON file per language, plus one line in each place here. */
interface Reference {
  access: typeof access;
  analytics: typeof analytics;
  auth: typeof auth;
  blog: typeof blog;
  carts: typeof carts;
  categories: typeof categories;
  common: typeof common;
  components: typeof components;
  contracts: typeof contracts;
  dashboard: typeof dashboard;
  disputes: typeof disputes;
  entities: typeof entities;
  legal: typeof legal;
  nav: typeof nav;
  notifications: typeof notifications;
  orders: typeof orders;
  payments: typeof payments;
  permissions: typeof permissions;
  products: typeof products;
  profile: typeof profile;
  rentals: typeof rentals;
  settings: typeof settings;
  shell: typeof shell;
  status: typeof status;
  stock: typeof stock;
  terms: typeof terms;
}

export const REFERENCE_LANGUAGE: LanguageCode = 'en';

type Namespace = keyof Reference & string;

/** Every `namespace.key` the English catalogue defines — a typo does not compile. */
export type MessageKey = {
  [N in Namespace]: `${N}.${keyof Reference[N] & string}`;
}[Namespace];

/** `orders.count.one` + `orders.count.other` → `orders.count`, for `tn()`. */
export type PluralKey = MessageKey extends infer K
  ? K extends `${infer Base}.other`
    ? Base
    : never
  : never;

type Messages = Record<string, string>;

const files = import.meta.glob<Messages>('../../i18n/*/*.json', {
  eager: true,
  import: 'default',
});

function flatten(): Partial<Record<LanguageCode, Messages>> {
  const out: Partial<Record<string, Messages>> = {};
  for (const [path, messages] of Object.entries(files)) {
    const match = /\/i18n\/([^/]+)\/([^/]+)\.json$/.exec(path);
    if (!match) continue;
    const [, language, namespace] = match as unknown as [string, string, string];
    const target = (out[language] ??= {});
    for (const [key, value] of Object.entries(messages)) target[`${namespace}.${key}`] = value;
  }
  return out;
}

export const MESSAGES = flatten();
