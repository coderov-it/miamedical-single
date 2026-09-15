<!--
  Everything that has happened to the order, oldest first, because that is how a
  sequence reads. `customerLink` joined `status`, `paymentStatus` and `contract`
  on the one timeline, so the field is named on every entry.
-->
<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { cn } from '$lib/utils.js';
  import { contractStatusMeta } from '~/lib/contracts/status';
  import { formatDateTime, orDash } from '~/lib/format';
  import { orderStatusMeta, paymentStatusMeta } from '~/lib/orders/status';
  import type { OrderEvent } from '~/lib/orders/types';

  interface Props {
    events: OrderEvent[];
  }

  let { events }: Props = $props();

  const FIELD_LABELS: Record<string, string> = {
    status: 'Status',
    paymentStatus: 'Payment',
    customerLink: 'Account link',
    contract: 'Contract',
  };

  function eventMeta(field: string, toValue: string) {
    if (field === 'status') return orderStatusMeta(toValue);
    if (field === 'contract') return contractStatusMeta(toValue);
    return paymentStatusMeta(toValue);
  }
</script>

<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">Timeline</div>
  <div class="p-4">
    {#if events.length === 0}
      <p class="text-sm text-muted-foreground">Nothing has happened since this order was placed.</p>
    {:else}
      <ol class="space-y-0">
        {#each events as event, index (event.id)}
          {@const meta = eventMeta(event.field, event.toValue)}
          <li class="flex gap-3">
            <div class="flex flex-col items-center">
              <span class={cn('mt-1.5 size-2 shrink-0 rounded-full', meta.dot)}></span>
              {#if index < events.length - 1}
                <span class="w-px flex-1 bg-border"></span>
              {/if}
            </div>
            <div class="pb-4">
              <p class="text-sm">
                <span class="text-muted-foreground">
                  {FIELD_LABELS[event.field] ?? event.field}
                </span>
                {orDash(event.fromValue)}
                <span class="text-muted-foreground">→</span>
                <span class="font-medium">{meta.label}</span>
              </p>
              {#if event.note}
                <p class="mt-0.5 text-sm text-muted-foreground">{event.note}</p>
              {/if}
              <!-- The actor's side is spelled out: "Confirmed" by an operator
                   and by the customer are different facts, and a bare name
                   reads as staff. -->
              <p class="mt-0.5 text-xs text-muted-foreground">
                {event.actorName ?? 'System'}{event.actorKind === 'customer' ? ' (customer)' : ''} · {formatDateTime(
                  event.createdAt,
                )}
              </p>
            </div>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</Card.Root>
