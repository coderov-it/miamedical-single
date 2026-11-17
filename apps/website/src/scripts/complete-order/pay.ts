/**
 * The payment step: one button that starts the Nexi session and goes there.
 *
 *   "Paga 160,00 €"     POST /api/order-links/payment → the gateway's page (or the result page,
 *                       which offers a retry, when the gateway could not be reached)
 *   409, step sign      the rental contract is not signed: said HERE, in this card, with the
 *                       customer sent no further than the sentence
 *   409 with fields     details incomplete: marked in the details step
 *   409 / 403           "cannot be paid right now"
 *
 * The button is never disabled; pressing it too early is answered by the server's own rule.
 */
import { fill, type AccountCopyData } from '../account/copy';
import { goToPayment } from '../payment/client.ts';
import { type LinkClient, LinkError } from './client.ts';
import { money } from './format.ts';
import type { GoneReason, LinkSummary } from './types.ts';

export interface PayStep {
  paint: (summary: LinkSummary) => void;
}

export interface PayOptions {
  client: LinkClient;
  copy: AccountCopyData;
  /** The result page's path, where Nexi returns the customer. */
  resultPath: string;
  onFields: (fields: Record<string, string>) => void;
  onGone: (reason: GoneReason | null) => void;
}

export function createPayStep(root: HTMLElement, options: PayOptions): PayStep {
  const button = root.querySelector<HTMLButtonElement>('[data-co-pay]')!;
  const errorLine = root.querySelector<HTMLElement>('[data-co-pay-error]')!;
  const say = (key: string) => options.copy.text[key] ?? '';
  let label = '';
  let busy = false;

  function showError(message: string): void {
    errorLine.textContent = message;
    errorLine.hidden = false;
    errorLine.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function reject(error: unknown): void {
    if (!(error instanceof LinkError)) {
      showError(say('payment.openFailed'));
      return;
    }
    if (error.status === 410) options.onGone(error.reason);
    else if (error.status === 409 && error.step === 'sign')
      showError(say('completeOrder.pay.signFirst'));
    else if (error.status === 409 && Object.keys(error.fields).length > 0)
      options.onFields(error.fields);
    else if (error.status === 409 || error.status === 403)
      showError(say('completeOrder.pay.unavailable'));
    else showError(say('payment.openFailed'));
  }

  async function pay(): Promise<void> {
    errorLine.hidden = true;
    if (busy) return;
    busy = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = say('openingPayment');
    try {
      goToPayment(await options.client.pay(), options.resultPath);
    } catch (error) {
      busy = false;
      button.removeAttribute('aria-busy');
      button.textContent = label;
      reject(error);
    }
  }

  button.addEventListener('click', () => void pay());

  return {
    paint(summary) {
      label = fill(say('completeOrder.pay.button'), {
        total: money(summary.total, summary.currency),
      });
      if (!busy) button.textContent = label;
    },
  };
}
