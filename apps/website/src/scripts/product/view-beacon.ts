/**
 * Sends one "product viewed" beacon per page view, once the page is really seen.
 *
 *   POST {data-api-base}/api/products/{data-product-id}/view   (no body, 204)
 *
 * Waits for the tab to be visible and for any prerender to finish, skips
 * automated browsers, and skips a product already counted in this tab within
 * 30 minutes. Everything is best-effort: it never throws and never logs.
 * Rules live in `view-beacon-rules.ts`; see docs/code/product-views.md.
 */
import { isAutomated, isOutsideWindow, parseSentAt, storageKey } from './view-beacon-rules.ts';

function alreadyCounted(productId: string): boolean {
  try {
    const raw = sessionStorage.getItem(storageKey(productId));
    return !isOutsideWindow(parseSentAt(raw), Date.now());
  } catch {
    return false;
  }
}

function remember(productId: string): void {
  try {
    sessionStorage.setItem(storageKey(productId), String(Date.now()));
  } catch {
    // Blocked storage only means a reload may count again.
  }
}

function send(url: string): void {
  try {
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url)) return;
  } catch {
    // Fall through to fetch.
  }
  try {
    fetch(url, { method: 'POST', keepalive: true, mode: 'cors', credentials: 'omit' }).catch(
      () => {},
    );
  } catch {
    // Nothing else to try.
  }
}

/** Runs `fire` once, the first moment the page is visible and not prerendering. */
function whenSeen(fire: () => void): void {
  let done = false;
  function attempt(): void {
    if (done) return;
    if ((document as Document & { prerendering?: boolean }).prerendering) return;
    if (document.visibilityState !== 'visible') return;
    done = true;
    document.removeEventListener('visibilitychange', attempt);
    document.removeEventListener('prerenderingchange', attempt);
    fire();
  }
  document.addEventListener('visibilitychange', attempt);
  document.addEventListener('prerenderingchange', attempt);
  attempt();
}

export function startViewBeacon(): void {
  try {
    const root = document.querySelector<HTMLElement>('[data-pdp-root]');
    const productId = root?.dataset.productId;
    const apiBase = root?.dataset.apiBase;
    if (!productId || !apiBase) return;
    if (isAutomated(navigator.webdriver)) return;

    whenSeen(() => {
      if (alreadyCounted(productId)) return;
      remember(productId);
      send(`${apiBase}/api/products/${encodeURIComponent(productId)}/view`);
    });
  } catch {
    // A failing beacon must never reach the rest of the page.
  }
}
