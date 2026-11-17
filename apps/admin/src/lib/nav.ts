/**
 * Sidebar structure — presentation only.
 *
 * There is deliberately no permission on an item here: visibility is looked up
 * from ROUTE_ACCESS by URL (see `route-access.ts`), so the nav and the guard
 * cannot disagree. Adding a page means adding one row there, not two here.
 */

import BanknoteIcon from '@lucide/svelte/icons/banknote';
import BellIcon from '@lucide/svelte/icons/bell';
import ChartColumnIcon from '@lucide/svelte/icons/chart-column';
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

import type { MessageKey } from '~/lib/ui-text';

import { canVisit } from './route-access.ts';
import { routes } from './routes.ts';

export interface NavItem {
  readonly titleKey: MessageKey;
  readonly url: string;
  readonly icon: Component;
}

export interface NavSection {
  readonly titleKey: MessageKey;
  readonly items: readonly NavItem[];
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    titleKey: 'nav.overview',
    items: [
      { titleKey: 'nav.dashboard', url: routes.dashboard, icon: GaugeIcon },
      { titleKey: 'nav.analytics', url: routes.analytics, icon: ChartColumnIcon },
      /* The inbox, not the alert-email setting — that moved into Settings. The
         bell in the topbar reaches the same page; this is here because a section
         of the back office you can open should be findable in the nav. */
      { titleKey: 'nav.notifications', url: routes.notifications, icon: BellIcon },
    ],
  },
  {
    titleKey: 'nav.catalog',
    items: [
      { titleKey: 'nav.products', url: routes.products, icon: PackageIcon },
      { titleKey: 'nav.categories', url: routes.categories, icon: TagsIcon },
      { titleKey: 'nav.terms', url: routes.terms, icon: FileTextIcon },
    ],
  },
  {
    titleKey: 'nav.sales',
    items: [
      { titleKey: 'nav.orders', url: routes.orders, icon: ShoppingCartIcon },
      { titleKey: 'nav.rentManagement', url: routes.rentals, icon: CalendarClockIcon },
      { titleKey: 'nav.contracts', url: routes.contracts, icon: FileSignatureIcon },
      { titleKey: 'nav.payments', url: routes.payments, icon: WalletIcon },
      { titleKey: 'nav.carts', url: routes.carts, icon: BanknoteIcon },
      { titleKey: 'nav.disputedOrders', url: routes.orderDisputes, icon: ShieldAlertIcon },
    ],
  },
  {
    titleKey: 'nav.content',
    items: [
      { titleKey: 'nav.blogPosts', url: routes.blog, icon: NewspaperIcon },
      { titleKey: 'nav.privacyPolicy', url: routes.privacyPolicy, icon: ShieldCheckIcon },
    ],
  },
  {
    titleKey: 'nav.settings',
    items: [
      { titleKey: 'nav.general', url: routes.settings, icon: SlidersHorizontalIcon },
      { titleKey: 'nav.adminUsers', url: routes.adminUsers, icon: UsersIcon },
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

/** Breadcrumb label key for the current path, or undefined for the dashboard. */
export function navTitleFor(pathname: string): MessageKey | undefined {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.url !== routes.dashboard && isNavItemActive(pathname, item.url))
        return item.titleKey;
    }
  }
  return undefined;
}
