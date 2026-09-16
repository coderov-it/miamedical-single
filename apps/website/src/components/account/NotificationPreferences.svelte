<!--
  The three push toggles, on the notifications screen rather than a screen of
  their own.

  A fifth screen would mean a new public path in four languages — an SEO
  commitment, per the route rule — a page shim, a nav entry and a crumb trail,
  all to carry three switches. They also belong here: this is the list they
  govern, and nobody goes looking for notification settings anywhere else.

  Collapsed by default. A customer opening this screen came to read what
  happened, not to configure anything, and three switches above the list would
  push the newest row below the fold on a phone.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';
  import {
    NotificationPreferenceStore,
    PREFERENCE_CATEGORIES,
  } from '~/lib/notification-preferences.svelte';

  const { copy } = accountContext();
  const store = new NotificationPreferenceStore();

  let open = $state(false);

  /* Loaded when it is first opened, not when the screen mounts: most visits
     never touch this, and the feed's own request is the one that matters for
     how fast the screen paints. */
  $effect(() => {
    if (open) void store.ensureLoaded();
  });

  const values = $derived(store.values);
</script>

<details class="border-hair rounded-card mb-4 overflow-hidden border bg-white" bind:open>
  <summary
    class="hover:bg-tint-2 flex min-h-11 cursor-pointer list-none items-center justify-between px-4 py-3 text-[14px] font-semibold transition"
  >
    {say(copy, 'account.notifications.preferences.title')}
    <span class="text-ink-2 text-[13px] font-normal">
      {open
        ? say(copy, 'account.notifications.preferences.hide')
        : say(copy, 'account.notifications.preferences.show')}
    </span>
  </summary>

  <div class="border-hair border-t px-4 py-3">
    <p class="text-ink-2 mb-3 text-[13.5px] leading-6">
      {say(copy, 'account.notifications.preferences.hint')}
    </p>

    {#if store.loading && !values}
      <p class="text-ink-2 text-[14px]" role="status">{say(copy, 'account.loading')}</p>
    {:else if store.error && !values}
      <p class="text-danger text-[14px]" role="status">
        {errorMessage(store.error, say(copy, 'account.retry'))}
      </p>
    {:else if values}
      <ul class="divide-hair divide-y">
        {#each PREFERENCE_CATEGORIES as category (category)}
          <li class="flex items-center justify-between gap-4 py-2.5">
            <span class="text-[14.5px]">
              {say(copy, `account.notifications.preferences.${category}`)}
            </span>

            <!--
              A real checkbox, styled as a switch. `role="switch"` on a button
              would have to reimplement the keyboard behaviour the input
              already has, and this one is never disabled while saving: a
              second click is an ordinary toggle back, not a race — the store
              replaces its state with whatever the server last answered.
            -->
            <label class="inline-flex cursor-pointer items-center">
              <input
                class="peer sr-only"
                type="checkbox"
                checked={values[category].push}
                aria-busy={store.saving === category}
                onchange={() => void store.toggle(category)}
              />
              <span
                class="bg-tint relative h-6 w-11 rounded-full transition peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition after:content-[''] peer-checked:after:translate-x-5"
              ></span>
            </label>
          </li>
        {/each}
      </ul>

      {#if store.error}
        <p class="text-danger mt-3 text-[13.5px]" role="status">
          {errorMessage(store.error, say(copy, 'account.retry'))}
        </p>
      {/if}
    {/if}
  </div>
</details>
