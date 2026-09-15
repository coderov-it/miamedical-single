/**
 * Sidebar structure — presentation only.
 *
 * There is deliberately no permission on an item here: visibility is looked up
 * from ROUTE_ACCESS by URL (see `route-access.ts`), so the nav and the guard
 * cannot disagree. Adding a page means adding one row there, not two here.
 */

import BanknoteIcon from '@lucide/svelte/icons/banknote';
import BellIcon from '@lucide/svelte/icons/bell';
import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
import GaugeIcon from '@lucide/svelte/icons/gauge';
import PackageIcon from '@lucide/svelte/icons/package';
import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
import TagsIcon from '@lucide/svelte/icons/tags';
import UsersIcon from '@lucide/svelte/icons/users';
import WalletIcon from '@lucide/svelte/icons/wallet';
import FileSignatureIcon from '@lucide/svelte/icons/file-signature';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
import NewspaperIcon from '@lucide/svelte/icons/newspaper';
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
    items: [
      { title: 'Dashboard', url: routes.dashboard, icon: GaugeIcon },
      /* The inbox, not the alert-email setting — that moved into Settings. The
         bell in the topbar reaches the same page; this is here because a section
         of the back office you can open should be findable in the nav. */
      { title: 'Notifications', url: routes.notifications, icon: BellIcon },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { title: 'Products', url: routes.products, icon: PackageIcon },
      { title: 'Categories', url: routes.categories, icon: TagsIcon },
      { title: 'Terms', url: routes.terms, icon: FileTextIcon },
    ],
  },
  {
    title: 'Sales',
    items: [
      { title: 'Orders', url: routes.orders, icon: ShoppingCartIcon },
      { title: 'Rent Management', url: routes.rentals, icon: CalendarClockIcon },
      { title: 'Contracts', url: routes.contracts, icon: FileSignatureIcon },
      { title: 'Payments', url: routes.payments, icon: WalletIcon },
      { title: 'Carts', url: routes.carts, icon: BanknoteIcon },
      { title: 'Disputed Orders', url: routes.orderDisputes, icon: ShieldAlertIcon },
    ],
  },
  {
    title: 'Content',
    items: [
      { title: 'Blog Posts', url: routes.blog, icon: NewspaperIcon },
      { title: 'Privacy Policy', url: routes.privacyPolicy, icon: ShieldCheckIcon },
    ],
  },
  {
    title: 'Settings',
    items: [
      { title: 'General', url: routes.settings, icon: SlidersHorizontalIcon },
      { title: 'Admin Users', url: routes.adminUsers, icon: UsersIcon },
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
