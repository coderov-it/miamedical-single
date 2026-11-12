<!--
  "Pay now" on an unpaid order in the customer area, until its deadline.

    order MIA-2026-001042, pending, unpaid, payBy 13 Nov 10:00
    → "Your order is waiting for payment" · "Pay by 13/11/26, 10:00…" · [Pay now]
    → POST /api/customer/payments/orders/MIA-2026-001042 → the gateway's page

  Shown only while `payBy` is set: the server clears it once the order is paid,
  cancelled, or past its deadline. Flow: docs/code/online-payments.md.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { API_BASE } from '~/lib/api-base';
  import type { CustomerOrderDetail } from '~/lib/customer-session';
  import { fill } from '~/scripts/account/copy';
  import { documentLocale } from '~/scripts/locale';
  import { goToPayment, payOrder } from '~/scripts/payment/client';

  import { NOTICE_ERROR, PRIMARY, SPINNER } from './fields';

  interface Props {
    order: CustomerOrderDetail;
  }

  const { order }: Props = $props();
  const { copy } = accountContext();

  let busy = $state(false);
  let failed = $state(false);

  function formatDue(iso: string | null): string {
    if (!iso) return '';
    const format = new Intl.DateTimeFormat(documentLocale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    return format.format(new Date(iso));
  }

  const due = $derived(formatDue(order.payBy));
  const payLabel = $derived(busy ? 'openingPayment' : 'payNow');

  async function pay() {
    /* Re-entry guard, NOT a `disabled` — see fields.ts. */
    if (busy) return;
    busy = true;
    failed = false;
    try {
      goToPayment(await payOrder(API_BASE, order.number), copy.routes.paymentResult);
    } catch {
      failed = true;
      busy = false;
    }
  }
</script>

{#if order.payBy}
  <div
    class="bg-tint mt-5 flex flex-col items-start gap-3 rounded-xl border-2 border-accent px-5 py-4"
  >
    <strong class="text-[16px]">{say(copy, 'orderAwaitingPayment')}</strong>
    <p class="text-ink-2 text-[15px]">{fill(say(copy, 'account.order.payBy'), { time: due })}</p>
    {#if failed}
      <p class={NOTICE_ERROR} role="alert">{say(copy, 'payment.openFailed')}</p>
    {/if}
    <button class={PRIMARY} type="button" aria-busy={busy} onclick={pay}>
      <span class={SPINNER} aria-hidden="true"></span>
      {say(copy, payLabel)}
    </button>
  </div>
{/if}
