<script lang="ts">
  import { P } from '@mia/permissions';

  import * as Card from '$lib/components/ui/card/index.js';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { formatMoney } from '~/lib/format';
  import type { OrderDetail } from '~/lib/orders/types';
  import { session } from '~/lib/session.svelte';
  import { type MessageKey, t } from '~/lib/ui-text';

  interface Props {
    order: OrderDetail;
    /** Which action of the parent is in flight, so the controls wait for it. */
    busy: string | null;
    /** Saves the agreed delivery fee; the parent runs the request. */
    onSave: (amount: string) => void;
  }

  let { order, busy, onSave }: Props = $props();

  const canUpdate = $derived(session.can(P.ORDER_UPDATE));

  /**
   * How the order changes hands, in one line an operator can act on.
   *
   * The method comes back as its wire id, so it is titled here rather than shown
   * raw — and an id this build has never heard of falls through to itself instead
   * of to a blank, which is what makes an older stored order still readable.
   */
  const DELIVERY_LABELS: Record<string, MessageKey> = {
    homeDelivery: 'orders.deliveryHome',
    storePickup: 'orders.deliveryPickup',
  };

  function deliveryLabel(method: string): string {
    const key = DELIVERY_LABELS[method];
    if (!key) return method;
    return t(key);
  }

  const delivery = $derived(order.delivery);
  const deliveryMethod = $derived(delivery ? deliveryLabel(delivery.method) : null);
  /** The one detail the chosen method carries. */
  const deliveryDetail = $derived(
    [delivery?.deliveryAddress, delivery?.deliveryPostalCode, delivery?.pickupCity]
      .filter(Boolean)
      .join(' · '),
  );

  /**
   * Where the rental is collected from at the end.
   *
   * Only rendered when it is NOT the delivery address, because that is the case
   * that changes somebody's route. Saying "same address" on every order would put
   * a line on the card that never means anything.
   */
  const returnAddress = $derived(
    delivery && delivery.returnToSameAddress === false ? delivery.returnAddress : null,
  );

  /**
   * Whether this order still owes a delivery figure.
   *
   * Nothing prices delivery — every order is placed at 0,00 € and the storefront
   * has told the customer we will contact them about it — so a home delivery
   * sitting at zero is not free, it is UNAGREED, and it is the one thing on this
   * page an operator has to go and do. A collection owes nothing and says nothing.
   */
  const deliveryOwed = $derived(
    delivery?.method === 'homeDelivery' && Number(order.totals.shippingTotal) === 0,
  );

  /**
   * The amount an operator types after the phone call.
   *
   * A WRITABLE derived: the field owns it while it is being typed into, and any
   * fresh order arriving from the server resets it. That is what stops a status
   * move landing underneath this card from leaving a stale figure sitting in it.
   */
  let shippingDraft = $derived(order.totals.shippingTotal);

  const saveShipping = () => onSave(shippingDraft);
</script>

{#if delivery}
  <Card.Root class="gap-0 py-0">
    <div class="border-b px-4 py-2.5 text-sm font-medium">{t('orders.deliveryTitle')}</div>
    <div class="space-y-1 p-4 text-sm">
      <p class="font-medium">{deliveryMethod}</p>
      {#if deliveryDetail}
        <p class="text-muted-foreground">{deliveryDetail}</p>
      {/if}
      <!-- An unagreed delivery records 0,00 €, so the amount alone would
           read as free. The line beside it is what says a figure is owed. -->
      <p class="flex items-center gap-2 tabular-nums">
        <span class="text-muted-foreground">
          {formatMoney(order.totals.shippingTotal, order.totals.currency)}
        </span>
        {#if deliveryOwed}
          <span class="text-xs font-semibold text-amber-600 dark:text-amber-400">
            {t('orders.deliveryToAgree')}
          </span>
        {/if}
      </p>

      <!-- Where the agreed amount lands. The only way a delivery fee ever
           reaches an order, which is why it sits on the card the operator is
           already reading rather than behind an edit screen. Saving
           re-derives the order total on the server. -->
      {#if canUpdate}
        <div class="flex items-end gap-2 pt-2">
          <MoneyInput
            label={t('orders.deliveryFee')}
            bind:value={shippingDraft}
            suffix={order.totals.currency}
            disabled={busy !== null}
            dense
          />
          <BusyButton
            size="sm"
            variant="outline"
            class="h-8"
            busy={busy === 'shipping'}
            busyLabel={t('common.saving')}
            disabled={busy !== null || shippingDraft === order.totals.shippingTotal}
            onclick={saveShipping}
          >
            {t('common.save')}
          </BusyButton>
        </div>
      {/if}
      <!-- A different collection address is a second stop on somebody's day,
           so it is called out rather than folded into the detail line. -->
      {#if returnAddress}
        <p class="pt-1">
          <span class="text-xs font-semibold text-amber-600 dark:text-amber-400">
            {t('orders.collectFrom')}
          </span>
          <span class="text-muted-foreground">{returnAddress}</span>
        </p>
      {/if}
    </div>
  </Card.Root>
{/if}
