<script lang="ts">
  import HeartPulseIcon from '@lucide/svelte/icons/heart-pulse';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import * as Alert from '$lib/components/ui/alert/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Field from '$lib/components/ui/field/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  let email = $state('');
  let password = $state('');
  let error = $state<string | null>(null);
  let submitting = $state(false);

  /** Where the layout bounced them from. Relative paths only — never an open redirect. */
  function destination() {
    const next = page.url.searchParams.get('next');
    return next && next.startsWith('/') ? next : routes.dashboard;
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

<div class="flex min-h-svh items-center justify-center bg-muted/30 p-6">
  <div class="w-full max-w-sm">
    <div class="mb-6 flex flex-col items-center gap-3 text-center">
      <div
        class="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"
      >
        <HeartPulseIcon class="size-5" />
      </div>
      <div>
        <h1 class="text-lg font-semibold tracking-tight">Mia Medical</h1>
        <p class="mt-0.5 text-sm text-muted-foreground">Sign in to the back office.</p>
      </div>
    </div>

    <form onsubmit={submit} class="rounded-xl border bg-card p-6 shadow-sm">
      <Field.Group>
        {#if error}
          <Alert.Root variant="destructive">
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        {/if}

        <Field.Field>
          <Field.Label for="email">Email</Field.Label>
          <Input
            id="email"
            type="email"
            bind:value={email}
            required
            autocomplete="username"
            placeholder="ops@miamedical.com"
          />
        </Field.Field>

        <Field.Field>
          <Field.Label for="password">Password</Field.Label>
          <Input
            id="password"
            type="password"
            bind:value={password}
            required
            autocomplete="current-password"
          />
        </Field.Field>

        <Button type="submit" disabled={submitting} class="w-full">
          {#if submitting}<Spinner />{/if}
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </Field.Group>
    </form>
  </div>
</div>
