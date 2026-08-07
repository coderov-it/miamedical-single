/**
 * Sidebar structure — presentation only.
 *
 * There is deliberately no permission on an item here: visibility is looked up
 * from ROUTE_ACCESS by URL (see `route-access.ts`), so the nav and the guard
 * cannot disagree. Adding a page means adding one row there, not two here.
 */

import BanknoteIcon from '@lucide/svelte/icons/banknote';
import GaugeIcon from '@lucide/svelte/icons/gauge';
import PackageIcon from '@lucide/svelte/icons/package';
import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
import TagsIcon from '@lucide/svelte/icons/tags';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import type { Component } from 'svelte';

import { canVisit } from './route-access.ts';
import { routes } from './routes.ts';

export interface NavItem {
  readonly title: string;
  readonly url: string;
  readonly icon: Component;
}

export interface NavSection {
  readonly title: string;
  readonly items: readonly NavItem[];
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: 'Overview',
    items: [{ title: 'Dashboard', url: routes.dashboard, icon: GaugeIcon }],
  },
  {
    title: 'Catalog',
    items: [
      { title: 'Products', url: routes.products, icon: PackageIcon },
      { title: 'Categories', url: routes.categories, icon: TagsIcon },
      { title: 'Attributes', url: routes.attributes, icon: SlidersHorizontalIcon },
      { title: 'Terms', url: routes.terms, icon: FileTextIcon },
    ],
  },
  {
    title: 'Sales',
    items: [
      { title: 'Orders', url: routes.orders, icon: ShoppingCartIcon },
      { title: 'Carts', url: routes.carts, icon: BanknoteIcon },
    ],
  },
];

/** Drops items the visitor cannot open, then any section left empty. */
export function visibleNavigation(can: (code: number) => boolean): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canVisit(item.url, can)),
  })).filter((section) => section.items.length > 0);
}

/**
 * Active when the URL is the item, or below it. The dashboard is matched
 * exactly, or it would light up on every page.
 */
export function isNavItemActive(pathname: string, url: string): boolean {
  if (url === routes.dashboard) return pathname === url;
  return pathname === url || pathname.startsWith(`${url}/`);
}

/** Breadcrumb label for the current path, or undefined for the dashboard. */
export function navTitleFor(pathname: string): string | undefined {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.url !== routes.dashboard && isNavItemActive(pathname, item.url)) return item.title;
    }
  }
  return undefined;
}
