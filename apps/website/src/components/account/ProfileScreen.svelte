<!--
  Account home: what the customer came for, at a glance.

  This screen used to be a bare column — a title, one tinted row and two forms
  stacked to the full width of a `max-w-2xl`, which is not what an area looks
  like. It now opens with the two facts an account is FOR (how many orders, and
  when the last one was), then the three most recent of them, then the two
  things that are settings rather than content.

  IT LOADS THE ORDER LIST, and that is deliberate: the count and the last order
  are the reason the area feels like one, and `AccountStore` memoises the
  promise, so arriving here and then opening Ordini costs exactly one request
  instead of two.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';
  import { formatDate } from '~/lib/customer-session';

  import AccountLink from './AccountLink.svelte';
  import AccountSection from './AccountSection.svelte';
  import OrderCard from './OrderCard.svelte';
  import PasswordForm from './PasswordForm.svelte';
  import ProfileForm from './ProfileForm.svelte';
  import { BROWSE, CARD, TILE_LABEL } from './fields';
  import LoadingState from '../primitives/LoadingState.svelte';

  const { copy, orders, session } = accountContext();

  $effect(() => {
    void orders.ensureOrders();
  });

  const rows = $derived(orders.rows);
  const recent = $derived((rows ?? []).slice(0, 3));
  /** Newest first, so the head of the list is the last order placed. */
  const lastOrder = $derived(rows?.[0]);
  /** The list itself runs edge to edge; every other state keeps the padded body. */
  const listed = $derived(recent.length > 0 && !orders.listError);
</script>

<dl class="grid gap-4 sm:grid-cols-2">
  <div class={CARD}>
    <dt class={TILE_LABEL}>{say(copy, 'account.orders.breadcrumb')}</dt>
    <dd class="mt-2 text-[1.75rem]/none font-bold tabular-nums">
      {rows === null ? '—' : orders.total}
    </dd>
  </div>

  <div class={CARD}>
    <dt class={TILE_LABEL}>{say(copy, 'account.summary.lastOrder')}</dt>
    <dd class="mt-2 text-[1.0625rem] font-semibold">
      {lastOrder ? formatDate(lastOrder.placedAt) : '—'}
    </dd>
  </div>
</dl>

<AccountSection class="mt-6" title={say(copy, 'account.orders.recent')} flush={listed}>
  {#snippet action()}
    <AccountLink
      to={{ name: 'orders' }}
      class="min-h-0 text-[15px] font-semibold text-accent no-underline hover:underline"
    >
      {say(copy, 'account.orders.viewAll')}
    </AccountLink>
  {/snippet}

  {#if rows === null}
    <LoadingState variant="inline" label={say(copy, 'account.orders.loading')} />
  {:else if orders.listError}
    <div class="bg-danger-tint text-danger rounded-field px-4 py-3 text-sm" role="status">
      {errorMessage(orders.listError, say(copy, 'account.retry'))}
    </div>
  {:else if recent.length === 0}
    <p class="text-ink-2 text-[15px]">{say(copy, 'account.orders.empty')}</p>
    <a class={BROWSE + ' mt-4'} href={copy.routes.catalog}>
      {say(copy, 'account.orders.browse')}
    </a>
  {:else}
    <ul class="divide-hair divide-y">
      {#each recent as order (order.number)}
        <OrderCard {order} />
      {/each}
    </ul>
  {/if}
</AccountSection>

<AccountSection class="mt-8" title={say(copy, 'yourDetails')}>
  <ProfileForm />
</AccountSection>

<div class="mt-6">
  <PasswordForm />
</div>
