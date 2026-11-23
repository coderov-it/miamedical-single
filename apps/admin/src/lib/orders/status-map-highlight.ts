/**
 * What is lit on the status map for one order: where it has been, where it is,
 * and where it may go next. Pure, so the rules are testable without a DOM.
 */
import { edgeKey, type NodeId } from './status-map.ts';

export interface HighlightOrder {
  status: string;
  allowedStatuses: readonly string[];
  events: readonly { field: string; toValue: string }[];
  returnUnits: readonly {
    decisions: readonly { outcome: string; resolution: string | null }[];
  }[];
}

export interface Counts {
  stockBack: number;
  attention: number;
  attentionOpen: number;
  repaired: number;
  writtenOff: number;
}

export interface Highlight {
  current: NodeId;
  visited: ReadonlySet<NodeId>;
  next: ReadonlySet<NodeId>;
  traversed: ReadonlySet<string>;
  counts: Counts;
}

/**
 * The box for a status. `cancelled` and `refunded` are drawn once per place the
 * order can leave from, so the status before them picks the box.
 */
export function nodeFor(status: string, previous: string | undefined): NodeId {
  if (status !== 'cancelled' && status !== 'refunded') return status as NodeId;
  if (previous === 'paid') return 'paidExit';
  if (previous === 'fulfilled') return 'fulfilledExit';
  return 'cancelled';
}

export function countDecisions(units: HighlightOrder['returnUnits']): Counts {
  const counts: Counts = {
    stockBack: 0,
    attention: 0,
    attentionOpen: 0,
    repaired: 0,
    writtenOff: 0,
  };
  for (const unit of units) {
    for (const decision of unit.decisions) {
      if (decision.outcome === 'restocked') counts.stockBack += 1;
      if (decision.outcome !== 'attention') continue;
      counts.attention += 1;
      if (decision.resolution === null) counts.attentionOpen += 1;
      if (decision.resolution === 'repaired') counts.repaired += 1;
      if (decision.resolution === 'written_off') counts.writtenOff += 1;
    }
  }
  return counts;
}

/** The path as box ids: `pending`, then each status event; "with customer" sits between delivery and pickup. */
function pathOf(order: HighlightOrder): NodeId[] {
  const path: NodeId[] = ['pending'];
  let previous = 'pending';
  for (const event of order.events) {
    if (event.field !== 'status') continue;
    const node = nodeFor(event.toValue, previous);
    if (node === 'out_for_pickup' && path[path.length - 1] === 'delivered') {
      path.push('withCustomer');
    }
    path.push(node);
    previous = event.toValue;
  }
  return path;
}

export function highlightFor(order: HighlightOrder): Highlight {
  const path = pathOf(order);
  const counts = countDecisions(order.returnUnits);
  const visited = new Set<NodeId>(path);
  const traversed = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    traversed.add(edgeKey({ from: path[i]!, to: path[i + 1]! }));
  }

  // A decision is a fact of its own, not a status: the counts light the boxes.
  const lit: [NodeId, NodeId, number][] = [
    ['received', 'stockBack', counts.stockBack],
    ['received', 'attention', counts.attention],
    ['attention', 'repaired', counts.repaired],
    ['attention', 'writtenOff', counts.writtenOff],
  ];
  for (const [from, to, count] of lit) {
    if (count === 0) continue;
    visited.add(to);
    traversed.add(edgeKey({ from, to }));
  }

  const next = new Set<NodeId>(order.allowedStatuses.map((to) => nodeFor(to, order.status)));
  const current = nodeFor(order.status, statusBefore(order));
  visited.add(current);
  return { current, visited, next, traversed, counts };
}

/** The status the order held before its current one. */
function statusBefore(order: HighlightOrder): string | undefined {
  const statuses = order.events.filter((e) => e.field === 'status').map((e) => e.toValue);
  if (statuses.length < 2) return 'pending';
  return statuses[statuses.length - 2];
}
