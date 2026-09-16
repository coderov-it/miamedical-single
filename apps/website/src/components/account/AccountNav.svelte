<!--
  The customer area's own navigation.

  FOUR DESTINATIONS, ONE LIST, no sub-menu. The account is small enough that
  every entry is a real route: the three screens the router knows, plus the
  catalogue — which is the reason most customers open this area at all, and a
  server-rendered link rather than something the island routes.

  The three internal ones stay `<AccountLink>`s so a click is a `pushState` and
  not a document load, and so middle-click and ⌘-click still work.

  Notifiche carries the unread count. It is a badge on a destination rather
  than a bell of its own in the header: the storefront header is shared with
  every public page and belongs to the shop, not to the account, and one place
  showing the number is one place that can be wrong about it.

  ONE DOM, TWO SHAPES: a sidebar above `mid`, a scrolling strip of pills below
  it. Repeating the list per breakpoint would put two navigation landmarks in
  the document and force assistive technology to choose between them — here the
  classes move and the landmark stays one.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';

  import AccountLink from './AccountLink.svelte';

  const { copy, notifications, router } = accountContext();

  const screen = $derived(router.screen);

  /* Past 99 the exact number stops being information and starts being a layout
     problem. The screen itself still shows the real count. */
  const unread = $derived(notifications.unread);
  const badge = $derived(unread > 99 ? '99+' : String(unread));

  /**
   * The orders screen and one order are the same destination as far as the
   * navigation is concerned: an order detail is inside the list, not beside it.
   */
  const onOrders = $derived(screen.name === 'orders' || screen.name === 'orderDetail');

  const ITEM =
    'inline-flex min-h-11 items-center gap-2.5 rounded-field px-3 text-[15px] font-medium whitespace-nowrap no-underline transition';
  const CURRENT = 'bg-accent-tint text-accent';
  const REST = 'text-ink hover:bg-tint-2 hover:text-accent';
</script>

<nav aria-label={say(copy, 'navigation.primary')}>
  <ul
    class="max-mid:-mx-gutter max-mid:px-gutter mid:flex-col mid:gap-0.5 mid:overflow-visible mid:pb-0 flex gap-1.5 overflow-x-auto pb-1"
  >
    <li>
      <AccountLink
        to={{ name: 'account' }}
        class={`${ITEM} ${screen.name === 'account' ? CURRENT : REST}`}
      >
        <svg
          class="flex-none"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M4 11.2 12 4.6l8 6.6"></path>
          <path d="M6.2 10.4V19h11.6v-8.6"></path>
        </svg>
        {say(copy, 'account.nav.overview')}
      </AccountLink>
    </li>

    <li>
      <AccountLink to={{ name: 'orders' }} class={`${ITEM} ${onOrders ? CURRENT : REST}`}>
        <svg
          class="flex-none"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3.8 7.6 12 3.8l8.2 3.8v8.8L12 20.2l-8.2-4V7.6Z"></path>
          <path d="M3.8 7.6 12 11.4l8.2-3.8M12 11.4v8.8"></path>
        </svg>
        {say(copy, 'account.myOrders')}
      </AccountLink>
    </li>

    <li>
      <AccountLink
        to={{ name: 'notifications' }}
        class={`${ITEM} ${screen.name === 'notifications' ? CURRENT : REST}`}
      >
        <svg
          class="flex-none"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8.6a6 6 0 1 0-12 0c0 6.3-2.4 7.4-2.4 7.4h16.8S18 14.9 18 8.6"></path>
          <path d="M13.7 19.6a1.9 1.9 0 0 1-3.4 0"></path>
        </svg>
        {say(copy, 'account.notifications.title')}
        {#if unread > 0}
          <span
            class="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[11px] leading-none font-bold text-white tabular-nums"
          >
            {badge}
          </span>
        {/if}
      </AccountLink>
    </li>

    <li>
      <a class={`${ITEM} ${REST}`} href={copy.routes.catalog}>
        <svg
          class="flex-none"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M4 5h16M4 12h16M4 19h10"></path>
        </svg>
        {say(copy, 'account.orders.browse')}
      </a>
    </li>
  </ul>
</nav>
