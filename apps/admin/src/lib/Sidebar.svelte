<script lang="ts">
  import { router } from './router.svelte';

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/products', label: 'Products' },
    { href: '/orders', label: 'Orders' },
  ];

  function isActive(href: string) {
    return href === '/' ? router.path === '/' : router.path.startsWith(href);
  }
</script>

<aside
  class="w-60 shrink-0 border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
>
  <div class="px-3 py-4 text-sm font-semibold tracking-tight">Mia Medical Admin</div>

  <nav class="mt-4 flex flex-col gap-1">
    {#each links as link (link.href)}
      <a
        href={`#${link.href}`}
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
</aside>
