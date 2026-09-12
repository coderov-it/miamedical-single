<!--
  The customer area's chrome: the ground, the identity, the navigation and the
  heading — everything that is the same on all three screens.

  The screens under it render their CONTENT and nothing else. They used to own
  their own container, heading and breadcrumbs, which is how three screens came
  to disagree about the page's width (max-w-2xl, max-w-3xl) and to repeat the
  title the `<title>` already carried.

  LAYOUT: one column on a phone — crumbs, heading, who you are, a strip of
  destinations — and two above `mid`, where the identity and the destinations
  move into a 250px sidebar and the heading stays over the content it belongs
  to. The order in the DOM is the phone's order, so the sidebar is only a
  placement, never a second copy of anything.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  import { accountContext, say } from '~/lib/account-context';

  import AccountCrumbs from './AccountCrumbs.svelte';
  import AccountNav from './AccountNav.svelte';
  import { crumbTrail, pageTitle } from './titles';

  interface Props {
    children: Snippet;
  }

  const { children }: Props = $props();

  const { copy, router, session } = accountContext();

  const screen = $derived(router.screen);
  const trail = $derived(crumbTrail(copy, screen));
  const title = $derived(pageTitle(copy, screen));
  const customer = $derived(session.customer);

  /** Two letters from the name — the address only when there is no name. */
  const initials = $derived.by(() => {
    const first = customer?.firstName?.trim() ?? '';
    const last = customer?.lastName?.trim() ?? '';
    const letters = `${first.slice(0, 1)}${last.slice(0, 1)}`.trim();
    return (letters || customer?.email?.slice(0, 1) || '?').toUpperCase();
  });

  const fullName = $derived(
    [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || customer?.email || '',
  );
</script>

<div class="bg-page">
  <div
    class="max-w-page px-gutter mx-auto w-full pt-[clamp(16px,1.8vw,28px)] pb-[clamp(48px,5vw,80px)]"
  >
    {#if trail.length > 0}
      <AccountCrumbs {trail} />
    {/if}

    <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <h1 class="text-[clamp(1.5rem,2.2vw,2rem)]/[1.2]">{title}</h1>

      <!--
        A second `min-h-11` beside the heading, not a link buried in the
        sidebar: signing out is an action, and it was a bare underlined word
        before this. Never disabled, and it stays clickable while it runs —
        see AGENTS.md § "Never block a customer".
      -->
      <button
        class="text-ink-2 hover:bg-tint-2 rounded-field bg-tint inline-flex min-h-11 items-center gap-2 px-4 text-[15px] font-medium transition hover:text-accent"
        type="button"
        onclick={() => void session.signOut()}
      >
        <svg
          class="flex-none"
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M15 5.2V4a1.8 1.8 0 0 0-1.8-1.8H5.8A1.8 1.8 0 0 0 4 4v16a1.8 1.8 0 0 0 1.8 1.8h7.4A1.8 1.8 0 0 0 15 20v-1.2"
          ></path>
          <path d="M9.6 12h10.6m-3.2-3.2L20.2 12l-3.2 3.2"></path>
        </svg>
        {say(copy, 'account.signOut')}
      </button>
    </div>

    <div class="mid:grid mid:grid-cols-[250px_minmax(0,1fr)] mid:items-start mid:gap-8 mt-6">
      <div class="mid:sticky mid:top-24 max-mid:mb-5">
        <!--
          Who is signed in. The name comes from the loaded customer, and the
          address sits under it because that is what an account IS in this shop:
          every account was created by checkout, and the email is the identifier
          they were matched on.
        -->
        <div class="border-hair rounded-card flex items-center gap-3 border bg-white p-4">
          <span
            class="bg-accent-tint grid size-11 flex-none place-items-center rounded-full text-[15px] font-bold text-accent"
            aria-hidden="true">{initials}</span
          >
          <span class="min-w-0">
            <span class="block truncate font-medium">{fullName}</span>
            <span class="text-ink-2 block truncate text-[13px]">{customer?.email ?? ''}</span>
          </span>
        </div>

        <div class="mid:mt-5">
          <AccountNav />
        </div>
      </div>

      <div class="min-w-0">{@render children()}</div>
    </div>
  </div>
</div>
