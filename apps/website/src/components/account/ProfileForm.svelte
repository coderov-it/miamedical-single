<!--
  Name and phone. Email is absent rather than disabled — changing it needs a
  re-verification round trip, and a greyed-out field only invites the question.

  This form had NO validation before: three `required` attributes on a form
  carrying `novalidate`, so an empty name went to the API and came back as a
  message in a box above the fields. It is now gated at the control.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';
  import { updateProfile } from '~/lib/customer-session';
  import { formGate } from '~/lib/form-gate-action';
  import type { FieldGate, FormGate } from '~/lib/form-validation';

  import FieldError from './FieldError.svelte';
  import { ANNOUNCE, FIELD, LABEL, PRIMARY } from './fields';

  const { copy, session } = accountContext();

  /* Seeded once. The customer is already loaded — `AccountApp` does not render
     a screen until the session settles — and re-seeding on every change would
     fight the person typing. */
  let firstName = $state(session.customer?.firstName ?? '');
  let lastName = $state(session.customer?.lastName ?? '');
  let phone = $state(session.customer?.phone ?? '');

  let firstNameEl = $state<HTMLInputElement>();
  let lastNameEl = $state<HTMLInputElement>();
  let phoneEl = $state<HTMLInputElement>();
  let announceEl = $state<HTMLElement>();

  let feedback = $state<{ text: string; failed: boolean } | null>(null);

  let gate: FormGate | undefined;
  /** Re-entry guard. NOT a `disabled` on the button — see fields.ts. */
  let saving = false;

  /* Declaration order is visual order: `enforce()` focuses the first unmet
     gate in this list, and sending someone to the third field when the first
     is also empty is worse than not moving focus at all. */
  const gates = (): FieldGate[] => [
    { key: 'firstName', isSatisfied: () => firstName.trim() !== '', controls: () => [firstNameEl] },
    { key: 'lastName', isSatisfied: () => lastName.trim() !== '', controls: () => [lastNameEl] },
    { key: 'phone', isSatisfied: () => phone.trim() !== '', controls: () => [phoneEl] },
  ];

  function submit(event: SubmitEvent) {
    event.preventDefault();
    /* This early return is not the banned one: `enforce()` has already
       revealed every unmet message, flagged its control, moved focus to the
       first and announced the count. The customer has been told. */
    if (!gate?.enforce()) return;
    void save();
  }

  async function save() {
    if (saving) return;
    saving = true;
    try {
      const updated = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
      session.adopt(updated);
      feedback = { text: say(copy, 'account.profileSaved'), failed: false };
    } catch (error) {
      if (session.escalate(error)) return;
      feedback = { text: errorMessage(error, say(copy, 'account.genericError')), failed: true };
    } finally {
      saving = false;
    }
  }
</script>

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
  <div class="grid gap-4 sm:grid-cols-2">
    <label class="block" data-gate="firstName">
      <span class={LABEL}>{say(copy, 'firstName')}</span>
      <input
        class={FIELD}
        autocomplete="given-name"
        bind:this={firstNameEl}
        bind:value={firstName}
      />
      <FieldError key="firstName" message={say(copy, 'errorFirstName')} />
    </label>

    <label class="block" data-gate="lastName">
      <span class={LABEL}>{say(copy, 'lastName')}</span>
      <input
        class={FIELD}
        autocomplete="family-name"
        bind:this={lastNameEl}
        bind:value={lastName}
      />
      <FieldError key="lastName" message={say(copy, 'errorLastName')} />
    </label>
  </div>

  <label class="block" data-gate="phone">
    <span class={LABEL}>{say(copy, 'account.whatsappNumber')}</span>
    <input class={FIELD} type="tel" autocomplete="tel" bind:this={phoneEl} bind:value={phone} />
    <FieldError key="phone" message={say(copy, 'errorPhone')} />
  </label>

  <button class={PRIMARY} type="submit">{say(copy, 'account.save')}</button>

  <p
    class={ANNOUNCE}
    role="status"
    aria-live="polite"
    bind:this={announceEl}
    data-message-one={say(copy, 'errorCountOne')}
    data-message-many={say(copy, 'errorCountMany')}
  ></p>
</form>
