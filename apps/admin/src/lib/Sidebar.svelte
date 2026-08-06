<script lang="ts">
  import { P } from '@mia/permissions';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import { session } from './session.svelte';

  // `permission` is what the matching API routes require, so a link is only
  // shown when following it would actually work.
  const links = [
    { href: '/', label: 'Dashboard', permission: P.DASHBOARD_READ },
    { href: '/products', label: 'Products', permission: P.PRODUCT_READ },
    { href: '/orders', label: 'Orders', permission: P.ORDER_READ },
  ];

  const visible = $derived(links.filter((link) => session.can(link.permission)));

  function isActive(href: string) {
    const path = page.url.pathname;
    return href === '/' ? path === '/' : path.startsWith(href);
  }

  async function signOut() {
    await session.logout();
    // Clearing the user flips the layout's conditional on its own; this just
    // puts the address bar somewhere sensible.
    await goto('/login');
  }
</script>

<aside
  class="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
>
  <div class="px-3 py-4 text-sm font-semibold tracking-tight">Mia Medical Admin</div>

  <nav class="mt-4 flex flex-col gap-1">
    {#each visible as link (link.href)}
      <a
        href={link.href}
        class="rounded-lg px-3 py-2 text-sm transition"
        class:bg-brand-600={isActive(link.href)}
        class:text-white={isActive(link.href)}
        class:hover:bg-neutral-100={!isActive(link.href)}
        class:dark:hover:bg-neutral-800={!isActive(link.href)}
        aria-current={isActive(link.href) ? 'page' : undefined}
      >
        {link.label}
      </a>
    {/each}
  </nav>

  <div class="mt-auto border-t border-neutral-200 px-3 pt-4 dark:border-neutral-800">
    <div class="truncate text-sm font-medium">{session.user?.fullName ?? session.user?.email}</div>
    <div class="text-xs text-neutral-500">
      {session.user?.isSuperAdmin ? 'Super admin' : session.user?.role}
    </div>

    <button
      type="button"
      onclick={signOut}
      class="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
    >
      Sign out
    </button>
  </div>
</aside>
