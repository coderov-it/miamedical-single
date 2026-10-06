<script lang="ts">
  import HeartPulseIcon from '@lucide/svelte/icons/heart-pulse';
  import { safeRedirectPath } from '@mia/validators/redirect';

  import { tick } from 'svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import * as Alert from '$lib/components/ui/alert/index.js';
  import * as Field from '$lib/components/ui/field/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';
  import BusyButton from '~/lib/components/busy-button.svelte';

  let email = $state('');
  let password = $state('');
  let error = $state<string | null>(null);
  let submitting = $state(false);
  let emailInput = $state<HTMLInputElement | null>(null);

  /** Where the layout bounced them from. Same-site paths only — never an open redirect. */
  function destination() {
    return safeRedirectPath(page.url.searchParams.get('next'), routes.dashboard);
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

    if (error) {
      /* The alert renders above the fields; focus goes back to the first one,
         which now points at it, so the customer hears what went wrong and is
         already where they fix it. */
      await tick();
      emailInput?.focus();
      return;
    }

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
          <Alert.Root variant="destructive" id="login-error">
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        {/if}

        <Field.Field>
          <Field.Label for="email">Email</Field.Label>
          <Input
            id="email"
            type="email"
            bind:ref={emailInput}
            bind:value={email}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'login-error' : undefined}
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
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'login-error' : undefined}
            required
            autocomplete="current-password"
          />
        </Field.Field>

        <BusyButton type="submit" busy={submitting} busyLabel="Signing in…" class="w-full">
          Sign in
        </BusyButton>
      </Field.Group>
    </form>
  </div>
</div>
