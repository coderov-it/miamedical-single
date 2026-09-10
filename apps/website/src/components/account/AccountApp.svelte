<!--
  The customer area, as one island.

  Mounted by the thin shims under pages/area-clienti/**, which each state the
  screen their URL names. It owns the session, the router and the order cache;
  the screens under it own only what they look like.

  `client:load`, not `client:only`: Astro server-renders the loading plate, so
  the first paint is the same real HTML the three separate pages produced. And
  not `client:visible` — the island IS the page, so waiting for an
  intersection would leave a customer looking at "Caricamento…" that never
  resolves.
-->
<script lang="ts">
  import type { AccountCopy } from '~/lib/account-page';
  import { setAccountContext, say } from '~/lib/account-context';
  import { AccountRouter } from '~/lib/account-router.svelte';
  import type { AccountScreen } from '~/lib/account-routes';
  import { AccountSession } from '~/lib/account-session.svelte';
  import { AccountStore } from '~/lib/account-state.svelte';
  import { fill } from '~/scripts/account/copy';

  import ProfileScreen from './ProfileScreen.svelte';

  interface Props {
    /** Server-resolved copy and routes for this request's locale. */
    copy: AccountCopy;
    /** Which screen this URL names. Stated by the shim, never parsed here. */
    initial: AccountScreen;
  }

  const { copy, initial }: Props = $props();

  const session = new AccountSession(copy.routes.login, copy.routes.home);
  const router = new AccountRouter(copy.routes, initial);
  const orders = new AccountStore(session);

  setAccountContext({ copy, router, session, orders });

  let screenEl = $state<HTMLElement>();

  $effect(() => router.mount());

  $effect(() => {
    void session.ensureLoaded().then(() => {
      /* Signed out is the expected first state for anyone arriving from an
         email whose link has already been used, so send them to sign in
         rather than showing an error. */
      if (!session.isAuthenticated) session.redirectToLogin();
    });
  });

  /* Restored from the back/forward cache, where no script re-runs. `no-store`
     on these routes already makes them bfcache-ineligible in Chrome and
     Firefox, so this is the belt to that braces — and it is the same
     `pageshow` pattern SiteHeader uses for the cart badge. */
  $effect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) void session.revalidate();
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  });

  function titleFor(screen: AccountScreen): string {
    if (screen.name === 'orders') return say(copy, 'account.orders.metaTitle');
    if (screen.name === 'orderDetail') {
      return fill(say(copy, 'account.order.metaTitle'), { number: screen.number });
    }
    return say(copy, 'account.metaTitle');
  }

  /* A client-side navigation moves no document, so nothing updates the tab or
     the history entry's label unless we do. Only the shim set the first one. */
  $effect(() => {
    document.title = titleFor(router.screen);
  });

  /* And nothing announces the new screen either: there is no load event for a
     screen reader to react to, and the clicked link has just been removed from
     the DOM, so focus would fall to <body>. Move it to the new screen — but
     never on the first render, which would steal focus on page load. */
  let settled = false;
  $effect(() => {
    const screen = router.screen;
    if (!settled) {
      settled = true;
      return;
    }
    void screen;
    screenEl?.focus();
  });
</script>

{#if session.loading}
  <p class="mt-6 text-[15px] text-neutral-600">{say(copy, 'account.loading')}</p>
{:else if session.customer}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div bind:this={screenEl} tabindex="-1" class="outline-none">
    {#if router.screen.name === 'account'}
      <ProfileScreen />
    {/if}
    <!-- `orders` and `orderDetail` arrive with their own screens; nothing can
         reach them yet, because the links out of here are still document
         navigations to their own Astro pages. -->
  </div>
{/if}
