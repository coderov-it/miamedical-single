<!--
  The inbox: everything the back office has to say to you, newest first.

  Two columns — a category rail on the left, the list on the right. The rail's
  buckets come from the event's own name (`order.placed` is an order), so a new
  event joins a bucket by being named and the two can never drift.

  The page stops at 1,440px rather than running to the shell's 1,600px, and sits
  centred in what is left. A feed row is one sentence, and a sentence set across
  the whole of a wide monitor is hard to track back to the start of the next
  line. The cap goes on the page, not on the grid inside it: cap only the grid
  and the title stays pinned to the workspace edge while the rail moves in,
  leaving the heading hanging off the left of the thing it names.

  Everything here is written from `uiLang`, including the chrome — so switching
  the topbar picker re-languages the whole screen, rows from months ago included.
  That works because a notification row stores a type and a payload, never a
  sentence.

  Open to any signed-in operator, with no permission of its own. Which events
  reach you was decided when each row was written, from the permissions you
  already hold; a grant here could only ever disagree with that.
-->
<script lang="ts">
  import { notificationCategoryLabel, notificationUiLabel } from '@mia/i18n';
  import { NOTIFICATION_CATEGORIES, type NotificationCategory } from '@mia/validators';
  import BellIcon from '@lucide/svelte/icons/bell';
  import CheckCheckIcon from '@lucide/svelte/icons/check-check';
  import FileSignatureIcon from '@lucide/svelte/icons/file-signature';
  import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
  import InboxIcon from '@lucide/svelte/icons/inbox';
  import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
  import type { Component } from 'svelte';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { cn } from '$lib/utils.js';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { notificationFeed, NotificationRow } from '~/lib/notifications';
  import { uiLang } from '~/lib/ui-lang.svelte';

  const t = $derived((key: Parameters<typeof notificationUiLabel>[0]) =>
    notificationUiLabel(key, uiLang.current),
  );

  /** Same icons the sidebar uses for the same areas, so the rail reads as a map. */
  const ICON: Record<NotificationCategory | 'all', Component> = {
    all: InboxIcon,
    order: ShoppingCartIcon,
    rental: CalendarClockIcon,
    contract: FileSignatureIcon,
  };

  const tabs = $derived(
    (['all', ...NOTIFICATION_CATEGORIES] as const).map((key) => ({
      key,
      label: notificationCategoryLabel(key, uiLang.current),
      icon: ICON[key],
      count: notificationFeed.counts[key],
      active:
        key === 'all' ? notificationFeed.category === null : notificationFeed.category === key,
    })),
  );

  /* The bell owns the stream, so it is already connected by the time this
     mounts. Refreshing on open is still right: the bell holds one short page,
     and arriving here is the moment to be sure the list is the current one. */
  $effect(() => {
    void notificationFeed.refresh();
  });

  function select(key: NotificationCategory | 'all') {
    void notificationFeed.setCategory(key === 'all' ? null : key);
  }
</script>

<section class="admin-page mx-auto w-full max-w-[1440px]">
  <PageHeader eyebrow="Overview" title={t('heading')} />

  <div class="grid gap-x-8 gap-y-5 md:grid-cols-[13rem_minmax(0,1fr)] md:items-start">
    <!-- The rail. A horizontal strip on a phone, a column from md up — the same
         list either way, so nothing is hidden behind a breakpoint. -->
    <aside class="md:sticky md:top-20">
      <p class="mb-2 hidden px-2 text-xs font-medium tracking-wide text-muted-foreground md:block">
        {t('filterHeading')}
      </p>

      <nav
        class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0"
        aria-label={t('filterHeading')}
      >
        {#each tabs as tab (tab.key)}
          {@const Icon = tab.icon}
          <button
            type="button"
            onclick={() => select(tab.key)}
            aria-pressed={tab.active}
            class={cn(
              'flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors md:w-full md:shrink',
              tab.active
                ? 'bg-accent font-medium text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )}
          >
            <Icon class="size-4 shrink-0" />
            <span class="truncate">{tab.label}</span>
            {#if tab.count.unread > 0}
              <!-- Unread, not total: the rail exists to say where the work is, and
                   a total would keep shouting long after the work was done. -->
              <span
                class="ml-auto min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[11px] leading-none font-medium text-primary-foreground tabular-nums"
              >
                {tab.count.unread}
              </span>
            {:else if tab.count.total > 0}
              <span class="ml-auto text-xs text-muted-foreground tabular-nums">
                {tab.count.total}
              </span>
            {/if}
          </button>
        {/each}
      </nav>

      <Separator class="my-3 hidden md:block" />

      <label
        class="mt-2 flex cursor-pointer items-center justify-between gap-2 px-2.5 text-sm text-muted-foreground md:mt-0"
      >
        <span>{t('unreadOnly')}</span>
        <Switch
          checked={notificationFeed.unreadOnly}
          onCheckedChange={(value) => void notificationFeed.setUnreadOnly(value)}
        />
      </label>
    </aside>

    <!--
      One panel, filling the column. Its own bar carries the state and the
      actions that belong to the list — the count of what is on screen, whether
      the stream is live, and mark-all-read. They sat in the page header before,
      which put them a long way from the rows they act on and left the panel
      looking like an orphan block below the title.
    -->
    <section class="min-w-0 overflow-hidden rounded-xl border bg-card">
      <header class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-3">
        <h2 class="text-sm font-semibold">
          {notificationCategoryLabel(notificationFeed.category ?? 'all', uiLang.current)}
        </h2>
        {#if notificationFeed.total > 0}
          <span class="text-xs text-muted-foreground tabular-nums">
            {notificationFeed.items.length} / {notificationFeed.total}
          </span>
        {/if}

        <div class="ml-auto flex items-center gap-2">
          <!-- Live rather than silent: a feed that has quietly stopped updating
               looks exactly like a quiet day, and the difference matters. -->
          {#if notificationFeed.connected}
            <span
              class="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
            >
              <span class="size-1.5 rounded-full bg-emerald-500"></span>
              {t('live')}
            </span>
          {:else}
            <span
              class="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
            >
              <Spinner class="size-3" />
              {t('reconnecting')}
            </span>
          {/if}

          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-xs"
            disabled={notificationFeed.unread === 0}
            onclick={() => notificationFeed.markAllRead()}
          >
            <CheckCheckIcon class="size-3.5" />
            {t('markAllRead')}
          </Button>
        </div>
      </header>

      {#if notificationFeed.error}
        <p class="border-b bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {notificationFeed.error}
        </p>
      {/if}

      {#if notificationFeed.items.length === 0 && notificationFeed.loading}
        <!-- Skeletons rather than a spinner in an empty box, matching
             `list-card.svelte`: a placeholder the shape of the answer keeps the
             page from resizing under the reader when the rows land. -->
        <ul class="divide-y">
          {#each [0, 1, 2] as row (row)}
            <li class="flex items-start gap-3 px-4 py-3.5">
              <Skeleton class="mt-1.5 size-2 shrink-0 rounded-full" />
              <div class="flex-1 space-y-2">
                <Skeleton class="h-3.5 w-40" />
                <Skeleton class="h-3.5 w-full max-w-sm" />
              </div>
            </li>
          {/each}
        </ul>
      {:else if notificationFeed.items.length === 0}
        <div class="flex flex-col items-center gap-2 px-6 py-20 text-center">
          <span
            class="mb-1 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <BellIcon class="size-5" />
          </span>
          <p class="text-sm font-medium">
            {notificationFeed.unreadOnly ? t('allCaughtUp') : t('empty')}
          </p>
          <p class="max-w-xs text-sm text-muted-foreground">{t('emptyHint')}</p>
        </div>
      {:else}
        <ul class="divide-y">
          {#each notificationFeed.items as row (row.id)}
            <li><NotificationRow {row} /></li>
          {/each}
        </ul>

        {#if notificationFeed.hasMore}
          <div class="border-t p-3 text-center">
            <Button
              variant="outline"
              size="sm"
              disabled={notificationFeed.loading}
              onclick={() => notificationFeed.loadMore()}
            >
              {#if notificationFeed.loading}<Spinner class="size-3.5" />{/if}
              {t('loadMore')}
            </Button>
          </div>
        {/if}
      {/if}
    </section>
  </div>
</section>
