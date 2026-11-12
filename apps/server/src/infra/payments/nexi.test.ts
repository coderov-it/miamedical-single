import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fromCents, readOutcome, toCents } from './nexi.ts';

test('money crosses to Nexi in cents and back', () => {
  assert.equal(toCents('30.00'), '3000');
  assert.equal(toCents('30.5'), '3050');
  assert.equal(toCents('1234.07'), '123407');
  assert.equal(toCents('7'), '700');
  assert.equal(fromCents('3545'), '35.45');
});

test('a successful authorization or capture is paid', () => {
  const outcome = readOutcome({
    operations: [
      {
        operationId: '852525265182852619',
        operationType: 'AUTHORIZATION',
        operationResult: 'EXECUTED',
        operationAmount: '3000',
        paymentCircuit: 'VISA',
      },
    ],
  });
  assert.equal(outcome.status, 'paid');
  assert.equal(outcome.amount, '30.00');
  assert.equal(outcome.circuit, 'VISA');
});

test('the latest failed operation decides a decline', () => {
  const outcome = readOutcome({
    orderStatus: {
      operations: [
        {
          operationType: 'AUTHORIZATION',
          operationResult: 'DECLINED',
          operationTime: '2026-11-12T10:01:00Z',
        },
      ],
    },
  });
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.result, 'DECLINED');
});

test('an abandoned page is cancelled; nothing yet is pending', () => {
  assert.equal(readOutcome({ operations: [{ operationResult: 'CANCELED' }] }).status, 'cancelled');
  assert.equal(readOutcome({ orderStatus: {} }).status, 'pending');
});
