import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  countDecisions,
  highlightFor,
  nodeFor,
  type HighlightOrder,
} from './status-map-highlight.ts';

const order = (over: Partial<HighlightOrder>): HighlightOrder => ({
  status: 'pending',
  allowedStatuses: [],
  events: [],
  returnUnits: [],
  ...over,
});
const status = (...to: string[]) => to.map((toValue) => ({ field: 'status', toValue }));

test('cancelled and refunded land on the exit box of the step they left', () => {
  assert.equal(nodeFor('cancelled', 'paid'), 'paidExit');
  assert.equal(nodeFor('cancelled', 'pending'), 'cancelled');
  assert.equal(nodeFor('cancelled', 'delivery_missed'), 'cancelled');
  assert.equal(nodeFor('refunded', 'fulfilled'), 'fulfilledExit');
  assert.equal(nodeFor('paid', 'pending'), 'paid');
});

test('a fresh order sits on pending with its next moves marked', () => {
  const h = highlightFor(order({ allowedStatuses: ['paid', 'cancelled'] }));
  assert.equal(h.current, 'pending');
  assert.deepEqual([...h.next].sort(), ['cancelled', 'paid']);
});

test('a retried delivery traverses the retry edges', () => {
  const h = highlightFor(
    order({
      status: 'out_for_delivery',
      events: status('paid', 'out_for_delivery', 'delivery_missed', 'out_for_delivery'),
    }),
  );
  assert.ok(h.traversed.has('out_for_delivery>delivery_missed'));
  assert.ok(h.traversed.has('delivery_missed>out_for_delivery'));
  assert.ok(h.visited.has('delivery_missed'));
  assert.equal(h.current, 'out_for_delivery');
});

test('pickup passes through "with customer"', () => {
  const h = highlightFor(
    order({
      status: 'out_for_pickup',
      events: status('paid', 'out_for_delivery', 'delivered', 'out_for_pickup'),
    }),
  );
  assert.ok(h.traversed.has('delivered>withCustomer'));
  assert.ok(h.traversed.has('withCustomer>out_for_pickup'));
});

test('a cancelled paid order ends on the paid exit', () => {
  const h = highlightFor(order({ status: 'cancelled', events: status('paid', 'cancelled') }));
  assert.equal(h.current, 'paidExit');
  assert.ok(h.traversed.has('paid>paidExit'));
});

test('decisions are counted and light their boxes', () => {
  const units = [
    {
      decisions: [
        { outcome: 'restocked', resolution: null },
        { outcome: 'attention', resolution: null },
        { outcome: 'attention', resolution: 'repaired' },
      ],
    },
  ];
  assert.deepEqual(countDecisions(units), {
    stockBack: 1,
    attention: 2,
    attentionOpen: 1,
    repaired: 1,
    writtenOff: 0,
  });
  const h = highlightFor(order({ status: 'fulfilled', returnUnits: units }));
  assert.ok(h.visited.has('stockBack') && h.visited.has('repaired'));
  assert.ok(!h.visited.has('writtenOff'));
});
