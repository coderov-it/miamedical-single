import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { EmailLanguage } from './component/language.ts';
import { manualOrderLink } from './manual-order-link.ts';
import { EMAIL_SAMPLES } from './samples.ts';

const LANGUAGES: EmailLanguage[] = ['it', 'en', 'fr', 'de'];

const input = (
  language: EmailLanguage,
  over: Partial<Parameters<typeof manualOrderLink>[0]> = {},
) =>
  manualOrderLink({
    to: 'a@example.it',
    recipient: { firstName: 'Anna', lastName: 'Rossi' },
    order: { number: 'MIA-2026-001050', total: '160.00', currency: 'EUR' },
    discount: '20.00',
    steps: 'sign_pay',
    includeDetails: true,
    url: 'https://x.test/complete-order/?token=LINK',
    reportUrl: 'https://x.test/report-order/?token=REPORT',
    expiresAt: '2026-12-17T10:00:00.000Z',
    language,
    ...over,
  });

for (const language of LANGUAGES) {
  test(`renders in ${language} with link, report link, number, discount and expiry`, () => {
    const message = input(language);
    for (const body of [message.html, message.text]) {
      assert.ok(body.includes('complete-order/?token=LINK'));
      assert.ok(body.includes('report-order/?token=REPORT'));
      assert.ok(body.includes('MIA-2026-001050'));
      assert.ok(body.includes('2026'));
    }
    assert.ok(message.html.includes('1. '));
    assert.ok(message.html.includes('3. '));
    assert.match(message.text, /−/);
    assert.ok(!message.html.includes('undefined'));
  });
}

test('only the steps the link allows are listed', () => {
  const pay = input('it', { steps: 'pay', includeDetails: false, discount: '0.00' });
  assert.ok(pay.text.includes('1. Paga online'));
  assert.ok(!pay.text.includes('firma'));
  assert.ok(!pay.text.includes('Sconto'));
  const sign = input('en', { steps: 'sign', includeDetails: false });
  assert.ok(sign.text.includes('1. Read and sign'));
  assert.ok(!sign.text.includes('Pay securely'));
});

test('a customer with no name yet is greeted without a dangling space', () => {
  assert.ok(input('it', { recipient: { firstName: '', lastName: '' } }).text.startsWith('Ciao,'));
});

test('the sample is registered for /email-preview in every language', () => {
  const sample = EMAIL_SAMPLES.find((entry) => entry.name === 'manualOrderLink');
  assert.ok(sample);
  for (const language of LANGUAGES) assert.ok(sample.render(language).html.length > 0);
});
