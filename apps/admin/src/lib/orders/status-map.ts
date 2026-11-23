/**
 * The status map's layout: which boxes, where, and how the arrows run between
 * them. Pure data and geometry, no copy and no colours — the dialog resolves
 * labels and `status-map-highlight.ts` decides what is lit.
 *
 * Boxes sit on a (column, row) grid; arrows run at right angles, leaving and
 * entering a box at the middle of a side. A sale shows rows 0-2, a rental adds
 * rows 3-6 (the return and the inspection), so an order only ever sees its own
 * flow.
 */
import type { MessageKey } from '~/lib/ui-text';

export type MapFlow = 'sale' | 'rental';
export type Side = 'l' | 'r' | 't' | 'b';

export type NodeId =
  | 'pending'
  | 'paid'
  | 'out_for_delivery'
  | 'delivery_missed'
  | 'delivered'
  | 'out_for_pickup'
  | 'pickup_missed'
  | 'received'
  | 'fulfilled'
  | 'cancelled'
  | 'paidExit'
  | 'fulfilledExit'
  | 'withCustomer'
  | 'stockBack'
  | 'attention'
  | 'repaired'
  | 'writtenOff';

/** What a box says: an order status (label from the catalogue of statuses) or a message. */
export type NodeLabel =
  | { kind: 'status'; status: string }
  | { kind: 'statuses'; statuses: readonly string[] }
  | { kind: 'text'; key: MessageKey };

export interface MapNode {
  id: NodeId;
  col: number;
  row: number;
  label: NodeLabel;
  /** Dashed box that is a stretch of time, not a status. */
  time?: boolean;
  /** Orange: an attempt that failed, or a unit that needs a look. */
  warn?: boolean;
}

export interface MapEdge {
  from: NodeId;
  to: NodeId;
  label?: MessageKey;
  /** Default: picked from the relative position when the two boxes share a row or column. */
  fromSide?: Side;
  toSide?: Side;
  /** Shift along the side, so two arrows between the same pair do not overlap. */
  lane?: number;
  /** Route the horizontal run through the gap under this row. */
  bendAfterRow?: number;
}

export const NODE_W = 160;
export const NODE_H = 44;
const PITCH_X = 184;
const PITCH_Y = 76;
const PAD = 14;

const status = (id: NodeId, col: number, row: number, warn = false): MapNode => ({
  id,
  col,
  row,
  label: { kind: 'status', status: id },
  warn,
});
const text = (id: NodeId, col: number, row: number, key: MessageKey, warn = false): MapNode => ({
  id,
  col,
  row,
  label: { kind: 'text', key },
  warn,
});

export function mapNodes(flow: MapFlow): MapNode[] {
  const nodes: MapNode[] = [
    {
      id: 'paidExit',
      col: 1,
      row: 0,
      label: { kind: 'statuses', statuses: ['cancelled', 'refunded'] },
    },
    status('pending', 0, 1),
    status('paid', 1, 1),
    status('out_for_delivery', 2, 1),
    status('delivered', 3, 1),
    status('cancelled', 0, 2),
    status('delivery_missed', 2, 2, true),
  ];
  if (flow === 'sale') {
    return [
      ...nodes,
      status('fulfilled', 4, 1),
      { id: 'fulfilledExit', col: 4, row: 2, label: { kind: 'status', status: 'refunded' } },
    ];
  }
  return [
    ...nodes,
    { id: 'fulfilledExit', col: 4, row: 2, label: { kind: 'status', status: 'refunded' } },
    { ...text('withCustomer', 0, 3, 'orders.mapWithCustomer'), time: true },
    status('out_for_pickup', 1, 3),
    status('received', 2, 3),
    status('fulfilled', 4, 3),
    status('pickup_missed', 1, 4, true),
    text('stockBack', 2, 5, 'orders.mapStockBack'),
    text('attention', 3, 5, 'orders.mapAttention', true),
    text('repaired', 3, 6, 'orders.mapRepaired'),
    text('writtenOff', 4, 6, 'orders.mapWrittenOff'),
  ];
}

export function mapEdges(flow: MapFlow): MapEdge[] {
  const shared: MapEdge[] = [
    { from: 'pending', to: 'paid' },
    { from: 'pending', to: 'cancelled' },
    { from: 'paid', to: 'paidExit' },
    { from: 'paid', to: 'out_for_delivery' },
    { from: 'out_for_delivery', to: 'delivery_missed', lane: -14 },
    { from: 'delivery_missed', to: 'out_for_delivery', lane: 14, label: 'orders.mapRetry' },
    { from: 'delivery_missed', to: 'cancelled', label: 'orders.mapGiveUp' },
    { from: 'out_for_delivery', to: 'delivered' },
    { from: 'fulfilled', to: 'fulfilledExit' },
  ];
  if (flow === 'sale') {
    return [...shared, { from: 'delivered', to: 'fulfilled', label: 'orders.mapSale' }];
  }
  return [
    ...shared,
    { from: 'delivered', to: 'withCustomer', fromSide: 'b', toSide: 't', bendAfterRow: 2 },
    { from: 'withCustomer', to: 'out_for_pickup' },
    { from: 'out_for_pickup', to: 'pickup_missed', lane: -14 },
    { from: 'pickup_missed', to: 'out_for_pickup', lane: 14, label: 'orders.mapRetry' },
    { from: 'out_for_pickup', to: 'received' },
    { from: 'received', to: 'fulfilled', label: 'orders.mapEveryUnit' },
    { from: 'received', to: 'stockBack', label: 'orders.mapDecideEach' },
    { from: 'received', to: 'attention', fromSide: 'b', toSide: 't', bendAfterRow: 4 },
    { from: 'attention', to: 'repaired' },
    { from: 'attention', to: 'writtenOff', fromSide: 'b', toSide: 't', bendAfterRow: 5 },
  ];
}

interface Point {
  x: number;
  y: number;
}

export interface RoutedEdge {
  edge: MapEdge;
  /** SVG path data. */
  d: string;
  /** Where the label sits, and which way it hangs off the line. */
  label: { x: number; y: number; anchor: 'start' | 'middle' | 'end' };
}

function anchorOf(node: MapNode, side: Side, lane: number): Point {
  const left = PAD + node.col * PITCH_X;
  const top = PAD + node.row * PITCH_Y;
  if (side === 'r') return { x: left + NODE_W, y: top + NODE_H / 2 + lane };
  if (side === 'l') return { x: left, y: top + NODE_H / 2 + lane };
  if (side === 't') return { x: left + NODE_W / 2 + lane, y: top };
  return { x: left + NODE_W / 2 + lane, y: top + NODE_H };
}

function sidesFor(edge: MapEdge, from: MapNode, to: MapNode): [Side, Side] {
  if (edge.fromSide && edge.toSide) return [edge.fromSide, edge.toSide];
  if (from.row === to.row) return from.col < to.col ? ['r', 'l'] : ['l', 'r'];
  return from.row < to.row ? ['b', 't'] : ['t', 'b'];
}

const vertical = (side: Side) => side === 't' || side === 'b';

function pointsFor(edge: MapEdge, a: Point, b: Point, sides: [Side, Side]): Point[] {
  if (edge.bendAfterRow !== undefined) {
    const y = PAD + edge.bendAfterRow * PITCH_Y + NODE_H + (PITCH_Y - NODE_H) / 2;
    return [a, { x: a.x, y }, { x: b.x, y }, b];
  }
  const [from, to] = sides;
  if (vertical(from) && vertical(to) && a.x !== b.x) {
    const y = (a.y + b.y) / 2;
    return [a, { x: a.x, y }, { x: b.x, y }, b];
  }
  if (!vertical(from) && !vertical(to) && a.y !== b.y) {
    const x = (a.x + b.x) / 2;
    return [a, { x, y: a.y }, { x, y: b.y }, b];
  }
  if (!vertical(from) && vertical(to)) return [a, { x: b.x, y: a.y }, b];
  if (vertical(from) && !vertical(to)) return [a, { x: a.x, y: b.y }, b];
  return [a, b];
}

/** Label on the longest run, beside a vertical line (by lane) or above a horizontal one. */
function labelAt(points: Point[], lane: number): RoutedEdge['label'] {
  let best = { length: -1, from: points[0]!, to: points[1]! };
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]!;
    const to = points[i + 1]!;
    const length = Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
    if (length > best.length) best = { length, from, to };
  }
  const mx = (best.from.x + best.to.x) / 2;
  const my = (best.from.y + best.to.y) / 2;
  if (best.from.x === best.to.x) {
    return { x: mx + (lane >= 0 ? 6 : -6), y: my + 4, anchor: lane >= 0 ? 'start' : 'end' };
  }
  return { x: mx, y: my - 6, anchor: 'middle' };
}

export function routeEdges(flow: MapFlow): RoutedEdge[] {
  const nodes = new Map(mapNodes(flow).map((node) => [node.id, node]));
  const routed: RoutedEdge[] = [];
  for (const edge of mapEdges(flow)) {
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    if (!from || !to) continue;
    const lane = edge.lane ?? 0;
    const sides = sidesFor(edge, from, to);
    const a = anchorOf(from, sides[0], lane);
    const b = anchorOf(to, sides[1], lane);
    const points = pointsFor(edge, a, b, sides);
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
    routed.push({ edge, d, label: labelAt(points, lane) });
  }
  return routed;
}

export function nodeBox(node: MapNode): { x: number; y: number } {
  return { x: PAD + node.col * PITCH_X, y: PAD + node.row * PITCH_Y };
}

/** The drawing's size, so the SVG viewBox fits the flow's own rows. */
export function mapSize(flow: MapFlow): { width: number; height: number } {
  const nodes = mapNodes(flow);
  const cols = Math.max(...nodes.map((n) => n.col));
  const rows = Math.max(...nodes.map((n) => n.row));
  return {
    width: PAD * 2 + cols * PITCH_X + NODE_W,
    height: PAD * 2 + rows * PITCH_Y + NODE_H,
  };
}

export const edgeKey = (edge: Pick<MapEdge, 'from' | 'to'>) => `${edge.from}>${edge.to}`;
