<!--
  Account home: who you are, your password, and the way out.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';

  import AccountLink from './AccountLink.svelte';
  import PasswordForm from './PasswordForm.svelte';
  import ProfileForm from './ProfileForm.svelte';

  const { copy, session } = accountContext();
</script>

<div class="mx-auto w-full max-w-2xl px-5 py-10">
  <div class="flex flex-wrap items-baseline justify-between gap-3">
    <h1 class="text-[clamp(1.6rem,2.4vw,2rem)]/[1.2]">{say(copy, 'account.title')}</h1>
    <button
      class="text-sm text-neutral-600 underline"
      type="button"
      onclick={() => void session.signOut()}
    >
      {say(copy, 'account.signOut')}
    </button>
  </div>

  <AccountLink
    to={{ name: 'orders' }}
    class="bg-tint hover:bg-tint-2 mt-6 flex items-center justify-between rounded-xl px-4 py-4 transition"
  >
    <span class="font-medium">{say(copy, 'account.myOrders')}</span>
    <span aria-hidden="true">→</span>
  </AccountLink>

  <section class="mt-8">
    <h2 class="text-base font-medium">{say(copy, 'yourDetails')}</h2>
    <p class="mt-1 text-sm text-neutral-600">
      {say(copy, 'account.emailLabel')}
      <span class="font-medium text-neutral-900">{session.customer?.email ?? ''}</span>
    </p>

    <ProfileForm />
  </section>

  <section class="border-hair mt-10 border-t pt-8">
    <PasswordForm />
  </section>
</div>
