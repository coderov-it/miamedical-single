<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import AppSidebar from '~/lib/components/app-sidebar.svelte';
  import AppTopbar from '~/lib/components/app-topbar.svelte';
  import RouteAccessGuard from '~/lib/components/route-access-guard.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  let { children } = $props();

  // The auth gate is the `{#if}` below — this only keeps the address bar in
  // step with it, and remembers where the visitor was headed.
  $effect(() => {
    if (!session.loading && !session.isAuthenticated) {
      const next = encodeURIComponent(page.url.pathname + page.url.search);
      void goto(`${routes.login}?next=${next}`, { replaceState: true });
    }
  });
</script>

{#if session.loading}
  <div class="flex h-svh items-center justify-center gap-2 text-sm text-muted-foreground">
    <Spinner />
    Loading workspace…
  </div>
{:else if !session.isAuthenticated}
  <div class="flex h-svh items-center justify-center text-sm text-muted-foreground">
    Redirecting to sign in…
  </div>
{:else}
  <Sidebar.Provider>
    <AppSidebar />
    <Sidebar.Inset class="min-w-0 bg-background">
      <AppTopbar />
      <div class="flex flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div class="mx-auto w-full max-w-[1600px]">
          <RouteAccessGuard>
            {@render children()}
          </RouteAccessGuard>
        </div>
      </div>
    </Sidebar.Inset>
  </Sidebar.Provider>
{/if}
