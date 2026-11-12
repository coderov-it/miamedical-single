/**
 * The payment result page's behaviour: read the attempt, show its panel, keep
 * asking while the gateway has not confirmed, and start a new payment on
 * "Try again". Panels: views/payment/PaymentResultBody.astro.
 *
 *   back from Nexi, paid              GET → paid               → ✓ panel
 *   back before Nexi's notification   GET → pending (×n, 3 s)  → paid → ✓ panel
 *   card declined                     GET → failed, canRetry   → "Try again" → Nexi
 *   came back after the deadline      GET → failed, !canRetry  → "can no longer be paid"
 */
import { fill, readAccountCopy } from '../account/copy';
import { documentLocale } from '../locale';
import {
  goToPayment,
  PaymentLinkError,
  type PaymentResult,
  readPayment,
  retryPayment,
} from './client.ts';

const POLL_MS = 3_000;
/* About half a minute. Past it the page stops asking and says what it knows. */
const POLL_LIMIT = 10;

type Panel = 'checking' | 'paid' | 'pending' | 'failed' | 'closed' | 'error';

const root = document.querySelector<HTMLElement>('[data-payment-result]');
if (root) wire(root);

function wire(root: HTMLElement): void {
  const copy = readAccountCopy();
  const say = (key: string) => copy.text[key] ?? '';
  const apiBase = root.dataset.apiBase ?? '';
  const resultPath = window.location.pathname;
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  let polls = 0;

  function show(panel: Panel): void {
    for (const node of root.querySelectorAll<HTMLElement>('[data-pay-panel]')) {
      node.hidden = node.dataset.payPanel !== panel;
    }
  }

  function showError(message: string): void {
    const node = root.querySelector('[data-pay-error]');
    if (node) node.textContent = message;
    show('error');
  }

  function formatDue(iso: string): string {
    return new Intl.DateTimeFormat(documentLocale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  }

  function paintPaid(result: PaymentResult): void {
    const number = root.querySelector('[data-pay-number]');
    if (number) number.textContent = result.orderNumber;
    const detail = root.querySelector('[data-pay-paid-detail]');
    const key = result.kind === 'renewal' ? 'payment.renewalPaidDetail' : 'payment.paidDetail';
    if (detail) detail.textContent = fill(say(key), { number: result.orderNumber });
    show('paid');
  }

  function paint(result: PaymentResult): void {
    if (result.status === 'paid') {
      paintPaid(result);
      return;
    }
    if (result.status === 'pending') {
      polls += 1;
      if (polls < POLL_LIMIT) {
        window.setTimeout(() => void load(), POLL_MS);
        return;
      }
      const retry = root.querySelector<HTMLElement>('[data-pay-panel="pending"] [data-pay-retry]');
      if (retry) retry.hidden = !result.canRetry;
      show('pending');
      return;
    }
    if (!result.canRetry) {
      show('closed');
      return;
    }
    const kept = root.querySelector<HTMLElement>('[data-pay-kept-until]');
    if (kept && result.paymentDueAt) {
      kept.textContent = fill(say('payment.keptUntil'), { time: formatDue(result.paymentDueAt) });
      kept.hidden = false;
    }
    show('failed');
  }

  async function load(): Promise<void> {
    try {
      paint(await readPayment(apiBase, token));
    } catch (error) {
      showError(
        error instanceof PaymentLinkError ? say('payment.linkInvalid') : say('payment.loadError'),
      );
    }
  }

  async function retry(button: HTMLButtonElement): Promise<void> {
    if (button.getAttribute('aria-busy') === 'true') return;
    button.setAttribute('aria-busy', 'true');
    button.textContent = say('openingPayment');
    const failure = root.querySelector<HTMLElement>('[data-pay-retry-error]');
    if (failure) failure.hidden = true;
    try {
      goToPayment(await retryPayment(apiBase, token), resultPath);
    } catch {
      button.removeAttribute('aria-busy');
      button.textContent = say('payment.tryAgain');
      if (failure) failure.hidden = false;
    }
  }

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-pay-retry]')) {
    button.addEventListener('click', () => void retry(button));
  }

  if (!token) {
    showError(say('payment.linkInvalid'));
    return;
  }
  void load();
}
