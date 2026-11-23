<!--
  Every place this order could go, drawn once, with its own route lit. Shown on
  request only: the stepper and the Actions card carry the everyday path, this
  is for "where does a missed delivery lead?". Layout is in `status-map.ts`,
  what is lit in `status-map-highlight.ts`.
-->
<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { cn } from '$lib/utils.js';
  import { highlightFor } from '~/lib/orders/status-map-highlight';
  import {
    edgeKey,
    mapNodes,
    mapSize,
    nodeBox,
    NODE_H,
    NODE_W,
    routeEdges,
    type MapNode,
  } from '~/lib/orders/status-map';
  import { orderStatusMeta } from '~/lib/orders/status';
  import type { OrderDetail } from '~/lib/orders/types';
  import { t } from '~/lib/ui-text';

  interface Props {
    order: OrderDetail;
    open: boolean;
    onClose: () => void;
  }

  let { order, open, onClose }: Props = $props();

  const nodes = $derived(mapNodes(order.flow));
  const edges = $derived(routeEdges(order.flow));
  const size = $derived(mapSize(order.flow));
  const lit = $derived(highlightFor(order));

  function labelOf(node: MapNode): string {
    const label = node.label;
    if (label.kind === 'text') return t(label.key);
    if (label.kind === 'status') return orderStatusMeta(label.status).label;
    return label.statuses.map((status) => orderStatusMeta(status).label).join(' / ');
  }

  /** The second line of an inspection box: how many units went that way. */
  function detailOf(node: MapNode): string {
    const { counts } = lit;
    if (node.id === 'stockBack' && counts.stockBack > 0) {
      return t('orders.mapCount', { count: counts.stockBack });
    }
    if (node.id !== 'attention' || counts.attention === 0) return '';
    const total = t('orders.mapCount', { count: counts.attention });
    if (counts.attentionOpen === 0) return total;
    return `${total} · ${t('orders.mapOpen', { count: counts.attentionOpen })}`;
  }

  type Look = 'current' | 'done' | 'next' | 'idle';

  function lookOf(node: MapNode): Look {
    if (node.id === lit.current) return 'current';
    if (lit.visited.has(node.id)) return 'done';
    if (lit.next.has(node.id)) return 'next';
    return 'idle';
  }

  function boxClass(node: MapNode, look: Look): string {
    if (look === 'current') {
      return node.warn ? 'fill-orange-500 stroke-orange-500' : 'fill-primary stroke-primary';
    }
    if (look === 'done') {
      return node.warn ? 'fill-orange-500/10 stroke-orange-500' : 'fill-primary/10 stroke-primary';
    }
    if (look === 'next') return 'fill-card stroke-primary';
    return node.warn ? 'fill-card stroke-orange-500/40' : 'fill-card stroke-border';
  }

  function textClass(node: MapNode, look: Look): string {
    if (look === 'current') return node.warn ? 'fill-white' : 'fill-primary-foreground';
    if (look === 'done' && node.warn) return 'fill-orange-600 dark:fill-orange-400';
    if (look === 'idle') return 'fill-muted-foreground';
    return 'fill-foreground';
  }

  const legend = [
    { label: 'orders.mapLegendCurrent', box: 'fill-primary stroke-primary', dash: false },
    { label: 'orders.mapLegendDone', box: 'fill-primary/10 stroke-primary', dash: false },
    { label: 'orders.mapLegendNext', box: 'fill-card stroke-primary', dash: true },
    { label: 'orders.mapLegendIdle', box: 'fill-card stroke-border', dash: false },
  ] as const;
</script>

<Dialog.Root {open} onOpenChange={(next) => !next && onClose()}>
  <Dialog.Content class="sm:max-w-4xl">
    <Dialog.Header>
      <Dialog.Title>{t('orders.mapTitle', { number: order.number })}</Dialog.Title>
    </Dialog.Header>

    <!-- Narrow screens scroll the drawing inside the dialog, never the page. -->
    <div class="max-h-[70vh] overflow-auto rounded-lg border bg-card">
      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        class="h-auto w-full min-w-[640px]"
        role="img"
        aria-label={t('orders.mapTitle', { number: order.number })}
      >
        <defs>
          <marker
            id="map-arrow-on"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10z" class="fill-primary" />
          </marker>
          <marker
            id="map-arrow-off"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10z" class="fill-muted-foreground/40" />
          </marker>
        </defs>

        {#each edges as { edge, d, label } (edgeKey(edge))}
          {@const on = lit.traversed.has(edgeKey(edge))}
          <path
            {d}
            fill="none"
            class={on ? 'stroke-primary' : 'stroke-muted-foreground/40'}
            stroke-width={on ? 2 : 1.5}
            marker-end={on ? 'url(#map-arrow-on)' : 'url(#map-arrow-off)'}
          />
          {#if edge.label}
            <text
              x={label.x}
              y={label.y}
              text-anchor={label.anchor}
              class="fill-muted-foreground stroke-card text-[11px]"
              stroke-width="3"
              style="paint-order: stroke"
            >
              {t(edge.label)}
            </text>
          {/if}
        {/each}

        {#each nodes as node (node.id)}
          {@const look = lookOf(node)}
          {@const box = nodeBox(node)}
          {@const detail = detailOf(node)}
          {#if look === 'current'}
            <rect
              x={box.x - 4}
              y={box.y - 4}
              width={NODE_W + 8}
              height={NODE_H + 8}
              rx="11"
              fill="none"
              stroke-width="2"
              class={node.warn ? 'stroke-orange-500/40' : 'stroke-primary/40'}
            />
          {/if}
          <rect
            x={box.x}
            y={box.y}
            width={NODE_W}
            height={NODE_H}
            rx="8"
            stroke-width="1.5"
            stroke-dasharray={look === 'next' || (node.time && look !== 'done') ? '5 3' : undefined}
            class={boxClass(node, look)}
          />
          <text
            x={box.x + NODE_W / 2}
            y={box.y + NODE_H / 2 + (detail ? -3 : 4)}
            text-anchor="middle"
            class={cn('text-xs font-medium', textClass(node, look))}
          >
            {labelOf(node)}
          </text>
          {#if detail}
            <text
              x={box.x + NODE_W / 2}
              y={box.y + NODE_H / 2 + 12}
              text-anchor="middle"
              class={cn('text-[11px]', textClass(node, look))}
            >
              {detail}
            </text>
          {/if}
          {#if look === 'next'}
            <rect
              x={box.x + NODE_W - 38}
              y={box.y - 8}
              width="34"
              height="15"
              rx="7.5"
              class="fill-primary"
            />
            <text
              x={box.x + NODE_W - 21}
              y={box.y + 3}
              text-anchor="middle"
              class="fill-primary-foreground text-[10px] font-medium"
            >
              {t('orders.mapNextTag')}
            </text>
          {/if}
        {/each}
      </svg>
    </div>

    <ul class="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {#each legend as item (item.label)}
        <li class="flex items-center gap-1.5">
          <svg viewBox="0 0 16 12" class="h-3 w-4" aria-hidden="true">
            <rect
              x="1"
              y="1"
              width="14"
              height="10"
              rx="3"
              stroke-width="1.5"
              stroke-dasharray={item.dash ? '3 2' : undefined}
              class={item.box}
            />
          </svg>
          {t(item.label)}
        </li>
      {/each}
    </ul>
  </Dialog.Content>
</Dialog.Root>
