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
  import { accountHref, type AccountScreen } from '~/lib/account-routes';
  import { AccountSession } from '~/lib/account-session.svelte';
  import { AccountStore } from '~/lib/account-state.svelte';

  import AccountShell from './AccountShell.svelte';
  import OrderDetailScreen from './OrderDetailScreen.svelte';
  import OrdersScreen from './OrdersScreen.svelte';
  import ProfileScreen from './ProfileScreen.svelte';
  import { documentTitle } from './titles';

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

  /* Read once into a local: `{@const}` is not legal as a child of a plain
     element, and narrowing `router.screen.name` inline across a getter does
     not give the `{:else}` arm its `number`. */
  const screen = $derived(router.screen);

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

  /* A client-side navigation moves no document, so nothing updates the tab or
     the history entry's label unless we do. Only the shim set the first one.
     The three names live in `titles.ts`, beside the ones the shell paints. */
  $effect(() => {
    document.title = documentTitle(copy, router.screen);
  });

  /* The language switcher is server-rendered chrome, so after a client-side
     hop it still offers the screen the reader arrived on: switch to German
     from an order detail and you land on the German order LIST. Repoint it at
     the screen actually showing. `data-language` carries the registry code —
     the anchor's own `lang` is a BCP-47 tag, which is not the same key. */
  $effect(() => {
    const screen = router.screen;
    for (const anchor of document.querySelectorAll<HTMLAnchorElement>(
      '[data-language-switcher] a[data-language]',
    )) {
      const routes = copy.languageRoutes[anchor.dataset.language ?? ''];
      if (routes) anchor.href = accountHref(routes, screen);
    }
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
  <!--
    The server-rendered first paint, and the only thing on screen until the
    session settles. It carries the page ground so the transition into the real
    shell moves nothing.
  -->
  <div class="bg-page">
    <div class="max-w-page px-gutter mx-auto w-full py-16">
      <p class="text-ink-2 text-[15px]" role="status">{say(copy, 'account.loading')}</p>
    </div>
  </div>
{:else if session.customer}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div bind:this={screenEl} tabindex="-1" class="outline-none">
    <AccountShell>
      {#if screen.name === 'account'}
        <ProfileScreen />
      {:else if screen.name === 'orders'}
        <OrdersScreen />
      {:else}
        <OrderDetailScreen number={screen.number} />
      {/if}
    </AccountShell>
  </div>
{/if}
