<!--
  Everything that has happened to the order, oldest first, because that is how a
  sequence reads. `customerLink` joined `status`, `paymentStatus` and `contract`
  on the one timeline, and `extension` after it, so the field is named on every entry.
  `email` is a send that failed: it has no "from", only the message that did not go.
-->
<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { cn } from '$lib/utils.js';
  import { contractStatusMeta } from '~/lib/contracts/status';
  import { formatDateTime, orDash } from '~/lib/format';
  import { emailEventMeta } from '~/lib/orders/email-event';
  import { inspectionMeta } from '~/lib/orders/inspection';
  import { manualEventMeta } from '~/lib/orders/manual-order';
  import { orderStatusMeta, paymentStatusMeta } from '~/lib/orders/status';
  import type { OrderEvent } from '~/lib/orders/types';
  import { type MessageKey, t } from '~/lib/ui-text';
  import { extensionStatusMeta } from '~/lib/rentals/extension-status';

  interface Props {
    events: OrderEvent[];
  }

  let { events }: Props = $props();

  const FIELD_LABELS: Record<string, MessageKey> = {
    status: 'orders.fieldStatus',
    paymentStatus: 'orders.fieldPayment',
    customerLink: 'orders.fieldCustomerLink',
    contract: 'orders.fieldContract',
    extension: 'orders.fieldExtension',
    email: 'orders.fieldEmail',
    inspection: 'orders.fieldInspection',
    discount: 'newOrder.fieldDiscount',
    link: 'newOrder.fieldLink',
  };

  function fieldLabel(field: string): string {
    const key = FIELD_LABELS[field];
    if (!key) return field;
    return t(key);
  }

  function actorLabel(event: OrderEvent): string {
    const name = event.actorName ?? t('orders.actorSystem');
    if (event.actorKind === 'customer') return t('orders.actorCustomer', { name });
    return name;
  }

  function eventMeta(field: string, toValue: string) {
    if (field === 'status') return orderStatusMeta(toValue);
    if (field === 'contract') return contractStatusMeta(toValue);
    if (field === 'extension') return extensionStatusMeta(toValue);
    if (field === 'email') return emailEventMeta(toValue);
    if (field === 'inspection') return inspectionMeta(toValue);
    if (field === 'discount' || field === 'link') return manualEventMeta(field, toValue);
    return paymentStatusMeta(toValue);
  }

  /** The value an event moved away from, labelled like the one it moved to. */
  function fromLabel(event: OrderEvent): string {
    if (!event.fromValue) return orDash(event.fromValue);
    return eventMeta(event.field, event.fromValue).label;
  }
</script>

<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">{t('orders.timelineTitle')}</div>
  <div class="p-4">
    {#if events.length === 0}
      <p class="text-sm text-muted-foreground">{t('orders.timelineEmpty')}</p>
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
                  {fieldLabel(event.field)}
                </span>
                {#if event.field !== 'email' && event.field !== 'link' && event.field !== 'inspection'}
                  {fromLabel(event)}
                  <span class="text-muted-foreground">→</span>
                {/if}
                <span class="font-medium">{meta.label}</span>
              </p>
              {#if event.note}
                <p class="mt-0.5 text-sm text-muted-foreground">{event.note}</p>
              {/if}
              <!-- The actor's side is spelled out: "Confirmed" by an operator
                   and by the customer are different facts, and a bare name
                   reads as staff. -->
              <p class="mt-0.5 text-xs text-muted-foreground">
                {actorLabel(event)} · {formatDateTime(event.createdAt)}
              </p>
            </div>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</Card.Root>
