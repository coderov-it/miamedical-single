import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildManualOrderLinkMessage, type ManualOrderLinkMail } from './manual-order-mail.ts';

const base: ManualOrderLinkMail = {
  email: 'anna@example.it',
  firstName: 'Anna',
  lastName: 'Rossi',
  orderNumber: 'MIA-2026-001050',
  total: '160.00',
  currency: 'EUR',
  discount: '20.00',
  steps: 'sign_pay',
  includeDetails: true,
  url: 'https://miamedicalitalia.com/complete-order/?token=LINK',
  expiresAt: '2026-12-17T10:00:00.000Z',
  reportUrl: 'https://miamedicalitalia.com/report-order/?token=REPORT',
  language: 'it',
};

/** The link send uses the manual-order template and the order-report link, not the stub. */
test('the message carries the order link, the report link, the number and the discount', () => {
  const message = buildManualOrderLinkMessage(base);
  assert.equal(message.subject, 'Completa il tuo ordine MIA-2026-001050');
  assert.deepEqual(message.to, ['anna@example.it']);
  for (const body of [message.html, message.text]) {
    assert.ok(body.includes('complete-order/?token=LINK'));
    assert.ok(body.includes('report-order/?token=REPORT'));
    assert.ok(body.includes('MIA-2026-001050'));
    assert.ok(body.includes('Sconto'));
  }
});
