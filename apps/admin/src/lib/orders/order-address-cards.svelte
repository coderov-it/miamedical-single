<!-- Shipping and billing addresses (one card when identical) and the order notes. -->
<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { orDash } from '~/lib/format';
  import type { OrderAddress, OrderDetail } from '~/lib/orders/types';
  import { t } from '~/lib/ui-text';

  let { order }: { order: OrderDetail } = $props();

  const ADDRESS_FIELDS = [
    'fullName',
    'line1',
    'line2',
    'postalCode',
    'city',
    'region',
    'country',
    'phone',
  ] as const satisfies ReadonlyArray<keyof OrderAddress>;

  /**
   * Most orders bill to the address they ship to, and two identical cards are a
   * second thing to read that says nothing — they also hand the sidebar a card's
   * worth of height the order beside it has no content to match. Matching
   * addresses collapse to one card whose title names both; differing ones stand
   * apart, which is the case an operator has to notice.
   */
  function addressCards() {
    const shipping = order.shippingAddress;
    const billing = order.billingAddress;
    const same =
      shipping !== null &&
      billing !== null &&
      ADDRESS_FIELDS.every((field) => shipping[field] === billing[field]);
    if (same) return [{ title: t('orders.addressShippingBilling'), value: shipping }];
    return [
      { title: t('orders.addressShipping'), value: shipping },
      { title: t('orders.addressBilling'), value: billing },
    ].filter((entry) => entry.value !== null);
  }

  const addresses = $derived(addressCards());
</script>

{#each addresses as entry (entry.title)}
  {@const address = entry.value}
  <Card.Root class="gap-0 py-0">
    <div class="border-b px-4 py-2.5 text-sm font-medium">{entry.title}</div>
    <address class="space-y-0.5 p-4 text-sm not-italic">
      <p>{orDash(address?.fullName)}</p>
      <p class="text-muted-foreground">{orDash(address?.line1)}</p>
      {#if address?.line2}<p class="text-muted-foreground">{address.line2}</p>{/if}
      <p class="text-muted-foreground">
        {orDash(address?.postalCode)}
        {orDash(address?.city)}{address?.region ? ` (${address.region})` : ''}
      </p>
      <p class="text-muted-foreground">{orDash(address?.country)}</p>
      {#if address?.phone}<p class="text-muted-foreground">{address.phone}</p>{/if}
    </address>
  </Card.Root>
{/each}

{#if order.notes}
  <Card.Root class="gap-0 py-0">
    <div class="border-b px-4 py-2.5 text-sm font-medium">{t('orders.notesTitle')}</div>
    <p class="p-4 text-sm whitespace-pre-wrap">{order.notes}</p>
  </Card.Root>
{/if}
