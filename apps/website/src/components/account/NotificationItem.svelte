<!--
  One notification.

  The sentence is not stored — the row carries a type and a payload, and the
  wording comes from the copy blob for this request's language. So a German
  customer reading a notice written months ago in an Italian transaction reads
  it in German, and nothing had to be translated at write time.

  The whole row is the link where there is somewhere to go, and following it
  marks it read: a customer who has opened the order has read the notice about
  it, and asking them to tick it off as well is busywork.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import type { CustomerNotification } from '~/lib/customer-session';
  import { formatDate } from '~/lib/customer-session';
  import { notificationValues } from '~/lib/notification-copy';
  import { fill } from '~/scripts/account/copy';

  import AccountLink from './AccountLink.svelte';

  interface Props {
    row: CustomerNotification;
  }

  const { row }: Props = $props();

  const { copy, notifications } = accountContext();

  const unread = $derived(row.readAt === null);

  /**
   * The payload's own fields, as fill values — status codes resolved to words
   * and ISO dates formatted. See `lib/notification-copy.ts` for why that
   * mapping is per event type.
   */
  const values = $derived(
    notificationValues(row.type, row.data as unknown as Record<string, unknown>, {
      status: copy.status,
      payment: copy.payment,
      formatDate,
    }),
  );

  /* Falls back to the type itself rather than to a blank: an event added to
     the server without its two label entries is a bug, and `order.upcoming`
     sitting in the feed says so to whoever can fix it. `@mia/i18n` fails `tsc`
     before that can ship, so this is a floor, not an expectation. */
  const sentence = $derived(copy.notifications[row.type] ?? { title: row.type, body: '' });
  const title = $derived(fill(sentence.title, values));
  const body = $derived(fill(sentence.body, values));

  /**
   * Where this leads. Most events name an order, and the order screen is the
   * one place that can answer "and then what".
   *
   * `contract.awaiting_signature` is the exception worth naming: signing needs
   * the one-time token from the email, which is deliberately not in the
   * payload, so this lands on the order rather than the signing page. Closing
   * that is one endpoint, planned in docs/plan/PLAN_app_push_notifications.html.
   */
  const orderNumber = $derived(
    'orderNumber' in row.data && typeof row.data.orderNumber === 'string'
      ? row.data.orderNumber
      : null,
  );

  function open() {
    if (unread) void notifications.markRead([row.id]);
  }
</script>

{#snippet inner()}
  <!-- The dot is the unread marker and it holds its space when read, so the
       row does not reflow the moment it is opened. -->
  <span
    class={`mt-1.75 size-2.25 flex-none rounded-full ${unread ? 'bg-accent' : 'bg-transparent'}`}
    aria-hidden="true"
  ></span>

  <span class="min-w-0 flex-1">
    <span class="flex flex-wrap items-baseline gap-x-2">
      <span class={`text-[15.5px] ${unread ? 'font-bold' : 'font-semibold'}`}>{title}</span>
      <time class="text-ink-2 text-[13px]" datetime={row.createdAt}>
        {formatDate(row.createdAt)}
      </time>
      {#if unread}
        <span
          class="bg-accent-tint rounded-field px-1.5 py-0.5 text-[11px] font-semibold text-accent uppercase"
        >
          {say(copy, 'account.notifications.new')}
        </span>
      {/if}
    </span>

    <span class="text-ink-2 mt-0.5 block text-[14.5px] leading-6">{body}</span>
  </span>
{/snippet}

<!-- `onclick` on the row, not on the link: the anchor is the thing you follow
     and this is a side effect of following it. A keyboard Enter on the anchor
     fires a click that bubbles here too, so both routes in agree. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<li class={unread ? 'bg-accent-tint/35' : ''} onclick={open}>
  {#if orderNumber}
    <AccountLink
      to={{ name: 'orderDetail', number: orderNumber }}
      class="hover:bg-tint-2 flex min-h-11 w-full items-start gap-3 px-4 py-3.5 no-underline transition"
    >
      {@render inner()}
    </AccountLink>
  {:else}
    <div class="flex w-full items-start gap-3 px-4 py-3.5">
      {@render inner()}
    </div>
  {/if}
</li>
