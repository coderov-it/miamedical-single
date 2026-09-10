<!--
  Set a password, or change one.

  The current-password field is rendered only when there IS one. An account
  created by checkout has never had a password — that is the normal arrival —
  and it cannot be asked to prove one. Absent, not disabled, for the same
  reason the email field is absent from the profile form.

  This is where the old page broke the never-block rule outright:

    if (next.length < 12) { say(passwordFeedback, '…'); return; }

  which put the message in a box above the form, left `#newPassword` unflagged,
  and never moved focus. The gate now says it at the field.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';
  import { setPassword } from '~/lib/customer-session';
  import { formGate } from '~/lib/form-gate-action';
  import type { FieldGate, FormGate } from '~/lib/form-validation';

  import FieldError from './FieldError.svelte';
  import { ANNOUNCE, FIELD, LABEL, PRIMARY } from './fields';

  const { copy, session } = accountContext();

  /** Matches SetCustomerPasswordSchema in packages/validators/src/customer.ts. */
  const MIN_PASSWORD_LENGTH = 12;

  const hasPassword = $derived(session.customer?.hasPassword ?? false);

  let current = $state('');
  let next = $state('');

  let currentEl = $state<HTMLInputElement>();
  let nextEl = $state<HTMLInputElement>();
  let announceEl = $state<HTMLElement>();

  let feedback = $state<{ text: string; failed: boolean } | null>(null);

  let gate: FormGate | undefined;
  let saving = false;

  const gates = (): FieldGate[] => [
    {
      /* Inert when the field is not rendered: satisfied, no control to flag,
         no message element to reveal. A gate that cannot be met by a customer
         who cannot see it would be a silent block. */
      key: 'currentPassword',
      isSatisfied: () => !hasPassword || current !== '',
      controls: () => [currentEl],
    },
    {
      key: 'newPassword',
      isSatisfied: () => next.length >= MIN_PASSWORD_LENGTH,
      controls: () => [nextEl],
    },
  ];

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!gate?.enforce()) return;
    void save();
  }

  async function save() {
    if (saving) return;
    saving = true;
    try {
      await setPassword({
        ...(current ? { currentPassword: current } : {}),
        newPassword: next,
      });
      feedback = { text: say(copy, 'account.passwordSaved'), failed: false };
      current = '';
      next = '';
      /* The session deliberately survives a password change — it revokes every
         OTHER session, not this one — so there is nothing to redirect to. Only
         `hasPassword` has moved, and the heading above depends on it. */
      await session.revalidate();
    } catch (error) {
      if (session.escalate(error)) return;
      feedback = { text: errorMessage(error, say(copy, 'account.genericError')), failed: true };
    } finally {
      saving = false;
    }
  }
</script>

<h2 class="text-base font-medium">
  {say(copy, hasPassword ? 'account.changePassword' : 'account.setPassword')}
</h2>
<p class="mt-1 text-sm text-neutral-600">
  {say(copy, hasPassword ? 'account.changePasswordNote' : 'account.setPasswordNote')}
</p>

{#if feedback}
  <div
    class="mt-4 rounded-lg px-4 py-3 text-sm {feedback.failed
      ? 'border border-red-300 bg-red-50'
      : 'bg-tint'}"
    role="status"
  >
    {feedback.text}
  </div>
{/if}

<form
  class="mt-4 space-y-4"
  onsubmit={submit}
  use:formGate={{ gates, announce: () => announceEl ?? null, ready: (g) => (gate = g) }}
>
  {#if hasPassword}
    <label class="block" data-gate="currentPassword">
      <span class={LABEL}>{say(copy, 'account.currentPassword')}</span>
      <input
        class={FIELD}
        type="password"
        autocomplete="current-password"
        bind:this={currentEl}
        bind:value={current}
      />
      <FieldError key="currentPassword" message={say(copy, 'account.errorCurrentPassword')} />
    </label>
  {/if}

  <label class="block" data-gate="newPassword">
    <span class={LABEL}>{say(copy, 'account.newPassword')}</span>
    <input
      class={FIELD}
      type="password"
      autocomplete="new-password"
      bind:this={nextEl}
      bind:value={next}
    />
    <p class="mt-1.5 text-xs text-neutral-500">{say(copy, 'account.minChars')}</p>
    <FieldError key="newPassword" message={say(copy, 'account.passwordTooShort')} />
  </label>

  <button class={PRIMARY} type="submit">{say(copy, 'account.savePassword')}</button>

  <p
    class={ANNOUNCE}
    role="status"
    aria-live="polite"
    bind:this={announceEl}
    data-message-one={say(copy, 'errorCountOne')}
    data-message-many={say(copy, 'errorCountMany')}
  ></p>
</form>
