/**
 * The behaviour of the card an emailed sign-in link lands on. Markup and its
 * four states: views/account/ActivateAccountView.astro.
 *
 * The two flows spend their single-use link at different moments:
 *
 *   activation / magic link   spent on load — the click itself activates and
 *                             signs in, then a password is optional
 *   password reset            spent on save — the token and the new password
 *                             travel together, so the account never needs to
 *                             prove a password it has forgotten
 *
 * A spent activation link opened again in the same browser — a language switch
 * carries the query along, a reload repeats it — finds the session the first
 * visit established and carries on from there instead of reporting a dead link.
 */
import {
  ApiError,
  type Customer,
  loadCustomer,
  redeemToken,
  setPassword,
  tokenFromQuery,
} from '~/lib/customer-session';
import { createFormGate } from '~/lib/form-validation';
import { readAccountCopy } from '~/scripts/account/copy';

type State = 'checking' | 'signed-in' | 'ready' | 'error';

const copy = readAccountCopy();
const say = (key: string) => copy.text[key] ?? '';

const page = document.querySelector<HTMLElement>('[data-page]');
const passwordRequired = page?.dataset.passwordRequired === 'true';
const errorBox = document.querySelector<HTMLElement>('[data-error]');
const submitError = document.querySelector<HTMLElement>('[data-submit-error]');
const form = document.querySelector<HTMLFormElement>('[data-form]');
const submit = document.querySelector<HTMLButtonElement>('[data-submit]');
const skip = document.querySelector<HTMLButtonElement>('[data-skip]');
const passwordInput = document.querySelector<HTMLInputElement>('#password');

const isRateLimited = (error: unknown) => error instanceof ApiError && error.status === 429;
/** A 4xx other than the rate limit: the server looked at the link and refused it. */
const isRefused = (error: unknown) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429;

function show(state: State) {
  if (page) page.dataset.state = state;
}

function fail(message: string) {
  show('error');
  if (!errorBox) return;
  errorBox.innerHTML = `${message} <a class="underline" href="${copy.routes.login}">${say('account.activate.requestNewLink')}</a>.`;
}

/** Keeps a spent token out of the address bar, so a reload does not replay it. */
function forgetToken() {
  const url = new URL(window.location.href);
  url.searchParams.delete('token');
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
}

function leaveForAccount() {
  show('signed-in');
  window.location.replace(copy.routes.accountOrders);
}

function askForPassword() {
  show('ready');
  passwordInput?.focus();
}

/** The link's customer, or — when the link was already spent here — the session's. */
async function signIn(token: string | null): Promise<Customer | null> {
  if (token) {
    try {
      const customer = await redeemToken(token);
      forgetToken();
      return customer;
    } catch (error) {
      if (!isRefused(error)) throw error;
    }
  }
  return loadCustomer();
}

async function activate(token: string | null) {
  try {
    const customer = await signIn(token);
    if (!customer) {
      fail(say(token ? 'account.activate.linkUnverifiable' : 'account.activate.linkIncomplete'));
      return;
    }
    // Registered with a password, or set one before: nothing left to ask.
    if (customer.hasPassword) {
      leaveForAccount();
      return;
    }
    askForPassword();
  } catch (error) {
    // The API's own message is English; only its status is read here.
    fail(
      say(
        isRateLimited(error)
          ? 'account.signIn.tooManyAttempts'
          : 'account.activate.linkUnverifiable',
      ),
    );
  }
}

const token = tokenFromQuery();

if (passwordRequired) {
  if (token) askForPassword();
  else fail(say('account.activate.linkIncomplete'));
} else {
  void activate(token);
}

/* A too-short password is said at the field, like every other storefront form:
   marked, described, focused, and the count announced. The floor is read back
   off the rendered `minlength`, which already carries
   CUSTOMER_PASSWORD_MIN_LENGTH, so there is no second number to keep in step. */
const gate = form
  ? createFormGate(
      form,
      [
        {
          key: 'password',
          isSatisfied: () => (passwordInput?.value.length ?? 0) >= (passwordInput?.minLength ?? 0),
          controls: () => [passwordInput],
        },
      ],
      { announce: form.querySelector<HTMLElement>('[data-announce]') },
    )
  : null;
form?.addEventListener('input', () => gate?.refresh());

/** Reset spends the link here, with the password; activation already spent it. */
async function savePassword(password: string) {
  if (passwordRequired && token) {
    await redeemToken(token, password);
    forgetToken();
    return;
  }
  await setPassword({ newPassword: password });
}

function reportSaveFailure(error: unknown) {
  if (passwordRequired && error instanceof ApiError && error.code === 'invalid_token') {
    fail(say('account.activate.linkUnverifiable'));
    return;
  }
  if (!submitError) return;
  submitError.hidden = false;
  submitError.textContent = say(
    isRateLimited(error) ? 'account.signIn.tooManyAttempts' : 'account.genericError',
  );
}

let busy = false;

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!gate?.enforce()) return;
  // A second press while saving is ignored, not blocked: the button stays live.
  if (busy) return;
  if (submitError) submitError.hidden = true;

  void (async () => {
    busy = true;
    submit?.setAttribute('aria-busy', 'true');
    try {
      await savePassword(passwordInput?.value ?? '');
      leaveForAccount();
    } catch (error) {
      reportSaveFailure(error);
    } finally {
      busy = false;
      submit?.removeAttribute('aria-busy');
    }
  })();
});

// Already signed in by the redemption above, so skipping just moves on.
skip?.addEventListener('click', () => window.location.assign(copy.routes.accountOrders));
