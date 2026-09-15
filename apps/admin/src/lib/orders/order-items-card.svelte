<!--
  The order's lines, and under each one what the customer actually configured.

  Split out of `order-detail-view.svelte` because it is the longest thing on that
  page and none of it needs the page: it reads items and a currency and renders.
-->
<script lang="ts">
  import type { RentalPeriod } from '@mia/pricing';

  import * as Card from '$lib/components/ui/card/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { formatDate, formatMoney, pluralize } from '~/lib/format';
  import type { OrderItem } from '~/lib/orders/types';

  interface Props {
    items: OrderItem[];
    currency: string;
  }

  let { items, currency }: Props = $props();

  /**
   * `unitPrice × quantity` is not the line total — the add-ons make up the rest.
   * Rather than leave an operator to reconcile two numbers, the configuration
   * row spells out where the difference comes from.
   *
   * Both ends are stamped on the order: the customer picked a start and the
   * package decided the return, so this reads the record rather than recomputing
   * a span the order already settled. The time shows only on an hour package.
   */
  function periodLabel(rental: RentalPeriod) {
    const at = (date: string, time: string | null) =>
      time ? `${formatDate(date)} ${time}` : formatDate(date);
    const span = `${at(rental.startDate, rental.startTime)} → ${at(rental.endDate, rental.endTime)}`;
    return `${span} · ${rental.duration} ${pluralize(rental.duration, rental.unit)}`;
  }
</script>

<Card.Root class="gap-0 overflow-hidden py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">Items</div>
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>Product</Table.Head>
        <Table.Head class="text-right">Qty</Table.Head>
        <Table.Head class="text-right">Unit</Table.Head>
        <Table.Head class="text-right">Total</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each items as item (item.id)}
        {@const config = item.configuration}
        <Table.Row class={config ? 'border-b-0' : ''}>
          <Table.Cell>
            <p class="font-medium">{item.productTitle}</p>
          </Table.Cell>
          <Table.Cell class="text-right tabular-nums">{item.quantity}</Table.Cell>
          <Table.Cell class="text-right tabular-nums">
            {formatMoney(item.unitPrice, currency)}
            {#if config?.pricingMode === 'rental'}
              <span class="block text-xs text-muted-foreground">per unit</span>
            {/if}
          </Table.Cell>
          <Table.Cell class="text-right tabular-nums">
            {formatMoney(item.total, currency)}
          </Table.Cell>
        </Table.Row>

        {#if config}
          <!--
            What the customer actually configured, frozen at the labels they
            read. It sits under its line rather than behind a disclosure: this
            is the sheet someone reads down the phone, and a rental period
            hidden behind a chevron is a rental period nobody checks.
          -->
          <Table.Row class="hover:bg-transparent">
            <Table.Cell colspan={4} class="pt-0 pb-4">
              <div class="space-y-2 border-l-2 pl-3 text-xs">
                {#if config.rental}
                  <p>
                    <span class="text-muted-foreground">Period</span>
                    <span class="ml-1 tabular-nums">{periodLabel(config.rental)}</span>
                  </p>
                {/if}

                {#if config.rentalPackage}
                  <p>
                    <span class="text-muted-foreground">Package</span>
                    <span class="ml-1">
                      {config.rentalPackage.name} ({config.rentalPackage.label}) ·
                      {formatMoney(config.rentalPackage.price, currency)}
                    </span>
                  </p>
                {/if}

                {#if config.answers.length > 0}
                  <div class="space-y-0.5">
                    {#each config.answers as answer, index (`${answer.key}-${index}`)}
                      <p>
                        <span class="text-muted-foreground">{answer.label}</span>
                        <span class="ml-1 font-medium">{answer.value}</span>
                      </p>
                    {/each}
                  </div>
                {/if}

                {#if config.addons.length > 0}
                  <div class="space-y-0.5">
                    {#each config.addons as addon (addon.id)}
                      <p class="flex justify-between gap-3">
                        <span>
                          <span class="text-muted-foreground">Extra</span>
                          <span class="ml-1">{addon.name}</span>
                          <span class="ml-1 text-muted-foreground">
                            ({formatMoney(addon.unitPrice, currency)}{addon.mode === 'rental'
                              ? ' per unit'
                              : ''}{addon.quantity > 1 ? ` × ${addon.quantity}` : ''})
                          </span>
                        </span>
                        <span class="tabular-nums">
                          {formatMoney(addon.total, currency)}
                        </span>
                      </p>
                    {/each}
                  </div>
                {/if}
              </div>
            </Table.Cell>
          </Table.Row>
        {/if}
      {:else}
        <Table.Row>
          <Table.Cell colspan={4} class="py-6 text-center text-muted-foreground">
            This order has no lines.
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</Card.Root>
