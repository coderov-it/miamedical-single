/**
 * "This browser was signed in last time we asked" — a hint, never proof.
 *
 * The session cookie lives on the API's host, so neither the storefront server
 * nor the first paint can tell a customer from a visitor. The account island
 * reads this to choose its loading plate: the account-shaped skeleton for
 * someone we expect back, a plain spinner for everyone else, so a signed-out
 * visitor never sees a dashboard about to fill in. `/auth/me` still decides.
 */
const KEY = 'mia:signed-in';

export function rememberSignedIn(signedIn: boolean): void {
  try {
    if (signedIn) {
      window.localStorage.setItem(KEY, '1');
      return;
    }
    window.localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the island falls back to the plain spinner.
  }
}

export function wasSignedIn(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
