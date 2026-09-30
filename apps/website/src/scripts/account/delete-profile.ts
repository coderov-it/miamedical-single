/**
 * The profile-deletion card's behaviour. Markup: views/account/DeleteProfileView.astro.
 *
 * identify → code → confirm → done, one section at a time. Each step is its own
 * form with its own gate, so a step only ever scolds the field it shows. A code
 * the server rejects is reported at the code field, through the same gate.
 *
 * Nothing here is ever `disabled`: a request in flight marks its button
 * `aria-busy` and a second click is ignored by the flag, not by the control.
 */
import { ApiError } from '~/lib/customer-session';
import { createFormGate, type FormGate } from '~/lib/form-validation';
import { confirmDeletion, requestDeletionCode, verifyDeletionCode } from '~/lib/profile-deletion';
import { fill, readAccountCopy } from '~/scripts/account/copy';

type Step = 'identify' | 'code' | 'confirm' | 'done';

/** How long "send a new code" asks the customer to wait. The server limits too. */
const RESEND_COOLDOWN_MS = 30_000;

const copy = readAccountCopy();
const say = (key: string) => copy.text[key] ?? '';

const root = document.querySelector<HTMLElement>('[data-delete-profile]');
const feedback = root?.querySelector<HTMLElement>('[data-feedback]');
const identifierInput = root?.querySelector<HTMLInputElement>('#identifier');
const codeInput = root?.querySelector<HTMLInputElement>('#code');
const acknowledged = root?.querySelector<HTMLInputElement>('[data-acknowledged]');
const resendButton = root?.querySelector<HTMLButtonElement>('[data-resend]');
const resendStatus = root?.querySelector<HTMLElement>('[data-resend-status]');

/** Fixed once a code is sent: every later step names the same profile. */
let identifier = '';
let sentAt = 0;
/** Set when the server refuses the code; cleared as soon as it is edited. */
let codeRejected = false;
let busy = false;

const identifierValue = () => identifierInput?.value.trim() ?? '';
const codeValue = () => codeInput?.value.trim() ?? '';

function formOf(step: Step): HTMLFormElement | null {
  return root?.querySelector<HTMLFormElement>(`[data-form="${step}"]`) ?? null;
}

function gateFor(step: Step, gates: Parameters<typeof createFormGate>[1]): FormGate | null {
  const form = formOf(step);
  if (!form) return null;
  return createFormGate(form, gates, { announce: form.querySelector('[data-announce]') });
}

const identifyGate = gateFor('identify', [
  { key: 'identifier', isSatisfied: () => identifierValue() !== '' },
]);
const codeGate = gateFor('code', [
  { key: 'code', isSatisfied: () => /^\d{6}$/.test(codeValue()) },
  { key: 'codeAccepted', isSatisfied: () => !codeRejected, controls: () => [codeInput] },
]);
const confirmGate = gateFor('confirm', [
  { key: 'acknowledged', isSatisfied: () => acknowledged?.checked === true },
]);

// --- state ---------------------------------------------------------------------

function show(step: Step) {
  for (const section of root?.querySelectorAll<HTMLElement>('[data-step]') ?? []) {
    section.hidden = section.dataset.step !== step;
  }
  const scope = root?.querySelector<HTMLElement>('[data-scope]');
  if (scope) scope.hidden = step === 'done';
  showError(null);

  if (step === 'identify') identifierInput?.focus();
  if (step === 'code') codeInput?.focus();
  if (step === 'confirm') root?.querySelector<HTMLElement>('[data-confirm-heading]')?.focus();
  if (step === 'done') root?.querySelector<HTMLElement>('[data-done-heading]')?.focus();
}

function showError(message: string | null) {
  if (!feedback) return;
  feedback.hidden = message === null;
  feedback.textContent = message ?? '';
}

function errorText(error: unknown): string {
  if (error instanceof ApiError && error.status === 429) {
    return say('account.deleteProfile.tooManyAttempts');
  }
  return say('account.genericError');
}

const isInvalidCode = (error: unknown) =>
  error instanceof ApiError && error.code === 'invalid_code';

/** Runs one request with its button marked busy. Re-entry is a no-op, not a block. */
async function run(button: HTMLElement | null | undefined, work: () => Promise<void>) {
  if (busy) return;
  busy = true;
  button?.setAttribute('aria-busy', 'true');
  try {
    await work();
  } finally {
    busy = false;
    button?.removeAttribute('aria-busy');
  }
}

/** A refused code sends the customer back to the code step, marked at the field. */
function rejectCode() {
  codeRejected = true;
  show('code');
  codeGate?.enforce();
  codeInput?.select();
}

// --- steps ---------------------------------------------------------------------

function submitIdentifier(event: SubmitEvent) {
  event.preventDefault();
  showError(null);
  if (!identifyGate?.enforce()) return;
  const value = identifierValue();
  void run(event.submitter, async () => {
    try {
      await requestDeletionCode(value);
      identifier = value;
      sentAt = Date.now();
      if (codeInput) codeInput.value = '';
      if (resendStatus) resendStatus.textContent = '';
      codeRejected = false;
      codeGate?.reset();
      show('code');
    } catch (error) {
      showError(errorText(error));
    }
  });
}

function submitCode(event: SubmitEvent) {
  event.preventDefault();
  showError(null);
  if (!codeGate?.enforce()) return;
  void run(event.submitter, async () => {
    try {
      await verifyDeletionCode(identifier, codeValue());
      confirmGate?.reset();
      if (acknowledged) acknowledged.checked = false;
      show('confirm');
    } catch (error) {
      if (isInvalidCode(error)) return rejectCode();
      showError(errorText(error));
    }
  });
}

function submitConfirm(event: SubmitEvent) {
  event.preventDefault();
  showError(null);
  if (!confirmGate?.enforce()) return;
  void run(event.submitter, async () => {
    try {
      await confirmDeletion(identifier, codeValue());
      show('done');
    } catch (error) {
      // The code expired while they read the page: back to it, told why.
      if (isInvalidCode(error)) return rejectCode();
      showError(errorText(error));
    }
  });
}

function resend() {
  if (!resendStatus) return;
  const wait = RESEND_COOLDOWN_MS - (Date.now() - sentAt);
  if (wait > 0) {
    resendStatus.textContent = fill(say('account.deleteProfile.resendWait'), {
      seconds: Math.ceil(wait / 1000),
    });
    return;
  }
  void run(resendButton, async () => {
    try {
      await requestDeletionCode(identifier);
      sentAt = Date.now();
      resendStatus.textContent = say('account.deleteProfile.resent');
    } catch (error) {
      resendStatus.textContent = errorText(error);
    }
  });
}

// --- wiring --------------------------------------------------------------------

formOf('identify')?.addEventListener('submit', submitIdentifier);
formOf('code')?.addEventListener('submit', submitCode);
formOf('confirm')?.addEventListener('submit', submitConfirm);

formOf('identify')?.addEventListener('input', () => identifyGate?.refresh());
formOf('code')?.addEventListener('input', () => {
  codeRejected = false;
  codeGate?.refresh();
});
formOf('confirm')?.addEventListener('change', () => confirmGate?.refresh());

resendButton?.addEventListener('click', resend);
root?.querySelector('[data-change-identifier]')?.addEventListener('click', () => {
  identifyGate?.reset();
  show('identify');
  identifierInput?.select();
});
