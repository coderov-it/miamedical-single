<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { relativeTime } from '~/lib/format';
  import type { OrderDetail } from '~/lib/orders/types';
  import { type MessageKey, t } from '~/lib/ui-text';

  let { order }: { order: OrderDetail } = $props();

  const CUSTOMER_TYPE_LABELS: Record<string, MessageKey> = {
    private: 'orders.customerPrivate',
    company: 'orders.customerCompany',
    tourist: 'orders.customerTourist',
  };

  function customerTypeLabel(type: string): string {
    const key = CUSTOMER_TYPE_LABELS[type];
    if (!key) return type;
    return t(key);
  }

  /**
   * Checkout takes whatever email it is given, so matching an existing account is
   * a claim until the customer confirms it from their own session. These labels
   * exist so the panel never presents an unconfirmed match as an identity.
   */
  const CUSTOMER_LINK_LABELS: Record<string, MessageKey> = {
    unverified: 'orders.linkUnverified',
    confirmed: 'orders.linkConfirmed',
    rejected: 'orders.linkRejected',
  };

  /** Which sentence describes how this order relates to a customer account. */
  function customerLinkLabel(): string {
    if (order.customerAccountId) {
      const key = CUSTOMER_LINK_LABELS[order.customerLinkStatus];
      return key ? t(key) : order.customerLinkStatus;
    }
    if (order.customerLinkStatus === 'rejected') return t('orders.linkRejected');
    return t('orders.customerGuest');
  }
</script>

<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">{t('orders.customerTitle')}</div>
  <div class="space-y-1 p-4 text-sm">
    <p>{order.email}</p>
    {#if order.phone}
      <!-- A tel: link, because the whole flow ends in a phone call. -->
      <p><a class="hover:underline" href={`tel:${order.phone}`}>{order.phone}</a></p>
    {/if}
    {#if order.customerType}
      <p class="text-muted-foreground">
        {customerTypeLabel(order.customerType)}
      </p>
    {/if}
    {#if order.partitaIva}
      <p class="text-muted-foreground">
        Partita IVA <span class="font-mono">{order.partitaIva}</span>
      </p>
    {/if}
    {#if order.codiceFiscale}
      <p class="text-muted-foreground">
        Codice fiscale <span class="font-mono">{order.codiceFiscale}</span>
      </p>
    {/if}
    <!-- An order is attached to an account on an email match alone, so the
         status beside it is what says whether anyone has vouched for that
         match. Never show "Registered account" on its own: unconfirmed and
         confirmed look identical, and only one of them is evidence. -->
    <p class="text-muted-foreground">
      {customerLinkLabel()}
    </p>
    <p class="text-muted-foreground">
      {t('orders.detailPlaced', { date: relativeTime(order.placedAt) })}
    </p>
  </div>
</Card.Root>
