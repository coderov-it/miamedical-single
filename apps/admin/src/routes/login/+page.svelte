<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import { session } from '~/lib/session.svelte';

  let email = $state('');
  let password = $state('');
  let error = $state<string | null>(null);
  let submitting = $state(false);

  /** Where the layout bounced them from. Relative paths only — never an open redirect. */
  function destination() {
    const next = page.url.searchParams.get('next');
    return next && next.startsWith('/') ? next : '/';
  }

  // Nobody signed in should be looking at a sign-in form.
  $effect(() => {
    if (!session.loading && session.isAuthenticated) {
      void goto(destination(), { replaceState: true });
    }
  });

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    submitting = true;
    error = await session.login(email, password);
    submitting = false;

    if (error) return;

    await goto(destination());
  }
</script>

<div class="flex min-h-full items-center justify-center p-6">
  <form
    onsubmit={submit}
    class="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <h1 class="text-lg font-semibold tracking-tight">Mia Medical Admin</h1>
    <p class="mt-1 text-sm text-neutral-500">Sign in to continue.</p>

    {#if error}
      <p class="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
    {/if}

    <label class="mt-6 block text-sm font-medium" for="email">Email</label>
    <input
      id="email"
      type="email"
      bind:value={email}
      required
      autocomplete="username"
      class="focus:border-brand-500 mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
    />

    <label class="mt-4 block text-sm font-medium" for="password">Password</label>
    <input
      id="password"
      type="password"
      bind:value={password}
      required
      autocomplete="current-password"
      class="focus:border-brand-500 mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
    />

    <button
      type="submit"
      disabled={submitting}
      class="bg-brand-600 mt-6 w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:opacity-60"
    >
      {submitting ? 'Signing in…' : 'Sign in'}
    </button>
  </form>
</div>
