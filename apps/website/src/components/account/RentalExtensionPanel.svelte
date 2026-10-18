<!--
  The rental block on one order: when it comes back, and what the customer can
  do about it.

    rental order, still asking → the card and its heading, with a loading state
    running, nothing open      → "Prolunga il noleggio" → the renewal modal
                                 (renewal/RenewalDialog.svelte: length, sign, confirm)
    renewal waiting for money  → what was asked, and "Withdraw request"
    paid, contract out         → "sign the contract we emailed you" (operator-raised)
    returned (order closed)    → "Order again", one per rented product

  Flow and worked example: docs/code/rental-extensions.md.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';
  import { type CustomerOrderDetail, formatDate, formatMoney } from '~/lib/customer-session';
  import { type ExtensionOverview, getExtension, withdrawExtension } from '~/lib/rental-extension';
  import { fill } from '~/scripts/account/copy';

  import LoadingState from '../primitives/LoadingState.svelte';
  import AccountSection from './AccountSection.svelte';
  import { HINT, NOTICE_ERROR, PRIMARY, TEXT_ACTION } from './fields';

  interface Props {
    order: CustomerOrderDetail;
  }

  const { order }: Props = $props();

  const { copy, session, renewal } = accountContext();

  let overview = $state<ExtensionOverview | null>(null);
  let failure = $state<string | null>(null);
  /** Re-entry guard. NOT a `disabled` on the button — see fields.ts. */
  let busy = false;

  async function load() {
    try {
      overview = await getExtension(order.number, copy.locale);
      failure = null;
    } catch (error) {
      if (session.escalate(error)) return;
      failure = errorMessage(error, say(copy, 'account.genericError'));
    }
  }

  /* Again after the modal places a renewal, so the card says what is pending. */
  $effect(() => {
    void order.number;
    void renewal.placed;
    void load();
  });

  /** Back to the loading state first, so the old error is not on screen while it asks again. */
  function retry() {
    failure = null;
    void load();
  }

  /** One link per rented product: each is reconfigured fresh on its own page. */
  const reorderLinks = $derived.by(() => {
    const seen = new Set<string>();
    const links: { href: string; title: string }[] = [];
    for (const item of order.items) {
      const slug = item.configuration?.productSlug;
      if (!slug || item.configuration?.pricingMode !== 'rental' || seen.has(slug)) continue;
      seen.add(slug);
      links.push({ href: `${copy.routes.product}${slug}/`, title: item.productTitle });
    }
    return links;
  });

  /* Known from the order itself, so the card is on screen from the first paint
     instead of popping in seconds later as an unexplained block. The overview
     still has the last word: an order it calls `no_rental` loses the card. */
  const isRental = $derived(
    order.items.some((item) => item.configuration?.pricingMode === 'rental'),
  );
  const visible = $derived(overview ? overview.blockedBy !== 'no_rental' : isRental);

  const extended = $derived(overview?.history.filter((row) => row.status === 'active') ?? []);

  async function withdraw() {
    if (busy) return;
    busy = true;
    try {
      await withdrawExtension(order.number);
      await load();
    } catch (error) {
      if (session.escalate(error)) return;
      failure = errorMessage(error, say(copy, 'account.genericError'));
    } finally {
      busy = false;
    }
  }
</script>

{#if visible}
  <AccountSection class="mt-6" title={say(copy, 'account.extension.title')}>
    {#if !overview}
      {#if failure}
        <p class={NOTICE_ERROR + ' mt-3'} role="alert">{failure}</p>
        <button class={TEXT_ACTION + ' mt-3'} type="button" onclick={retry}>
          {say(copy, 'retry')}
        </button>
      {:else}
        <LoadingState variant="inline" label={say(copy, 'account.extension.loading')} />
      {/if}
    {:else}
      {#if failure}
        <p class={NOTICE_ERROR + ' mt-3'} role="alert">{failure}</p>
      {/if}

      {#if overview.blockedBy === 'closed'}
        <p class={HINT + ' mt-2'}>{say(copy, 'account.extension.closed')}</p>
        <div class="mt-4 flex flex-wrap gap-3">
          {#each reorderLinks as link (link.href)}
            <a class={PRIMARY + ' inline-flex items-center'} href={link.href}>
              {#if reorderLinks.length > 1}
                {fill(say(copy, 'account.extension.orderAgainItem'), { product: link.title })}
              {:else}
                {say(copy, 'account.extension.orderAgain')}
              {/if}
            </a>
          {/each}
        </div>
      {:else}
        {#if overview.endDate}
          <p class="mt-2 text-[15px]">
            {fill(say(copy, 'account.extension.dueBack'), { date: formatDate(overview.endDate) })}
          </p>
        {/if}

        {#if overview.open?.status === 'renew_pending'}
          <p class={HINT + ' mt-3'}>
            {fill(say(copy, 'account.extension.pendingPayment'), {
              days: overview.open.days,
              date: formatDate(overview.open.toDate),
              amount: formatMoney(overview.open.amount, overview.open.currency),
            })}
          </p>
          <button class={TEXT_ACTION + ' mt-3'} type="button" onclick={withdraw}>
            {say(copy, 'account.extension.withdraw')}
          </button>
        {:else if overview.open?.status === 'awaiting_signature'}
          <p class={HINT + ' mt-3'}>
            {fill(say(copy, 'account.extension.pendingSignature'), {
              date: formatDate(overview.open.toDate),
            })}
          </p>
        {:else if overview.blockedBy === 'hourly'}
          <p class={HINT + ' mt-3'}>{say(copy, 'account.extension.hourly')}</p>
        {:else if overview.options.length === 0}
          <p class={HINT + ' mt-3'}>{say(copy, 'account.extension.noOptions')}</p>
        {:else}
          <button
            class={PRIMARY + ' mt-4'}
            type="button"
            onclick={() => renewal.open(order.number)}
          >
            {say(copy, 'account.extension.extend')}
          </button>
        {/if}

        {#if extended.length > 0}
          <ul class="border-hair mt-4 space-y-1 border-t pt-3">
            {#each extended as row (row.id)}
              <li class={HINT}>
                {fill(say(copy, 'account.extension.extendedTo'), {
                  from: formatDate(row.fromDate),
                  to: formatDate(row.toDate),
                })}
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    {/if}
  </AccountSection>
{/if}
