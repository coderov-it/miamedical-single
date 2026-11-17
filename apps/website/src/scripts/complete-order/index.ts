/**
 * The order link's page behaviour: read the order, show the steps the token allows, keep the
 * summary beside them. Markup: views/complete-order/CompleteOrderBody.astro. Server:
 * apps/server/src/modules/order-links. Flow: docs/code/manual-orders.md.
 *
 *   open                GET /api/order-links?token=…  → summary + allowed steps
 *   any step            repaints from the summary the server sent back, never from its own guess
 *   410 / 404           one panel says why (replaced, expired, already paid, closed) with the phone
 *   sign-only link      after signing, a thank-you line instead of a payment step
 */
import { fill, readAccountCopy } from '../account/copy';
import { createLinkClient, LinkError } from './client.ts';
import { createContractStep } from './contract.ts';
import { createDetailsStep } from './details.ts';
import { createPayStep } from './pay.ts';
import { paintSummary } from './summary.ts';
import type { GoneReason, LinkSummary } from './types.ts';

const root = document.querySelector<HTMLElement>('[data-complete-order]');
if (root) wire(root);

type Panel = 'loading' | 'gone' | 'error' | 'main';

function wire(root: HTMLElement): void {
  const copy = readAccountCopy();
  const say = (key: string) => copy.text[key] ?? '';
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const client = createLinkClient(root.dataset.apiBase ?? '', token);

  function show(panel: Panel, message = ''): void {
    for (const node of root.querySelectorAll<HTMLElement>('[data-co-panel]')) {
      node.hidden = node.dataset.coPanel !== panel;
    }
    const text = root.querySelector<HTMLElement>(`[data-co-panel="${panel}"] [data-co-message]`);
    if (text) text.textContent = message;
  }

  function gone(reason: GoneReason | null): void {
    show('gone', say(`completeOrder.gone.${reason ?? 'unknown'}`));
  }

  const step = (name: string) => root.querySelector<HTMLElement>(`[data-co-step="${name}"]`)!;

  const details = createDetailsStep(step('details'), {
    client,
    copy,
    onSaved: (summary) => paint(summary),
    onGone: gone,
  });
  const markFields = (fields: Record<string, string>) => {
    details.markFields(fields);
    void reload();
  };
  const contract = createContractStep(step('contract'), {
    client,
    copy,
    beforeSign: () => {
      if (!details.isDirty()) return false;
      details.demandSave(say('completeOrder.contract.needDetails'));
      return true;
    },
    onSigned: () => void reload(),
    onFields: markFields,
    onGone: gone,
  });
  const pay = createPayStep(step('pay'), {
    client,
    copy,
    resultPath: root.dataset.paymentResult ?? window.location.pathname,
    onFields: markFields,
    onGone: gone,
  });

  function paint(summary: LinkSummary): void {
    const { steps } = summary;
    const signed = summary.contractSigned;
    const complete = summary.missingFields.length === 0;
    const shown = [
      ['details', steps.details, complete],
      ['contract', steps.sign, signed],
      ['pay', steps.pay, false],
    ] as const;

    let number = 0;
    for (const [name, allowed, done] of shown) {
      const node = step(name);
      node.hidden = !allowed;
      node.dataset.state = done ? 'done' : 'active';
      if (!allowed) continue;
      number += 1;
      const badge = node.querySelector('[data-co-number]');
      if (badge) badge.textContent = String(number);
    }

    root.querySelector('[data-co-order-line]')!.textContent = fill(say('completeOrder.orderLine'), {
      number: summary.orderNumber,
    });
    root.querySelector<HTMLElement>('[data-co-signed-only]')!.hidden = !(signed && !steps.pay);
    paintSummary(root, summary, copy);
    details.paint(summary);
    contract.paint(summary);
    pay.paint(summary);
    show('main');
  }

  async function reload(): Promise<void> {
    try {
      paint(await client.summary());
    } catch (error) {
      fail(error);
    }
  }

  function fail(error: unknown): void {
    if (error instanceof LinkError && (error.status === 410 || error.status === 404)) {
      gone(error.reason);
      return;
    }
    show('error', say('completeOrder.loadError'));
  }

  if (!token) {
    show('error', say('completeOrder.linkIncomplete'));
    return;
  }
  void reload();
}
