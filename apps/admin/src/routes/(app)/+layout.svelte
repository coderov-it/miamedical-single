<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import Sidebar from '~/lib/components/Sidebar.svelte';
  import { session } from '~/lib/session.svelte';

  let { children } = $props();

  // The auth gate is the `{#if}` below — this only keeps the address bar in
  // step with it, and remembers where the visitor was headed.
  $effect(() => {
    if (!session.loading && !session.isAuthenticated) {
      const next = encodeURIComponent(page.url.pathname + page.url.search);
      void goto(`/login?next=${next}`, { replaceState: true });
    }
  });
</script>

{#if session.loading}
  <div class="flex h-full items-center justify-center text-sm text-neutral-500">Loading…</div>
{:else if !session.isAuthenticated}
  <div class="flex h-full items-center justify-center text-sm text-neutral-500">
    Redirecting to sign in…
  </div>
{:else}
  <div class="flex h-full">
    <Sidebar />

    <main class="flex-1 overflow-y-auto p-8">
      {@render children()}
    </main>
  </div>
{/if}
