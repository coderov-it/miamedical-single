<!--
  Everything the shop has told this customer, newest first.

  No heading and no breadcrumb of its own — the shell paints both from the
  screen the URL names, the same arrangement the other three screens use.

  No category rail here, unlike the back office. An operator filters because
  they are reading everybody's events; a customer has their own orders and a
  handful of rows, and a filter would be three controls in front of a list you
  can already see the end of.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';
  import { errorMessage } from '~/lib/account-state.svelte';
  import { fill } from '~/scripts/account/copy';

  import NotificationItem from './NotificationItem.svelte';
  import NotificationPreferences from './NotificationPreferences.svelte';
  import { CARD } from './fields';

  const { copy, notifications } = accountContext();

  $effect(() => {
    void notifications.ensureLoaded();
  });

  const rows = $derived(notifications.rows);
  const unread = $derived(notifications.unread);

  const unreadLabel = $derived(
    fill(
      say(
        copy,
        unread === 1 ? 'account.notifications.unreadOne' : 'account.notifications.unreadMany',
      ),
      { count: unread },
    ),
  );
</script>

<NotificationPreferences />

{#if rows.length === 0 && notifications.loading}
  <p class="text-ink-2 text-[15px]" role="status">{say(copy, 'account.loading')}</p>
{:else if rows.length === 0 && notifications.error}
  <div class={CARD} role="status">
    <p class="text-danger text-sm">
      {errorMessage(notifications.error, say(copy, 'account.retry'))}
    </p>
    <button
      class="bg-tint hover:bg-tint-2 rounded-field text-ink mt-4 inline-flex min-h-11 items-center px-4 text-[15px] font-semibold transition"
      type="button"
      onclick={() => void notifications.refresh()}
    >
      {say(copy, 'retry')}
    </button>
  </div>
{:else if rows.length === 0}
  <div class={CARD + ' text-center'}>
    <p class="text-[15px] font-semibold">{say(copy, 'account.notifications.empty')}</p>
    <p class="text-ink-2 mx-auto mt-1.5 max-w-sm text-[14.5px] leading-6">
      {say(copy, 'account.notifications.emptyHint')}
    </p>
  </div>
{:else}
  <div class="border-hair rounded-card overflow-hidden border bg-white">
    <!--
      The bar carries the count and the one action that applies to the list as
      a whole. Mark-all is ABSENT with nothing unread, never present-and-
      disabled: a greyed control invites a click and then says nothing, which is
      the failure AGENTS.md § "Never block a customer" is about. An action with
      nothing to act on is not a blocked action — it is one that does not apply,
      and the count beside it already says why.
    -->
    <div
      class="border-hair flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3"
    >
      <p class="text-ink-2 text-[14px] font-semibold">
        {unread > 0 ? unreadLabel : say(copy, 'account.notifications.title')}
      </p>

      {#if unread > 0}
        <button
          class="rounded-field hover:bg-tint-2 -my-1 inline-flex min-h-11 items-center px-2 text-[14px] font-semibold text-accent transition"
          type="button"
          onclick={() => void notifications.markAllRead()}
        >
          {say(copy, 'account.notifications.markAllRead')}
        </button>
      {/if}
    </div>

    <ul class="divide-hair divide-y">
      {#each rows as row (row.id)}
        <NotificationItem {row} />
      {/each}
    </ul>

    {#if notifications.hasMore}
      <div class="border-hair border-t p-3 text-center">
        <button
          class="bg-tint hover:bg-tint-2 rounded-field text-ink inline-flex min-h-11 items-center px-4 text-[15px] font-semibold transition"
          type="button"
          onclick={() => void notifications.loadMore()}
        >
          {say(copy, 'account.notifications.loadMore')}
        </button>
      </div>
    {/if}
  </div>
{/if}
