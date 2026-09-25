/**
 * The sign-in card's behaviour. Markup and the reasoning behind it:
 * views/account/SignInView.astro.
 *
 * Three modes over one form: `link` mails a sign-in link (creating the account
 * for an address we have never seen), `password` signs in directly, `register`
 * mails a confirmation that applies the chosen password when clicked. Submit
 * does whatever the current mode says. After a mail goes out the form is
 * swapped for a "check your email" panel that can resend or start over.
 *
 * Nothing here is ever `disabled`. A request in flight marks its button
 * `aria-busy` and a second click is ignored by the flag, not by the control.
 */
import {
  ApiError,
  loadCustomer,
  login,
  register,
  requestMagicLink,
  requestPasswordReset,
  safeNext,
} from '~/lib/customer-session';
import { createFormGate, type FieldGate } from '~/lib/form-validation';
import { fill, readAccountCopy } from '~/scripts/account/copy';

type Mode = 'link' | 'password' | 'register';
type Sent = 'link' | 'reset' | 'register';

const SENT_BODY: Record<Sent, string> = {
  link: 'account.signIn.sentBody',
  reset: 'account.signIn.resetSentBody',
  register: 'account.signIn.registerSentBody',
};

/**
 * The sign-in mode this browser used last. A convenience only — it may be
 * unreadable. `register` is never stored: nobody registers twice.
 */
const MODE_KEY = 'mia.signIn.mode';
/** How long "send it again" asks the customer to wait. The server limits too. */
const RESEND_COOLDOWN_MS = 30_000;

const copy = readAccountCopy();
const say = (key: string) => copy.text[key] ?? '';

const root = document.querySelector<HTMLElement>('[data-sign-in]');
const form = root?.querySelector<HTMLFormElement>('[data-form]');
const emailInput = root?.querySelector<HTMLInputElement>('#email');
const passwordInput = root?.querySelector<HTMLInputElement>('#password');
const newPasswordInput = root?.querySelector<HTMLInputElement>('#new-password');
const submitButton = root?.querySelector<HTMLButtonElement>('[data-submit]');
const feedback = root?.querySelector<HTMLElement>('[data-feedback]');
const formStep = root?.querySelector<HTMLElement>('[data-step="form"]');
const sentStep = root?.querySelector<HTMLElement>('[data-step="sent"]');
const sentBody = root?.querySelector<HTMLElement>('[data-sent-body]');
const sentHeading = root?.querySelector<HTMLElement>('[data-sent-heading]');
const resendButton = root?.querySelector<HTMLButtonElement>('[data-resend]');
const resendStatus = root?.querySelector<HTMLElement>('[data-resend-status]');

const next = safeNext(new URLSearchParams(window.location.search).get('next'), copy.routes.account);

let mode: Mode = readStoredMode();
/** `password` is kept only for a registration, so "send it again" can repeat it. */
let sent: { kind: Sent; email: string; password: string; at: number } | null = null;
let busy = false;

const announce = root?.querySelector<HTMLElement>('[data-announce]') ?? null;
const emailGate: FieldGate = {
  key: 'email',
  isSatisfied: () => isEmail(emailValue()),
  controls: () => [emailInput],
};
const passwordGate: FieldGate = {
  key: 'password',
  isSatisfied: () => mode !== 'password' || (passwordInput?.value ?? '') !== '',
  controls: () => [passwordInput],
};
const newPasswordGate: FieldGate = {
  key: 'newPassword',
  isSatisfied: () =>
    mode !== 'register' ||
    (newPasswordInput?.value.length ?? 0) >= (newPasswordInput?.minLength ?? 0),
  controls: () => [newPasswordInput],
};
/* Two gates over one form: submitting checks every field, "forgot password" only
   needs the address and must not scold an empty password field. */
const gate = form
  ? createFormGate(form, [emailGate, passwordGate, newPasswordGate], { announce })
  : null;
const addressGate = form ? createFormGate(form, [emailGate], { announce }) : null;

// --- state ---------------------------------------------------------------------

function readStoredMode(): Mode {
  try {
    return localStorage.getItem(MODE_KEY) === 'password' ? 'password' : 'link';
  } catch {
    return 'link';
  }
}

function setMode(value: Mode, { focus }: { focus: boolean }) {
  mode = value;
  if (root) root.dataset.mode = value;
  for (const node of root?.querySelectorAll<HTMLElement>('[data-when]') ?? []) {
    node.hidden = !(node.dataset.when ?? '').split(' ').includes(value);
  }
  gate?.reset();
  showError(null);
  if (value !== 'register') remember(value);
  if (!focus) return;
  focusFor(value);
}

function remember(value: Mode) {
  try {
    localStorage.setItem(MODE_KEY, value);
  } catch {
    /* Private window or blocked storage: the page just forgets next time. */
  }
}

/** The address first, unless it is already filled in. */
function focusFor(value: Mode) {
  if (!isEmail(emailValue()) || value === 'link') {
    emailInput?.focus();
    return;
  }
  (value === 'password' ? passwordInput : newPasswordInput)?.focus();
}

function emailValue(): string {
  return emailInput?.value.trim() ?? '';
}

/** Deliberately loose. The server's EmailSchema is the real check. */
function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function showError(message: string | null) {
  if (!feedback) return;
  feedback.hidden = message === null;
  feedback.textContent = message ?? '';
}

function errorText(error: unknown): string {
  if (!(error instanceof ApiError)) return say('account.genericError');
  if (error.code === 'invalid_credentials') return say('account.signIn.invalidCredentials');
  if (error.status === 429) return say('account.signIn.tooManyAttempts');
  return say('account.genericError');
}

/** Runs one request with its button marked busy. Re-entry is a no-op, not a block. */
async function run(button: HTMLButtonElement | null | undefined, work: () => Promise<void>) {
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

// --- the sent panel ------------------------------------------------------------

/** Writes the body with the address in bold, without passing it through innerHTML. */
function renderSentBody(kind: Sent, email: string) {
  if (!sentBody) return;
  const template = say(SENT_BODY[kind]);
  const [before = '', after = ''] = template.split('{email}');
  const strong = document.createElement('strong');
  strong.className = 'text-ink';
  strong.textContent = email;
  sentBody.replaceChildren(before, strong, after);
}

function showSent(kind: Sent, email: string, password = '') {
  sent = { kind, email, password, at: Date.now() };
  renderSentBody(kind, email);
  if (resendStatus) resendStatus.textContent = '';
  if (formStep) formStep.hidden = true;
  if (sentStep) sentStep.hidden = false;
  sentHeading?.focus();
}

function showForm() {
  sent = null;
  if (sentStep) sentStep.hidden = true;
  if (formStep) formStep.hidden = false;
  emailInput?.focus();
  emailInput?.select();
}

async function mail(kind: Sent, email: string, password: string) {
  if (kind === 'link') await requestMagicLink(email);
  else if (kind === 'register') await register(email, password);
  else await requestPasswordReset(email);
}

// --- actions -------------------------------------------------------------------

function submit(event: SubmitEvent) {
  event.preventDefault();
  showError(null);
  if (!gate?.enforce()) return;

  const email = emailValue();
  if (mode !== 'password') {
    const kind: Sent = mode;
    const password = kind === 'register' ? (newPasswordInput?.value ?? '') : '';
    void run(submitButton, async () => {
      try {
        await mail(kind, email, password);
        showSent(kind, email, password);
      } catch (error) {
        showError(errorText(error));
      }
    });
    return;
  }

  void run(submitButton, async () => {
    try {
      await login(email, passwordInput?.value ?? '');
      window.location.assign(next);
    } catch (error) {
      showError(errorText(error));
      passwordInput?.select();
    }
  });
}

/** Forgot password: only the address is needed, so only the address is checked. */
function requestReset(button: HTMLButtonElement) {
  showError(null);
  gate?.reset();
  if (!addressGate?.enforce()) return;
  const email = emailValue();
  void run(button, async () => {
    try {
      await mail('reset', email, '');
      showSent('reset', email);
    } catch (error) {
      showError(errorText(error));
    }
  });
}

function resend() {
  if (!sent || !resendStatus) return;
  const wait = RESEND_COOLDOWN_MS - (Date.now() - sent.at);
  if (wait > 0) {
    resendStatus.textContent = fill(say('account.signIn.resendWait'), {
      seconds: Math.ceil(wait / 1000),
    });
    return;
  }
  const { kind, email, password } = sent;
  void run(resendButton, async () => {
    try {
      await mail(kind, email, password);
      sent = { kind, email, password, at: Date.now() };
      resendStatus.textContent = say('account.signIn.resent');
    } catch (error) {
      resendStatus.textContent = errorText(error);
    }
  });
}

/** The eye beside a password field; `data-reveal` names the field's id. */
function toggleReveal(button: HTMLButtonElement) {
  const input = document.getElementById(button.dataset.reveal ?? '');
  if (!(input instanceof HTMLInputElement)) return;
  const shown = input.type === 'text';
  input.type = shown ? 'password' : 'text';
  button.setAttribute('aria-pressed', String(!shown));
  button.setAttribute(
    'aria-label',
    say(shown ? 'account.signIn.showPassword' : 'account.signIn.hidePassword'),
  );
  input.focus();
}

// --- wiring --------------------------------------------------------------------

setMode(mode, { focus: false });

form?.addEventListener('submit', submit);
form?.addEventListener('input', () => gate?.refresh());
for (const button of root?.querySelectorAll<HTMLButtonElement>('[data-reveal]') ?? []) {
  button.addEventListener('click', () => toggleReveal(button));
}
resendButton?.addEventListener('click', resend);
root?.querySelector('[data-change-email]')?.addEventListener('click', showForm);
root?.querySelector('[data-mode-toggle]')?.addEventListener('click', () => {
  setMode(mode === 'link' ? 'password' : 'link', { focus: true });
});
root?.querySelector('[data-go="register"]')?.addEventListener('click', () => {
  setMode('register', { focus: true });
});
root?.querySelector('[data-go="sign-in"]')?.addEventListener('click', () => {
  setMode(readStoredMode(), { focus: true });
});
root
  ?.querySelector<HTMLButtonElement>('[data-reset]')
  ?.addEventListener('click', (event) => requestReset(event.currentTarget as HTMLButtonElement));

/* Already signed in — a bookmarked /accedi/, or the back button after signing
   in. Nothing to do here, so go where they were headed. */
void loadCustomer()
  .then((customer) => {
    if (customer) window.location.replace(next);
  })
  .catch(() => {
    /* The API is unreachable; the form still works once it is back. */
  });
