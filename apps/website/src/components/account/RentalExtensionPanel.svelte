<!--
  The rental block on one order: when it comes back, and what the customer can
  do about it.

    rental order, still asking → the card and its heading, with a loading state
    running, nothing open      → "Extend rental" → pick a length → request
    request waiting for money  → what was asked, and "Withdraw request"
    paid, contract out         → "sign the contract we emailed you"
    returned (order closed)    → "Order again", one per rented product

  Flow and worked example: docs/code/rental-extensions.md.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';
  import { type CustomerOrderDetail, formatDate, formatMoney } from '~/lib/customer-session';
  import { formGate } from '~/lib/form-gate-action';
  import type { FieldGate, FormGate } from '~/lib/form-validation';
  import {
    type ExtensionOverview,
    getExtension,
    requestExtension,
    withdrawExtension,
  } from '~/lib/rental-extension';
  import { fill } from '~/scripts/account/copy';

  import LoadingState from '../primitives/LoadingState.svelte';
  import AccountSection from './AccountSection.svelte';
  import FieldError from './FieldError.svelte';
  import { ANNOUNCE, HINT, NOTICE_ERROR, PRIMARY, SECONDARY, TEXT_ACTION } from './fields';

  interface Props {
    order: CustomerOrderDetail;
  }

  const { order }: Props = $props();

  const { copy, session } = accountContext();

  let overview = $state<ExtensionOverview | null>(null);
  let failure = $state<string | null>(null);
  let choosing = $state(false);
  let days = $state<number | null>(null);
  let notice = $state<string | null>(null);
  let radios = $state<HTMLInputElement[]>([]);
  let announceEl = $state<HTMLElement>();
  let gate: FormGate | undefined;
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

  $effect(() => {
    void order.number;
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

  const gates = (): FieldGate[] => [
    { key: 'days', isSatisfied: () => days !== null, controls: () => radios },
  ];

  function submit(event: SubmitEvent) {
    event.preventDefault();
    /* Not the banned silent return: `enforce()` has marked the choice,
       focused it and announced why. */
    if (!gate?.enforce()) return;
    void send();
  }

  async function send() {
    if (busy || days === null) return;
    busy = true;
    try {
      await requestExtension(order.number, days);
      notice = say(copy, 'account.extension.requested');
      choosing = false;
      days = null;
      await load();
    } catch (error) {
      if (session.escalate(error)) return;
      failure = errorMessage(error, say(copy, 'account.genericError'));
    } finally {
      busy = false;
    }
  }

  async function withdraw() {
    if (busy) return;
    busy = true;
    try {
      await withdrawExtension(order.number);
      notice = null;
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
      {#if notice}
        <p class="bg-tint rounded-field mt-3 px-4 py-3 text-[15px]" role="status">{notice}</p>
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
        {:else if !choosing}
          <button class={PRIMARY + ' mt-4'} type="button" onclick={() => (choosing = true)}>
            {say(copy, 'account.extension.extend')}
          </button>
        {:else}
          <form
            class="mt-4 space-y-3"
            onsubmit={submit}
            use:formGate={{ gates, announce: () => announceEl ?? null, ready: (g) => (gate = g) }}
          >
            <fieldset class="space-y-2" data-gate="days">
              <legend class="font-ui text-ui mb-2 font-semibold">
                {say(copy, 'account.extension.pick')}
              </legend>
              {#each overview.options as option, index (option.days)}
                <label
                  class="border-hair rounded-field flex cursor-pointer items-center gap-3 border-2 px-4 py-3 has-[:checked]:border-accent"
                >
                  <input
                    type="radio"
                    name="days"
                    value={option.days}
                    bind:group={days}
                    bind:this={radios[index]}
                  />
                  <span class="flex-1">
                    <span class="block font-semibold">{option.label}</span>
                    <span class={HINT}>
                      {formatDate(option.fromDate)} → {formatDate(option.toDate)}
                    </span>
                  </span>
                  <span class="font-semibold tabular-nums">
                    {formatMoney(option.amount, overview.currency)}
                  </span>
                </label>
              {/each}
              <FieldError key="days" message={say(copy, 'account.extension.pickError')} />
            </fieldset>

            <div class="flex flex-wrap gap-3">
              <button class={PRIMARY} type="submit">{say(copy, 'account.extension.request')}</button
              >
              <button class={SECONDARY} type="button" onclick={() => (choosing = false)}>
                {say(copy, 'account.extension.cancel')}
              </button>
            </div>

            <p
              class={ANNOUNCE}
              role="status"
              aria-live="polite"
              bind:this={announceEl}
              data-message-one={say(copy, 'errorCountOne')}
              data-message-many={say(copy, 'errorCountMany')}
            ></p>
          </form>
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
